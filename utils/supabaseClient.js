// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://xnccwydcesyvqvyqafbg.supabase.co";
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
