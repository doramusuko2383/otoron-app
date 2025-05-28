// utils/growthStore_supabase.js

import { supabase } from "./supabaseClient.js";

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
      unlocked: row.status === "in_progress"
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

/**
 * 直近7日分のモック記録を生成（デバッグ用）
 * @param {string} userId
 */
export async function generateMockGrowthData(userId) {
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const rec = {
      user_id: userId,
      date: dateStr,
      count: 60,
      correct: 58,
      sets: 3
    };
    const { error: recErr } = await supabase
      .from("training_records")
      .upsert(rec, { onConflict: "user_id,date" });
    if (recErr) console.error("❌ モック記録挿入失敗:", recErr);

    const ses = {
      user_id: userId,
      session_date: `${dateStr}T12:00:00`,
      correct_count: 58,
      total_count: 60,
      results_json: { mode: "recommended" },
      stats_json: { dummy: { total: 20 } }
    };
    const { error: sesErr } = await supabase
      .from("training_sessions")
      .insert(ses);
    if (sesErr) console.error("❌ モックセッション挿入失敗:", sesErr);
  }
}
