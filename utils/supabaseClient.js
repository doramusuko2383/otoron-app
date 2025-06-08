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

// ---- debug wrappers ----
// Log whenever signIn or signInWithIdToken is invoked. This helps detect
// unexpected authentication flows.
if (typeof supabase.auth.signIn === "function") {
  const orig = supabase.auth.signIn.bind(supabase.auth);
  supabase.auth.signIn = async (...args) => {
    console.log("[debug] supabase.auth.signIn called", args);
    return orig(...args);
  };
}
if (typeof supabase.auth.signInWithIdToken === "function") {
  const origId = supabase.auth.signInWithIdToken.bind(supabase.auth);
  supabase.auth.signInWithIdToken = async (...args) => {
    console.log("[debug] supabase.auth.signInWithIdToken called", args);
    return origId(...args);
  };
}
