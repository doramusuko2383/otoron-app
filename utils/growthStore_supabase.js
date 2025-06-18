// utils/growthStore_supabase.js

import { supabase } from "./supabaseClient.js";
import {
  markQualifiedDayIfNeeded,
  sessionMeetsStats
} from "./qualifiedStore_supabase.js";
import { generateRecommendedQueue } from "./growthUtils.js";
import { chordOrder } from "../data/chords.js";

/**
 * 和音の進捗（解放状態）を取得
 * @param {string} userId - SupabaseのユーザーID
 * @returns {Promise<Object>} 例: { "aka": { unlocked: true }, ... }
 */
export async function loadGrowthFlags(userId) {
  if (!userId) {
    console.warn("loadGrowthFlags called without valid user ID");
    return {};
  }
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
  if (!userId) {
    console.warn("markChordAsUnlocked called without valid user ID");
    return;
  }
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
  }
}

/**
 * 指定日数分のモック記録を生成（デバッグ用）
 * @param {string} userId
 * @param {number} [days=7] - 生成する合格記録の日数
 */
export async function generateMockGrowthData(userId, days = 7) {
  if (!userId) {
    console.warn("generateMockGrowthData called without valid user ID");
    return;
  }
  const now = new Date();

  // 現在進行中の和音の解放日を days 日前に調整して解放条件を満たす
  const past = new Date(now);
  past.setDate(now.getDate() - days);
  const pastStr = past.toISOString().split("T")[0];
  await supabase
    .from("user_chord_progress")
    .update({ unlocked_date: pastStr })
    .eq("user_id", userId)
    .not("status", "eq", "locked");

  const flags = await loadGrowthFlags(userId);
  let queue = generateRecommendedQueue(flags);
  if (queue.length === 0) queue = ["C-E-G"];

  // 指定日数分の記録を挿入（すべて合格とする）
  // 各日には最低2セッション生成して合格条件を満たす
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const count = 60;
    const mistakeNum = 1;

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
        const wrongIdx = (q + 1) % queue.length;
        answerName = queue[wrongIdx];
        correctFlag = false;
        inversionMistakes.push({ question: chordName, answer: answerName, count: 1 });
      }

      results.push({ chordName, answerName, correct: correctFlag });

      if (!stats[chordName]) {
        stats[chordName] = { correct: 0, wrong: 0, unknown: 0, total: 0 };
      }
      if (correctFlag) stats[chordName].correct++;
      else stats[chordName].wrong++;
      stats[chordName].total++;
    }

    const isQualified = sessionMeetsStats(stats, count);
    const sessionTimes = ["T12:00:00", "T18:00:00"];
    for (const time of sessionTimes) {
      const ses = {
        user_id: userId,
        session_date: `${dateStr}${time}`,
        correct_count: count - mistakeNum,
        total_count: count,
        results_json: { type: 'chord', results },
        stats_json: stats,
        mistakes_json: { inversion_confusions: inversionMistakes },
        is_qualified: isQualified
      };
      const { error: sesErr } = await supabase
        .from("training_sessions")
        .insert(ses);
      if (sesErr) console.error("❌ モックセッション挿入失敗:", sesErr);
    }

    // 両セッションの保存後に日付単位の合格判定を実施
    await markQualifiedDayIfNeeded(userId, `${dateStr}${sessionTimes[0]}`);
  }
}

/**
 * 単音テスト3種のモックデータを生成（正解率90%程度）
 * @param {string} userId
 */
export async function generateMockSingleNoteData(userId) {
  if (!userId) {
    console.warn("generateMockSingleNoteData called without valid user ID");
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const sessionTypes = ['note-white', 'note-easy', 'note-full'];
  const total = 20;
  const correctCount = Math.round(total * 0.9);
  const mistakeNum = total - correctCount;

  for (let i = 0; i < sessionTypes.length; i++) {
    const results = [];
    for (let q = 0; q < total; q++) {
      const correct = q >= mistakeNum;
      results.push({
        noteQuestion: 'C4',
        noteAnswer: correct ? 'C4' : 'D4',
        correct,
        isSingleNote: true
      });
    }

    const ses = {
      user_id: userId,
      session_date: new Date(now.getTime() + i * 60000).toISOString(),
      correct_count: correctCount,
      total_count: total,
      results_json: { type: sessionTypes[i], results },
      stats_json: {},
      mistakes_json: {},
      is_qualified: false
    };
    const { error: sesErr } = await supabase
      .from('training_sessions')
      .insert(ses);
    if (sesErr) console.error('❌ モック単音セッション挿入失敗:', sesErr);
  }

  const addTotal = total * sessionTypes.length;
  const addCorrect = correctCount * sessionTypes.length;
  const { data: existing, error: recErr } = await supabase
    .from('training_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  if (recErr) {
    console.error('❌ モック記録取得失敗:', recErr);
    return;
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('training_records')
      .update({
        count: existing.count + addTotal,
        correct: existing.correct + addCorrect
      })
      .eq('id', existing.id);
    if (updateErr) console.error('❌ モック記録更新失敗:', updateErr);
  } else {
    const { error: insertErr } = await supabase
      .from('training_records')
      .insert({
        user_id: userId,
        date: dateStr,
        count: addTotal,
        correct: addCorrect,
        sets: 0
      });
    if (insertErr) console.error('❌ モック記録挿入失敗:', insertErr);
  }
}
