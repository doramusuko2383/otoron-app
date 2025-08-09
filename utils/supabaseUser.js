export async function ensureSupabaseUser(firebaseUser) {
  if (!firebaseUser) return { user: null, isNew: false };

  const idToken = await firebaseUser.getIdToken();
  try {
    const res = await fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        idToken,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Supabaseユーザー同期エラー:', text);
      throw new Error(text);
    }

    return await res.json();
  } catch (e) {
    console.error('❌ Supabaseユーザー同期失敗:', e);
    throw e;
  }
}
