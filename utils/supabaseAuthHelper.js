import { supabase } from './supabaseClient.js';

const DUMMY = 'secure_dummy_password';

export async function ensureSupabaseAuth(emailOrUser) {
  const email = typeof emailOrUser === 'string' ? emailOrUser : emailOrUser?.email;
  if (!email) return;

  let { data, error } = await supabase.auth.signInWithPassword({ email, password: DUMMY });
  if (!error) return data;

  if (/invalid login/i.test(error.message)) {
    const { error: upErr } = await supabase.auth.signUp({
      email,
      password: DUMMY,
      options: { emailRedirectTo: undefined }
    });
    if (upErr && !/already registered/i.test(upErr.message)) throw upErr;

    const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: DUMMY });
    if (siErr) throw siErr;
    return;
  }

  throw error;
}
