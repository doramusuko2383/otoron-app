import { supabase } from './supabaseClient.js';
const DUMMY = 'secure_dummy_password';

let triedSupabaseAuth = false;

export async function ensureSupabaseAuth(email, { quiet = true } = {}) {
  if (triedSupabaseAuth) return false;
  triedSupabaseAuth = true;

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) return true;
  } catch (_) {}

  try {
    await supabase.auth.signInWithPassword({ email, password: DUMMY });
    return true;
  } catch (e) {
    try {
      const { error: upErr } = await supabase.auth.signUp({ email, password: DUMMY });
      if (!upErr || upErr?.status === 422) {
        try {
          await supabase.auth.signInWithPassword({ email, password: DUMMY });
          return true;
        } catch {}
      }
    } catch {}

    if (!quiet) console.warn('[supabase-init] optional init failed:', e);
    else console.debug('[supabase-init] optional init failed');
    return false;
  }
}
