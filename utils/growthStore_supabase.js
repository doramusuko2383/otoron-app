// utils/growthStore_supabase.js

import { supabase } from "./supabaseClient.js";
import { markQualifiedDayIfNeeded } from "./qualifiedStore_supabase.js";
import { generateRecommendedQueue } from "./growthUtils.js";

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
      // treat all non-locked statuses as unlocked so previously
      // completed chords remain unlocked in the UI
      unlocked: row.status !== "locked"
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
export async function generateMockGrowthData(userId, qualifiedDays = 7) {
  const now = new Date();

  // 現在進行中の和音の解放日を7日前に調整して解放条件を満たす
  const past = new Date(now);
  past.setDate(now.getDate() - 7);
  const pastStr = past.toISOString().split("T")[0];
  await supabase
    .from("user_chord_progress")
    .update({ unlocked_date: pastStr })
    .eq("user_id", userId)
    .eq("status", "in_progress");

  const sampleMistakes = [
    { question: "C-E-G", answer: "E-G-C" },
    { question: "A-C#-E", answer: "C#-E-A" },
    { question: "D-F#-A", answer: "F#-A-D" },
    { question: "E-G#-B", answer: "G#-B-E" },
    { question: "F-A-C", answer: "A-C-F" }
  ];

  const flags = await loadGrowthFlags(userId);
  let queue = generateRecommendedQueue(flags);
  if (queue.length === 0) queue = ["C-E-G"];

  // 直近7日分の記録を挿入
  // qualifiedDays 回分は合格となるよう調整
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const count = 60;
    const qualified = i < qualifiedDays;
    const mistakeNum = qualified ? 1 : 3;

    const rec = {
      user_id: userId,
      date: dateStr,
      count,
      correct: count - mistakeNum,
      sets: 3
    };
    const { error: recErr } = await supabase
      .from("training_records")
      .upsert(rec, { onConflict: "user_id,date" });
    if (recErr) console.error("❌ モック記録挿入失敗:", recErr);

    const inversionMistakes = [];
    const results = [];
    const stats = {};

    for (let q = 0; q < count; q++) {
      const chordName = queue[q % queue.length];
      let answerName = chordName;
      let correctFlag = true;

      if (q < mistakeNum) {
        const m = sampleMistakes[(i + q) % sampleMistakes.length];
        answerName = m.answer;
        correctFlag = false;
        inversionMistakes.push({ ...m, count: 1 });
      }

      results.push({ chordName, answerName, correct: correctFlag });

      if (!stats[chordName]) {
        stats[chordName] = { correct: 0, wrong: 0, unknown: 0, total: 0 };
      }
      if (correctFlag) stats[chordName].correct++;
      else stats[chordName].wrong++;
      stats[chordName].total++;
    }

    const ses = {
      user_id: userId,
      session_date: `${dateStr}T12:00:00`,
      correct_count: count - mistakeNum,
      total_count: count,
      results_json: results,
      stats_json: stats,
      mistakes_json: { inversion_confusions: inversionMistakes },
      is_qualified: qualified
    };
    const { error: sesErr } = await supabase
      .from("training_sessions")
      .insert(ses);
    if (sesErr) console.error("❌ モックセッション挿入失敗:", sesErr);
    await markQualifiedDayIfNeeded(userId, `${dateStr}T12:00:00`);
  }
}
