import { supabase } from './supabaseClient.js';
import { showCustomAlert } from '../components/home.js';

export async function startCheckout(button) {
  if (!button || button.disabled) return;
  const plan = button.dataset.plan;
  if (!plan) return;
  const origText = button.textContent;
  button.disabled = true;
  button.textContent = '処理中…';

  try {
    let { data: { user } } = await supabase.auth.getUser();
    let firebaseUser = firebaseAuth.currentUser;
    if (!user?.email) {
      firebaseUser = firebaseUser ?? await whenAuthSettled();
      if (firebaseUser?.email) {
        await ensureSupabaseAuth(firebaseUser);
        ({ data: { user } } = await supabase.auth.getUser());

        if (!user?.email) {
          await ensureSupabaseAuth(firebaseUser);
          ({ data: { user } } = await supabase.auth.getUser());
        }
      }
    }

    if (!user?.email) {
      showCustomAlert('ログインしてください');
      button.disabled = false;
      button.textContent = origText;
      return;
    }

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan })
    });
    const json = await res.json();
    if (json?.url) {
      window.location.href = json.url;
    } else {
      throw new Error('セッションURLの取得に失敗しました');
    }
  } catch (e) {
    console.error(e);
    showCustomAlert('決済の開始に失敗しました。時間をおいて再度お試しください。');
    button.disabled = false;
    button.textContent = origText;
  }
}
