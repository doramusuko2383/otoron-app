import { supabase } from "./supabaseClient.js";

function safeName({ displayName, email, existingName }) {
  return (
    (existingName && existingName.trim()) ||
    (displayName && displayName.trim()) ||
    (email?.split("@")[0] ?? "なまえ")
  );
}

export async function ensureAppUserRecord({ uid, email, name: displayName, avatar_url }) {
  let existingUser = null;
  try {
    const { data: ex } = await supabase
      .from("users")
      .select("id,name,start")
      .eq("firebase_uid", uid)
      .single();
    existingUser = ex ?? null;
  } catch (_) {}

  const name = safeName({
    displayName,
    email,
    existingName: existingUser?.name ?? null,
  });

  const insert = { firebase_uid: uid, email, name, avatar_url };
  if (!existingUser) insert.start = null;

  const { data, error } = await supabase
    .from("users")
    .upsert([insert], { onConflict: "firebase_uid" })
    .select("*")
    .single();
  if (error) throw error;
  let user = data;
  // ★ 修正ポイント：updated_atではなくcreated_atを優先、なければ現在時刻。
  if (!user.trial_end_date) {
    const base = user.created_at ? new Date(user.created_at) : new Date();
    const trialEnd = new Date(base);
    // タイムゾーンずれ防止のためUTCで加算
    trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        trial_end_date: trialEnd.toISOString(),
        trial_active: true,
      })
      .eq("id", user.id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    user = updated;
  }

  return user;
}

