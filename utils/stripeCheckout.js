import { showToast } from './toast.js';
import { authController } from '../src/authController.js';
import { getBaseUser, switchScreen } from '../main.js';

export async function startCheckout(priceId) {
  if (authController.state !== 'authed' || !authController.user) {
    showToast('ログインが必要です');
    switchScreen('login');
    return;
  }
  const user = getBaseUser();
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId: user?.id,
        email: user?.email || authController.user.email,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      console.error('No checkout URL returned', json);
      showToast('チェックアウトの開始に失敗しました');
      const btn = document.createElement('button');
      btn.textContent = '再ログイン';
      btn.onclick = () => switchScreen('login');
      document.body.appendChild(btn);
      return;
    }
    location.href = json.url;
  } catch (err) {
    console.error('Stripe checkout error', err);
    showToast('決済処理でエラーが発生しました');
    const btn = document.createElement('button');
    btn.textContent = '再ログイン';
    btn.onclick = () => switchScreen('login');
    document.body.appendChild(btn);
  }
}
