// utils/trainingStore_supabase.js

import { supabase } from "./supabaseClient.js";
import { sessionMeetsStats, markQualifiedDayIfNeeded } from "./qualifiedStore_supabase.js";
import { convertMistakesJsonToStructuredForm } from "./mistakeUtils.js";

/**
 * トレーニングセッション結果をSupabaseに保存する関数
 * @param {Object} param0 - 保存データ
 * @param {string} param0.userId - ユーザーID
 * @param {Array} param0.results - 各問題の解答結果（{ chordName, answerName, correct } の配列）
 * @param {Object} param0.stats - 和音ごとの正誤集計データ
 * @param {Object} param0.mistakes - 和音ごとの誤答傾向データ
 * @param {number} param0.correctCount - 正解数
 * @param {number} param0.totalCount - 出題数
 * @param {string} param0.date - セッション日時（ISO形式）
 */
export async function saveTrainingSession({ userId, results, stats, mistakes, correctCount, totalCount, date }) {
  console.log("🟡 saveTrainingSession 実行:", {
    userId,
    results,
    stats,
    mistakes,
    correctCount,
    totalCount,
    date
  });
  const structuredMistakes = convertMistakesJsonToStructuredForm(mistakes, results);
  const isQualified = sessionMeetsStats(stats, totalCount);
  const { data, error } = await supabase.from("training_sessions").insert([
    {
      user_id: userId,
      session_date: date,
      correct_count: correctCount,
      total_count: totalCount,
      results_json: results,
      stats_json: stats,
      mistakes_json: structuredMistakes,
      is_qualified: isQualified
    }
  ]);

  if (error) {
    console.error("❌ セッション保存に失敗:", error);
  } else {
    console.log("✅ セッション保存に成功:", data);
    await markQualifiedDayIfNeeded(userId, date);
  }
}

export async function loadLatestTrainingSession(userId) {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ 最新セッション取得失敗:", error);
    return null;
  }

  return data;
}

export async function loadTrainingSessionsForDate(userId, date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextStr = nextDay.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", date)
    .lt("session_date", nextStr)
    .order("session_date", { ascending: true });

  if (error) {
    console.error("❌ セッション一覧取得失敗:", error);
    return [];
  }

  return data || [];
}
