// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { firebaseAuth } from "../firebase/firebase-init.js";

const supabaseUrl = 'https://flnqyramgddjcbbaispx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbnF5cmFtZ2RkamNiYmFpc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjEwMDcsImV4cCI6MjA2MzgzNzAwN30.ARtrCplVHw7Q0gdDjsaoHp6__CNulye_IMWIqFmacqc';

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

