import { supabase } from "./supabaseClient.js";
import { getPassedDays } from "./growthUtils.js";
import { chordOrder } from "../data/chords.js";
import { chords } from "../data/chords.js"; // ✅ 必須

// ✅ 新規ユーザー用：赤からスタート、他はlocked
export async function createInitialChordProgress(userId) {
  const chordKeys = chords.map(chord => chord.key); // すべての和音に対応

  const insertData = chordKeys.map((key, index) => ({
    user_id: userId,
    chord_key: key,
    status: index === 0 ? "in_progress" : "locked"
  }));

  const { error } = await supabase
    .from("user_chord_progress")
    .insert(insertData, { upsert: false }); // すでに入っていたら失敗させる

  if (error) {
    console.error("❌ 初期進捗の登録失敗:", error);
  }
}

// ✅ 合格日数が14日に達したら、次の和音に進める
export async function autoUnlockNextChord(user) {
  const passed = await getPassedDays(user.id);
  if (passed < 14) return;

  const { data: all } = await supabase
    .from("user_chord_progress")
    .select("chord_key, status")
    .eq("user_id", user.id);

  const currentIndex = chordOrder.findIndex(key =>
    all.find(row => row.chord_key === key && row.status === "in_progress")
  );

  if (currentIndex === -1 || currentIndex === chordOrder.length - 1) return;

  const currentChord = chordOrder[currentIndex];
  const nextChord = chordOrder[currentIndex + 1];

  await supabase
    .from("user_chord_progress")
    .update({ status: "completed" })
    .eq("user_id", user.id)
    .eq("chord_key", currentChord);

  await supabase
    .from("user_chord_progress")
    .update({ status: "in_progress" })
    .eq("user_id", user.id)
    .eq("chord_key", nextChord);

}

// ✅ 和音を解放（in_progressに）
export async function unlockChord(userId, chordKey) {
  const { error } = await supabase
    .from("user_chord_progress")
    .update({ status: "in_progress" })
    .eq("user_id", userId)
    .eq("chord_key", chordKey);
  return !error;
}

// ✅ 和音を再ロック（lockedに）
export async function lockChord(userId, chordKey) {
  const { error } = await supabase
    .from("user_chord_progress")
    .update({ status: "locked" })
    .eq("user_id", userId)
    .eq("chord_key", chordKey);
  return !error;
}

// ✅ 進捗をリセットして赤のみ in_progress に戻す（デバッグ用）
export async function resetChordProgressToRed(userId) {
  const { error: lockError } = await supabase
    .from("user_chord_progress")
    .update({ status: "locked" })
    .eq("user_id", userId);

  if (lockError) {
    console.error("❌ 進捗リセット失敗:", lockError);
    return false;
  }

  const firstKey = chordOrder[0];
  const { error: redError } = await supabase
    .from("user_chord_progress")
    .update({ status: "in_progress" })
    .eq("user_id", userId)
    .eq("chord_key", firstKey);

  if (redError) {
    console.error("❌ 赤の設定失敗:", redError);
    return false;
  }

  return true;
}
