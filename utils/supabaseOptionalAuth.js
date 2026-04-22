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
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: DUMMY,
    });
    if (!signInErr && signInData?.session) return true;

    if (signInErr && !/invalid login/i.test(signInErr.message || '')) {
      if (!quiet) console.warn('[supabase-init] sign-in failed:', signInErr);
      else console.debug('[supabase-init] sign-in failed');
      return false;
    }
  } catch (e) {
    if (!quiet) console.warn('[supabase-init] sign-in threw:', e);
    else console.debug('[supabase-init] sign-in threw');
    return false;
  }

  try {
    const { error: upErr } = await supabase.auth.signUp({ email, password: DUMMY });
    if (upErr && upErr?.status !== 422) {
      if (!quiet) console.warn('[supabase-init] sign-up failed:', upErr);
      else console.debug('[supabase-init] sign-up failed');
      return false;
    }

    const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
      email,
      password: DUMMY,
    });
    if (!retryErr && retryData?.session) return true;

    if (!quiet) console.warn('[supabase-init] retry sign-in failed:', retryErr);
    else console.debug('[supabase-init] retry sign-in failed');
    return false;
  } catch (e) {
    if (!quiet) console.warn('[supabase-init] optional init failed:', e);
    else console.debug('[supabase-init] optional init failed');
    return false;
  }
}
