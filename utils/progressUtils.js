import { supabase } from "./supabaseClient.js";
import { getPassedDays } from "./growthUtils.js";
import { chordOrder } from "../data/chords.js";
import { chords } from "../data/chords.js"; // ✅ 必須

// ✅ 新規ユーザー用：赤からスタート、他はlocked
export async function createInitialChordProgress(userId) {
  if (!userId) {
    console.warn("createInitialChordProgress called without valid user ID");
    return;
  }
  const chordKeys = chords.map(chord => chord.key); // すべての和音に対応

  const insertData = chordKeys.map((key, index) => ({
    user_id: userId,
    chord_key: key,
    status: index === 0 ? "in_progress" : "locked",
    unlocked_date: index === 0 ? new Date().toISOString().split("T")[0] : null
  }));

  const { error } = await supabase
    .from("user_chord_progress")
    .upsert(insertData, { onConflict: "user_id,chord_key", ignoreDuplicates: true });

  if (error) {
    console.error("❌ 初期進捗の登録失敗:", error);
  }
}

// ✅ 経験者向け：任意の和音からスタートできるよう進捗を設定
export async function applyStartChordIndex(userId, startIndex) {
  if (!userId) {
    console.warn("applyStartChordIndex called without valid user ID");
    return;
  }
  const chordKeys = chords.map((c) => c.key);

  if (startIndex < 0 || startIndex >= chordKeys.length) {
    console.warn(
      `applyStartChordIndex: startIndex out of range (${startIndex})`
    );
    startIndex = Math.max(0, Math.min(startIndex, chordKeys.length - 1));
  }

  const completed = chordKeys.slice(0, startIndex);
  const current = chordKeys[startIndex];
  const locked = chordKeys.slice(startIndex + 1);
  const today = new Date().toISOString().split("T")[0];

  const updates = [];

  if (completed.length > 0) {
    updates.push(
      supabase
        .from("user_chord_progress")
        .update({ status: "completed", unlocked_date: null })
        .eq("user_id", userId)
        .in("chord_key", completed)
    );
  }

  updates.push(
    supabase
      .from("user_chord_progress")
      .update({ status: "in_progress", unlocked_date: today })
      .eq("user_id", userId)
      .eq("chord_key", current)
  );

  if (locked.length > 0) {
    updates.push(
      supabase
        .from("user_chord_progress")
        .update({ status: "locked", unlocked_date: null })
        .eq("user_id", userId)
        .in("chord_key", locked)
    );
  }

  const results = await Promise.all(updates);
  const error = results.find((r) => r.error)?.error;
  if (error) {
    console.error("❌ applyStartChordIndex update failed:", error);
  }
}

export async function applyStartIndexToUser(userId, startIndex) {
  await applyStartChordIndex(userId, startIndex);
  if (!userId) {
    console.warn("applyStartIndexToUser called without valid user ID");
    return;
  }
  const { error } = await supabase
    .from("users")
    .update({ start: startIndex })
    .eq("id", userId);
  if (error) {
    console.error("❌ applyStartIndexToUser user update failed:", error);
  }
}

// ✅ 連続合格日数が7日に達したら、次の和音に進める
export async function autoUnlockNextChord(user) {
  const passed = await getPassedDays(user.id);
  if (passed < 7) return;

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
    .update({
      status: "in_progress",
      unlocked_date: new Date().toISOString().split("T")[0]
    })
    .eq("user_id", user.id)
    .eq("chord_key", nextChord);

}

// ✅ 和音を解放（in_progressに）
export async function unlockChord(userId, chordKey) {
  if (!userId) {
    console.warn("unlockChord called without valid user ID");
    return false;
  }
  // 現在進行中の和音を完了状態に更新
  const { data: current, error: fetchErr } = await supabase
    .from("user_chord_progress")
    .select("chord_key")
    .eq("user_id", userId)
    .eq("status", "in_progress");

  if (!fetchErr && current && current.length > 0) {
    const keys = current
      .filter(row => row.chord_key !== chordKey)
      .map(row => row.chord_key);
    if (keys.length > 0) {
      await supabase
        .from("user_chord_progress")
        .update({ status: "completed" })
        .eq("user_id", userId)
        .in("chord_key", keys);
    }
  }

  const { error } = await supabase
    .from("user_chord_progress")
    .update({
      status: "in_progress",
      unlocked_date: new Date().toISOString().split("T")[0]
    })
    .eq("user_id", userId)
    .eq("chord_key", chordKey);

  return !error;
}

// ✅ 和音を再ロック（lockedに）
export async function lockChord(userId, chordKey) {
  if (!userId) {
    console.warn("lockChord called without valid user ID");
    return false;
  }
  const { error } = await supabase
    .from("user_chord_progress")
    .update({ status: "locked" })
    .eq("user_id", userId)
    .eq("chord_key", chordKey);
  return !error;
}

// ✅ 進捗をリセットして赤のみ in_progress に戻す（デバッグ用）
export async function resetChordProgressToRed(userId) {
  if (!userId) {
    console.warn("resetChordProgressToRed called without valid user ID");
    return false;
  }
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

// ✅ 進捗を全削除して任意の開始和音までを unlocked で再登録
export async function resetProgressAndUnlock(userId, startIndex) {
  if (!userId) {
    console.warn("resetProgressAndUnlock called without valid user ID");
    return false;
  }

  const tables = [
    "training_sessions",
    "training_records",
    "qualified_days",
    "user_chord_progress"
  ];

  const results = await Promise.all(
    tables.map(tbl =>
      supabase.from(tbl).delete().eq("user_id", userId)
    )
  );
  if (results.some(r => r.error)) {
    console.error("❌ データ削除失敗:", results.map(r => r.error).find(e => e));
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  const chordKeys = chords.map(c => c.key);
  const insertData = chordKeys.map((key, idx) => ({
    user_id: userId,
    chord_key: key,
    status: idx <= startIndex ? "unlocked" : "locked",
    unlocked_date: idx <= startIndex ? today : null
  }));

  const { error } = await supabase
    .from("user_chord_progress")
    .insert(insertData);

  if (error) {
    console.error("❌ 進捗再登録失敗:", error);
    return false;
  }

  return true;
}

// ✅ ユーザーの和音進捗が存在するか確認し、なければ初期データを作成
export async function ensureChordProgress(userId) {
  if (!userId) {
    console.warn("ensureChordProgress called without valid user ID");
    return;
  }

  const { data, error } = await supabase
    .from("user_chord_progress")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("❌ ensureChordProgress query failed:", error);
    return;
  }

  if (!data || data.length === 0) {
    await createInitialChordProgress(userId);
  }
}
