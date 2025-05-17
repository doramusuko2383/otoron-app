// utils/growthStore_supabase.js

import { supabase } from "../components/supabaseClient.js";

/**
 * 和音の進捗（解放状態）を取得
 * @param {string} userId - SupabaseのユーザーID
 * @returns {Promise<Object>} 例: { "aka": { unlocked: true }, ... }
 */
export async function loadGrowthFlags(userId) {
  const { data, error } = await supabase
    .from("user_chord_progress")
    .select("chord_key, status")
    .eq("user_id", userId);

  if (error) {
    console.error("❌ 和音進捗の取得失敗:", error);
    return {};
  }

  const flags = {};
  data.forEach(row => {
    flags[row.chord_key] = {
      unlocked: row.status === "completed" || row.status === "unlocked"
    };
  });

  return flags;
}

/**
 * 和音を任意解放（手動で解放された状態に変更）
 * @param {string} userId - ユーザーID
 * @param {string} chordKey - 和音識別子（例: "aka"）
 */
export async function markChordAsUnlocked(userId, chordKey) {
  const { error } = await supabase
    .from("user_chord_progress")
    .update({
      status: "unlocked",
      unlocked_date: new Date().toISOString().split("T")[0],
      manual_override: true
    })
    .eq("user_id", userId)
    .eq("chord_key", chordKey);

  if (error) {
    console.error(`❌ 和音 ${chordKey} の任意解放に失敗:`, error);
  } else {
    console.log(`✅ 和音 ${chordKey} を手動で解放しました`);
  }
}
