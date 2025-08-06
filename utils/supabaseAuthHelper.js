import { supabase } from './supabaseClient.js';

const DUMMY_PASSWORD = 'secure_dummy_password';

export async function ensureSupabaseAuth(firebaseUser) {
  if (!firebaseUser) return { user: null, isNew: false };

  const email = firebaseUser.email;
  let authUser = null;

  // まず Firebase の ID トークンでサインインを試みる
  try {
    const idToken = await firebaseUser.getIdToken();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'firebase',
      token: idToken,
    });
    if (error) throw error;
    authUser = data.user;
    console.log('🟢 Supabase signInWithIdToken succeeded');
  } catch (idError) {
    console.warn('⚠️ Supabase signInWithIdToken failed:', idError?.message || idError);

    // Fallback: ダミーパスワードでサインイン
    let {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password: DUMMY_PASSWORD,
    });
    authUser = user;

    if (loginError) {
      console.error('❌ Supabase login error:', loginError.message);

      if (loginError.message.includes('Invalid login credentials')) {
        // サインアップを試みる
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DUMMY_PASSWORD,
        });

        if (signUpError && !signUpError.message.includes('User already registered')) {
          console.error('❌ Supabase signUp error:', signUpError.message);
          return { user: null, isNew: false };
        }

        // サインインを再試行
        ({ data: { user: authUser }, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: DUMMY_PASSWORD,
        }));

        if (loginError) {
          console.error('⚠️ Supabase retry login error:', loginError.message);
          return { user: null, isNew: false };
        }
      } else {
        return { user: null, isNew: false };
      }
    }
  }

  if (!authUser) {
    console.warn('⚠️ Supabase authentication failed. Firebase login only.');
    return { user: null, isNew: false };
  }

  // ユーザー情報を users テーブルで確認・作成
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

