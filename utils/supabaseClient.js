// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches available OIDC providers from Supabase and logs them.
 *
 * The result shows which provider slugs can be used when signing in
 * with `supabase.auth.signInWithIdToken`.
 */
export async function fetchAvailableProviders() {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    console.log("Available providers:", json.external);
    return json.external;
  } catch (err) {
    console.error("Failed to fetch OIDC providers:", err);
    return null;
  }
}
