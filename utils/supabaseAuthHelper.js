import { supabase } from './supabaseClient.js';

export async function ensureSupabaseAuth(firebaseUser, password) {
  if (!firebaseUser) return { user: null, isNew: false };

  const email = firebaseUser.email;

  // Supabase Auth にメール＋パスワードでサインイン
  console.log('🟢 Supabase signInWithPassword:', {
    email,
    password,
    length: password.length,
  });
  let {
    data: { user: authUser },
    error: loginError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.error('❌ Supabase login error:', loginError.message);
    if (loginError.message.includes('Invalid login credentials')) {
      console.log('🟡 Supabase signUp attempt with:', {
        email,
        password,
        length: password.length,
      });
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('❌ Supabase signUp error:', signUpError.message);
      }
      if (signUpError && !signUpError.message.includes('User already registered')) {
        throw signUpError;
      }

      console.log('🔁 Retry login after signUp:', { email, password });
      ({ data: { user: authUser }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));

      if (loginError) {
        console.error('❌ Supabase retry login error:', loginError.message);
        throw loginError;
      }
    } else {
      throw loginError;
    }
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

