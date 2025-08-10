import { AuthController } from '../src/authController.js'

export async function ensureSupabaseUser(){
  const auth = AuthController.get()
  if (!auth.user) throw new Error('No Firebase user')
  const idToken = await auth.user.getIdToken()
  const email = auth.user.email || ''
  const name  = auth.user.displayName || (email ? email.split('@')[0] : 'no-name')

  const res = await fetch('/api/sync-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, email, name })
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(t || 'A server error has occurred')
  }
  return await res.json()
}
