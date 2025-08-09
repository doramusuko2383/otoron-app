import { supabase } from './supabaseClient.js';
import { showToast } from './toast.js';

export async function startCheckout(priceId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    showToast('ログイン情報が確認できません。もう一度ログインしてください。');
    return;
  }

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        email: user.email,
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
