import { AuthController, AuthState } from '../src/authController.js';
import { showToast } from './toast.js';
import { getBaseUser } from '../main.js';

export async function startCheckout(priceId) {
  const auth = AuthController.get();
  if (auth.state !== AuthState.Authed) {
    await auth.loginWithGoogle();
    return;
  }
  const profile = getBaseUser();
  const userId = profile?.id || auth.user?.uid;
  const email = profile?.email || auth.user?.email;

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId,
        email,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.sessionId) {
      console.error('No session ID returned:', json);
      showToast('チェックアウトの開始に失敗しました。時間をおいて再試行してください。');
      return;
    }
    const { sessionId } = json;
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
