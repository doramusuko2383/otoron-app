import { supabase } from "./supabaseClient.js";

function safeName({ displayName, email, existingName }) {
  return (
    (existingName && existingName.trim()) ||
    (displayName && displayName.trim()) ||
    (email?.split("@")[0] ?? "なまえ")
  );
}

export async function ensureAppUserRecord({ uid, email, name: displayName, avatar_url }) {
  let existingName = null;
  try {
    const { data: ex } = await supabase
      .from("users")
      .select("id,name")
      .eq("firebase_uid", uid)
      .single();
    existingName = ex?.name ?? null;
  } catch (_) {}

  const name = safeName({ displayName, email, existingName });

  const { data, error } = await supabase
    .from("users")
    .upsert(
      [{ firebase_uid: uid, email, name, avatar_url }],
      { onConflict: "firebase_uid" }
    )
    .select("*")
    .single();
  if (error) throw error;
  const updatedAt = data.updated_at;
  let user = data;
  if (user.trial_end_date == null) {
    const trialEnd = new Date(updatedAt);
    trialEnd.setDate(trialEnd.getDate() + 7);
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
