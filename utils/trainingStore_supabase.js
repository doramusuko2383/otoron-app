// utils/trainingStore_supabase.js

import { supabase } from "./supabaseClient.js";
import { sessionMeetsStats, markQualifiedDayIfNeeded } from "./qualifiedStore_supabase.js";
import { convertMistakesJsonToStructuredForm } from "./mistakeUtils.js";
import { getJstDayRange, toJstYmd, toJstDate, addJstDays } from "./dateUtils.js";

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
  if (!userId) {
    console.warn("saveTrainingSession called without valid user ID");
    return;
  }
  
  const answerList = Array.isArray(results)
    ? results
    : (results && Array.isArray(results.results) ? results.results : []);
  const structuredMistakes = convertMistakesJsonToStructuredForm(mistakes, answerList);
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
    await markQualifiedDayIfNeeded(userId, date);
  }
}

export async function loadLatestTrainingSession(userId) {
  if (!userId) {
    console.warn("loadLatestTrainingSession called without valid user ID");
    return null;
  }
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
  if (!userId) {
    console.warn("loadTrainingSessionsForDate called without valid user ID");
    return [];
  }
  const { startUtcIso, endUtcIso } = getJstDayRange(date);
  if (!startUtcIso || !endUtcIso) {
    console.warn("loadTrainingSessionsForDate received invalid date:", date);
    return [];
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", startUtcIso)
    .lt("session_date", endUtcIso)
    .order("session_date", { ascending: true });

  if (error) {
    console.error("❌ セッション一覧取得失敗:", error);
    return [];
  }

  return data || [];
}

export async function deleteTrainingDataThisWeek(userId) {
  if (!userId) {
    console.warn("deleteTrainingDataThisWeek called without valid user ID");
    return false;
  }
  const jstNow = toJstDate(new Date());
  if (Number.isNaN(jstNow.getTime())) {
    console.error("❌ deleteTrainingDataThisWeek failed to compute current JST date");
    return false;
  }
  const day = jstNow.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const todayYmd = toJstYmd(new Date());
  const startStr = addJstDays(todayYmd, -diffToMonday);
  const endStr = addJstDays(startStr, 7);
  const { startUtcIso: startIso } = getJstDayRange(startStr);
  const { startUtcIso: endIso } = getJstDayRange(endStr);

  if (!startIso || !endIso) {
    console.error("❌ deleteTrainingDataThisWeek failed to derive JST boundaries", {
      startStr,
      endStr
    });
    return false;
  }

  const { error: sesErr } = await supabase
    .from("training_sessions")
    .delete()
    .eq("user_id", userId)
    .gte("session_date", startIso)
    .lt("session_date", endIso);

  const { error: recErr } = await supabase
    .from("training_records")
    .delete()
    .eq("user_id", userId)
    .gte("date", startStr)
    .lt("date", endStr);

  const { error: qualErr } = await supabase
    .from("qualified_days")
    .delete()
    .eq("user_id", userId)
    .gte("qualified_date", startStr)
    .lt("qualified_date", endStr);

  if (sesErr || recErr || qualErr) {
    console.error("❌ 今週のデータ削除に失敗:", sesErr || recErr || qualErr);
    return false;
  }

  return true;
}
