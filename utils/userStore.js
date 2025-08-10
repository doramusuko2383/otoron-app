import { supabase } from "./supabaseClient.js";

export async function ensureAppUserRecord({ uid, email, name, avatar_url }) {
  const { data, error } = await supabase
    .from("users")
    .upsert([{ firebase_uid: uid, email, name, avatar_url }], { onConflict: "firebase_uid" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
