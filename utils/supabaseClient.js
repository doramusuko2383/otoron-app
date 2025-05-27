// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { firebaseAuth } from "../firebase/firebase-init.js";

const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';

// Firebase の ID トークンをヘッダーに付与する fetch ラッパー
async function authFetch(input, init = {}) {
  const user = firebaseAuth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${idToken}`,
      };
    } catch (e) {
      console.warn('⚠️ Firebase ID トークン取得失敗:', e);
    }
  }
  return fetch(input, init);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: authFetch },
});

