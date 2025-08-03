import { supabase } from './supabaseClient.js';
import { addDebugLog } from './loginDebug.js';

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  addDebugLog('signInWithGoogle start');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth-callback.html',
    },
  });
  if (error) {
    addDebugLog('signInWithGoogle error', { message: error.message });
    console.error('Google sign-in error:', error);
  } else {
    addDebugLog('signInWithGoogle redirect');
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChanged(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    addDebugLog('supabase onAuthStateChange', { event, hasSession: !!session });
    callback(session?.user ?? null);
  });
  return () => {
    data.subscription.unsubscribe();
  };
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/reset-password.html`,
  });
}

export async function updateUser(attributes) {
  return supabase.auth.updateUser(attributes);
}
