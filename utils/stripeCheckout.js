import { firebaseAuth } from '../firebase/firebase-init.js';

export async function startCheckout() {
  const email = firebaseAuth.currentUser?.email;
  if (!email) {
    alert('ログイン情報がありません');
    return;
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const session = await response.json();
    const stripe = Stripe('pk_test_51RUmpu4aOXt1PnHZ4QI4ED8IqIZstCQTAMzMm6isjY34QP5ESFYKClhQSwRI8d52n80G4c2FgPQTvFXLjOQG9Yl400wFCPpXca');
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error', err);
    alert('決済処理でエラーが発生しました');
  }
}
