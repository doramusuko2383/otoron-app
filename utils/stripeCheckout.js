import { firebaseAuth } from '../firebase/firebase-init.js';
import { showToast } from './toast.js';

export async function startCheckout(priceId) {
  // currentUser が null の瞬間を避ける
  let user = firebaseAuth.currentUser;
  if (!user) {
    await new Promise((resolve) => {
      const unsub = firebaseAuth.onAuthStateChanged((u) => {
        if (u) {
          user = u;
          unsub();
          resolve();
        }
      });
      setTimeout(() => {
        unsub();
        resolve();
      }, 1500); // フォールバック
    });
  }
  if (!user?.email) {
    showToast('ログイン情報が確認できません。もう一度ログインしてください。');
    return;
  }
  const idToken = await user.getIdToken(true); // 最新のトークンを取得

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        idToken,
        priceId,
      }),
    });

    if (!res.ok) {
      console.error('No session ID returned:', await res.json());
      return;
    }
    const { sessionId } = await res.json();
    if (typeof window.Stripe !== 'function') {
      console.warn('Stripe SDK is not loaded; skipping redirect');
      return;
    }
    // Use publishable key from environment if available
    const key =
      window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_xxx';
    const stripe = Stripe(key);
    await stripe.redirectToCheckout({ sessionId });
  } catch (err) {
    console.error('Stripe checkout error', err);
    showToast('決済処理でエラーが発生しました');
  }
}
