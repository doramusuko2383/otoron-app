import { firebaseAuth } from '../firebase/firebase-init.js';
import { showCustomAlert } from '../components/home.js';

let stripePromise;

function waitForStripe(maxMs = 2000, step = 50) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (typeof window.Stripe === 'function') return resolve();
      if (Date.now() - started > maxMs) return reject(new Error('Stripe.js not loaded'));
      setTimeout(tick, step);
    };
    tick();
  });
}

async function getStripe() {
  if (!stripePromise) {
    await waitForStripe().catch(() => {
      console.warn('Stripe.js not loaded; skipping init');
    });
    const res = await fetch('/api/public-config');
    const { publishableKey } = await res.json();
    stripePromise = Stripe(publishableKey);
  }
  return stripePromise;
}

export async function startCheckout(plan) {
  const email = firebaseAuth.currentUser?.email || '未取得';
  if (!firebaseAuth.currentUser?.email) {
    showCustomAlert('ログイン情報がありません');
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
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) console.error('Stripe checkout error', error);
    } else {
      console.error('No session ID returned:', data);
    }
  } catch (err) {
    console.error('Stripe checkout error', err);
    showCustomAlert('決済処理でエラーが発生しました');
  }
}
