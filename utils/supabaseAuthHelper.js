import { supabase } from './supabaseClient.js';

export async function ensureSupabaseAuth(firebaseUser) {
  if (!firebaseUser) return { user: null, isNew: false };
  const email = firebaseUser.email;

  const ensureSessionWithIdToken = async () => {
    const token = await firebaseUser.getIdToken();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'firebase',
      token,
    });
    if (error) {
      console.error('❌ Supabase IDトークンログイン失敗:', error.message);
      throw error;
    }
  };

  await ensureSessionWithIdToken();

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

