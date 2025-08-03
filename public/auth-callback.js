import { supabase } from './utils/supabaseClient.js';

async function handleOAuthRedirect() {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hashParams.get('access_token');

  if (accessToken) {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabaseセッション取得:', data, error);

    if (!error && data.session) {
      window.location.href = '/home.html';
      return;
    }
  }

  const message = document.getElementById('message');
  if (message) {
    message.textContent = 'ログインに失敗しました。もう一度お試しください。';
  }
}

handleOAuthRedirect();
