import { supabase } from '/scripts/supabaseClient.js'; // パスは環境に応じて調整

// URLフラグメントからトークンをSupabaseに渡す
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // 正常にログイン完了 → ホームへリダイレクト
    window.location.href = '/';
  }
});

// 上記が反応しないケースに備えて、一度URLパラメータから復元処理
supabase.auth.getSession().then(({ data }) => {
  if (!data?.session) {
    // フラグメントをクエリとして処理
    supabase.auth.exchangeCodeForSession(window.location.hash)
      .then(() => {
        window.location.href = '/';
      })
      .catch((err) => {
        console.error('ログイン処理エラー:', err);
        document.getElementById('message').textContent = 'ログイン処理に失敗しました。';
      });
  }
});
