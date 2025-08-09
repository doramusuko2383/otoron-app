export async function ensureSupabaseUser(auth) {
  const user = auth.currentUser;
  if (!user) return { user: null, isNew: false };

  const idToken = await user.getIdToken(true);
  const payload = { uid: user.uid, email: user.email, idToken };

  const res = await fetch('/api/sync-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}
