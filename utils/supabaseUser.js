import { AuthController } from '../src/authController.js'

export async function ensureSupabaseUser(){
  const auth = AuthController.get()
  // セッション確定を保証（念のため）
  if (!auth.user) throw new Error('No Supabase session')
  const { id: uid, email } = auth.user

  const res = await fetch('/api/sync-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email })
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(t || 'sync-user failed')
  }
  return await res.json()
}
