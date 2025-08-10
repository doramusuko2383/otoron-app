export async function ensureSupabaseUser(auth) {
  const { data: { session }, error } = await auth.supabase.auth.getSession()
  if (error) throw error
  const user = session?.user
  if (!user) return { user: null, isNew: false, needsProfile: false }

  const payload = { uid: user.id, email: user.email }

  const res = await fetch('/api/sync-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return await res.json()
}
