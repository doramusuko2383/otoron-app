import { supabase } from './supabaseClient.js';

const DUMMY_PASSWORD = 'secure_dummy_password';

export async function ensureSupabaseAuth(firebaseUser) {
  if (!firebaseUser) return { user: null, isNew: false };
  const email = firebaseUser.email;

  // Check our users table
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUser.uid)
    .maybeSingle();
  if (checkError) {
    console.error('❌ Supabaseユーザー確認エラー:', checkError);
    throw checkError;
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: DUMMY_PASSWORD,
    });
    return error;
  };

  if (!existingUser) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: DUMMY_PASSWORD,
    });
    if (signUpError && !signUpError.message.includes('User already registered')) {
      console.error('❌ Supabaseユーザー作成失敗:', signUpError.message);
      throw signUpError;
    }

    const signInError = await signIn();
    if (signInError) {
      console.error('❌ Supabaseログイン失敗:', signInError.message);
      throw signInError;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          firebase_uid: firebaseUser.uid,
          name: firebaseUser.displayName || '名前未設定',
          email,
        },
      ])
      .select()
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('❌ Supabaseユーザー登録失敗:', insertError);
      throw insertError || new Error('insert failed');
    }

    return { user: inserted, isNew: true };
  } else {
    let signInError = await signIn();
    if (signInError) {
      // If credentials mismatch, attempt sign up once
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DUMMY_PASSWORD,
        });
        if (signUpError && !signUpError.message.includes('User already registered')) {
          console.error('❌ Supabaseユーザー作成失敗:', signUpError.message);
          throw signUpError;
        }
        signInError = await signIn();
      }
      if (signInError) {
        console.error('❌ Supabaseログイン失敗:', signInError.message);
        throw signInError;
      }
    }

    let user = existingUser;
    if (!user.email || user.email !== email) {
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', user.id)
        .select()
        .maybeSingle();
      if (!updateError && updated) {
        user = updated;
      }
    }

    return { user, isNew: false };
  }
}
