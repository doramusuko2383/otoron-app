// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Immediately sign out to clear any stale session that might trigger
// undesired authentication flows such as id_token exchange.
try {
  await supabase.auth.signOut();
} catch (e) {
  console.warn("[debug] Initial supabase.signOut failed", e);
}

// ---- debug wrappers ----
// Log whenever signIn or signInWithIdToken is invoked. This helps detect
// unexpected authentication flows.
if (typeof supabase.auth.signIn === "function") {
  const orig = supabase.auth.signIn.bind(supabase.auth);
  supabase.auth.signIn = async (...args) => {
    if (args[0] && args[0].provider === "firebase") {
      console.warn("[debug] signIn with provider 'firebase' blocked");
      return { data: null, error: new Error("signIn with firebase provider disallowed") };
    }
    return orig(...args);
  };
}
if (typeof supabase.auth.signInWithIdToken === "function") {
  supabase.auth.signInWithIdToken = async (...args) => {
    console.warn("[debug] signInWithIdToken blocked");
    return { data: null, error: new Error("signInWithIdToken disabled") };
  };
}

const DUMMY = 'secure_dummy_password';

export async function ensureSupabaseAuth(emailOrUser) {
  const email = typeof emailOrUser === 'string' ? emailOrUser : emailOrUser?.email;
  if (!email) return { user: null, isNew: false };

  let { data, error } = await supabase.auth.signInWithPassword({ email, password: DUMMY });
  if (!error && data?.user) return { user: data.user, isNew: false };

  if (error && /invalid login/i.test(error.message)) {
    const { error: upErr } = await supabase.auth.signUp({
      email,
      password: DUMMY,
      options: { emailRedirectTo: undefined }
    });
    if (upErr && !/already registered/i.test(upErr.message)) throw upErr;

    const { data: signInData, error: siErr } = await supabase.auth.signInWithPassword({ email, password: DUMMY });
    if (siErr) throw siErr;
    return { user: signInData.user, isNew: true };
  }

  throw error;
}
