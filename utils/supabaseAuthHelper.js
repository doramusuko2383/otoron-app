import { supabase } from './supabaseClient.js';

const DUMMY_PASSWORD = 'secure_dummy_password';

export async function ensureSupabaseAuth(firebaseUser, password) {
  if (!firebaseUser) return { user: null, isNew: false };
  const email = firebaseUser.email;
  const provider = firebaseUser.providerData?.[0]?.providerId;
  const fallbackPassword =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('currentPassword')
      : null;

  const ensureSessionWithPassword = async () => {
    const signIn = async (pwd = DUMMY_PASSWORD) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      return error;
    };

    let err = await signIn(password);
    if (err) {
      if (err.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DUMMY_PASSWORD,
        });
        if (signUpError && !signUpError.message.includes('User already registered')) {
          console.error('❌ Supabaseユーザー作成失敗:', signUpError.message);
          throw signUpError;
        }
        if (signUpError && signUpError.message.includes('User already registered') && fallbackPassword) {
          err = await signIn(fallbackPassword);
        } else {
          err = await signIn();
        }
      }
      if (err && err.message.includes('Invalid login credentials') && fallbackPassword) {
        err = await signIn(fallbackPassword);
      }
    }
    if (err) {
      console.error('❌ Supabaseログイン失敗:', err.message);
      throw err;
    }
  };

  const ensureSessionWithIdToken = async () => {
    const token = await firebaseUser.getIdToken();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    });
    if (error) {
      console.error('❌ Supabase IDトークンログイン失敗:', error.message);
      throw error;
    }
  };

  if (provider === 'google.com') {
    await ensureSessionWithIdToken();
  } else {
    await ensureSessionWithPassword();
  }

  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUser.uid)
    .maybeSingle();
  if (checkError) {
    console.error('❌ Supabaseユーザー確認エラー:', checkError);
    throw checkError;
  }

  if (!existingUser) {
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .upsert(
        [
          {
            firebase_uid: firebaseUser.uid,
            name: '名前未設定',
            email,
            trial_active: true,
            trial_end_date: trialEnd,
          },
        ],
        { onConflict: 'firebase_uid' }
      )
      .select()
      .maybeSingle();

    if (insertError || !inserted) {
      console.error('❌ Supabaseユーザー登録失敗:', insertError);
      throw insertError || new Error('insert failed');
    }

    return { user: inserted, isNew: true };
  } else {
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

