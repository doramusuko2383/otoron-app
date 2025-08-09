import { firebaseAuth } from '../firebase/firebase-init.js';

export async function startCheckout(plan) {
  // auth 確定を待つ（currentUser が空の瞬間対策）
  let user = firebaseAuth.currentUser;
  if (!user) {
    await new Promise(resolve => {
      const unsub = firebaseAuth.onAuthStateChanged(u => { if (u) { user = u; unsub(); resolve(); } });
      // フォールバック: 1.5秒で解除
      setTimeout(() => { unsub(); resolve(); }, 1500);
    });
  }
  if (!user?.email) {
    alert('ログイン情報が確認できません。もう一度ログインしてください。');
    return;
  }
  const email = user.email;
  const idToken = await user.getIdToken(); // ← サーバで verifyIdToken する

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan, idToken })
    });

    const data = await response.json();
    if (data.id) {
      if (typeof window.Stripe !== 'function') {
        console.warn('Stripe SDK is not loaded; skipping redirect');
        return;
      }
      // Use publishable key from environment if available
      const key =
        window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_xxx';
      const stripe = Stripe(key);
      await stripe.redirectToCheckout({ sessionId: data.id });
    } else {
      console.error('No session ID returned:', data);
    }
  } catch (err) {
    console.error('Stripe checkout error', err);
    alert('決済処理でエラーが発生しました');
  }
}
