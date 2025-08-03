import { supabase } from './supabaseClient.js';

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  const redirectUrl = `${window.location.origin}/auth-callback.html`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) {
    console.error('Google sign-in error:', error);
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChanged(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
