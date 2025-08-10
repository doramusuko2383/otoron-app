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
    .upsert([{ firebase_uid: uid, email, name, avatar_url }], { onConflict: "firebase_uid" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
