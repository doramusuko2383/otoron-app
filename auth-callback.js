import { supabase } from '/scripts/supabaseClient.js'; // パスは環境に応じて調整
import { addDebugLog } from '/utils/loginDebug.js';

addDebugLog('auth-callback start');

// URLフラグメントからトークンをSupabaseに渡す
supabase.auth.onAuthStateChange((event, session) => {
  addDebugLog('auth-callback onAuthStateChange', { event, hasSession: !!session });
  if (event === 'SIGNED_IN' && session) {
    addDebugLog('auth-callback signed in');
    // 正常にログイン完了 → ホームへリダイレクト
    window.location.href = '/';
  }
});

// 上記が反応しないケースに備えて、一度URLパラメータから復元処理
supabase.auth.getSession().then(({ data }) => {
  addDebugLog('auth-callback getSession', { hasSession: !!data?.session });
  if (!data?.session) {
    // フラグメントをクエリとして処理
    supabase.auth.exchangeCodeForSession(window.location.hash)
      .then(() => {
        addDebugLog('auth-callback exchange success');
        window.location.href = '/';
      })
      .catch((err) => {
        addDebugLog('auth-callback exchange error', { message: err.message });
        console.error('ログイン処理エラー:', err);
        document.getElementById('message').textContent = 'ログイン処理に失敗しました。';
      });
  }
});
