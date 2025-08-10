import { AuthController } from '../src/authController.js'

function deriveName(user){
  const m = user?.user_metadata || {}
  return m.full_name || m.name || (user?.email ? user.email.split('@')[0] : 'no-name')
}

export async function ensureSupabaseUser(){
  const auth = AuthController.get()
  // セッション確定を保証（念のため）
  if (!auth.user) throw new Error('No Supabase session')
  const { id: uid, email } = auth.user
  const name = deriveName(auth.user)

  const res = await fetch('/api/sync-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, name })
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(t || 'A server error has occurred')
  }
  return await res.json()
}
