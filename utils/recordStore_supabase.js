// utils/recordStore_supabase.js

import { supabase } from "./supabaseClient.js";
import { getToday } from "./growthUtils.js";

/**
 * 今日のトレーニング結果を追加・更新
 * @param {object} params
 * @param {string} params.userId - SupabaseユーザーID
 * @param {number} params.correct - 正答数の追加値（例: 1）
 * @param {number} params.total - 出題数の追加値（例: 1）
 */
export async function updateTrainingRecord({
  userId,
  correct = 0,
  total = 1
}) {
  if (!userId) {
    console.warn("updateTrainingRecord called without valid user ID");
    return;
  }
  const today = getToday();

  const { data: existing, error: fetchError } = await supabase
    .from("training_records")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (fetchError) {
    console.error("❌ 記録取得失敗:", fetchError);
    return;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("training_records")
      .update({
        correct: existing.correct + correct,
        count: existing.count + total
      })
      .eq("id", existing.id);

    if (updateError) console.error("❌ 記録更新失敗:", updateError);
  } else {
    const { error: insertError } = await supabase
      .from("training_records")
      .insert([
        {
          user_id: userId,
          date: today,
          count: total,
          correct: correct,
          sets: 0
        }
      ]);

    if (insertError) console.error("❌ 記録新規作成失敗:", insertError);
  }
}

/**
 * 今日のセット数（1セット完了）を +1 加算
 */
export async function incrementSetCount(userId) {
  if (!userId) {
    console.warn("incrementSetCount called without valid user ID");
    return;
  }
  const today = getToday();

  const { data: existing, error: fetchError } = await supabase
    .from("training_records")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (fetchError || !existing) {
    console.warn("⚠️ セット加算前に記録が見つかりません");
    return;
  }

  const { error: updateError } = await supabase
    .from("training_records")
    .update({
      sets: existing.sets + 1
    })
    .eq("id", existing.id);

  if (updateError) console.error("❌ セット加算失敗:", updateError);
}

/**
 * 全トレーニング記録を取得（進捗判定・表示用）
 * @returns {Promise<Object>} 日付をキーにした記録オブジェクト
 */
export async function loadTrainingRecords(userId) {
  if (!userId) {
    console.warn("loadTrainingRecords called without valid user ID");
    return {};
  }
  const { data, error } = await supabase
    .from("training_records")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("❌ 記録読み込み失敗:", error);
    return {};
  }

  const result = {};
  data.forEach(r => {
    result[r.date] = {
      count: r.count,
      correct: r.correct,
      sets: r.sets
    };
  });
  return result;
}
