import { firebaseAuth } from '../firebase/firebase-init.js';

export async function startCheckout(plan) {
  const email = firebaseAuth.currentUser?.email || '未取得';
  if (!firebaseAuth.currentUser?.email) {
    alert('ログイン情報がありません');
    return;
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan })
    });

    const data = await response.json();
    if (data.id) {
      if (typeof window.Stripe !== 'function') {
        console.warn('Stripe SDK is not loaded; skipping redirect');
        return;
      }
      const stripe = Stripe('pk_test_51RUmpu4aOXt1PnHZ4QI4ED8IqIZstCQTAMzMm6isjY34QP5ESFYKClhQSwRI8d52n80G4c2FgPQTvFXLjOQG9Yl400wFCPpXca');
      await stripe.redirectToCheckout({ sessionId: data.id });
    } else {
      console.error('No session ID returned:', data);
    }
  } catch (err) {
    console.error('Stripe checkout error', err);
    alert('決済処理でエラーが発生しました');
  }
}
