import { chords, chordOrder } from "../data/chords.js";
import { loadTrainingRecords } from "./recordStore_supabase.js";
import { loadGrowthFlags } from "./growthStore_supabase.js";
import { getConsecutiveQualifiedDays } from "./qualifiedStore_supabase.js";
import { supabase } from "./supabaseClient.js";
import { generateChordQueue } from "./chordQueue.js";

export function getRecommendedChordSet(flags) {
  const unlockedKeys = chordOrder.filter(key => flags[key]?.unlocked);
  const n = unlockedKeys.length;

  if (n === 0) return [];

  const totalCount = Math.max(30, n * 4);
  const base = Math.floor(totalCount / n);
  const extra = totalCount % n;

  const distribution = unlockedKeys.map((_, i) => i < extra ? base + 1 : base);

  const result = [];
  for (let i = 0; i < unlockedKeys.length; i++) {
    const key = unlockedKeys[i];
    for (let j = 0; j < distribution[i]; j++) {
      result.push(key);
    }
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate a shuffled queue of chord names for recommended mode
 * using unlocked chord flags and generateChordQueue utility.
 *
 * @param {object} flags - chord unlock flags keyed by chord key
 * @returns {string[]} shuffled chord name queue
 */
export function generateRecommendedQueue(flags) {
  const unlockedNames = chordOrder
    .filter(key => flags[key]?.unlocked)
    .map(key => {
      const chord = chords.find(c => c.key === key);
      return chord ? chord.name : null;
    })
    .filter(Boolean);

  return generateChordQueue(unlockedNames);
}

/**
 * 現在挑戦中の和音を返す（未解放の最初の1つ）
 * @param {object} flags - 和音解放フラグ（keyベース）
 * @returns {object|null} 該当する chord オブジェクト or null
 */
export function getCurrentTargetChord(flags) {
  for (const key of chordOrder) {
    const status = flags[key];
    if (!status?.unlocked) {
      const chord = chords.find(c => c.key === key);
      if (chord) return chord;
    }
  }
  return null; // 全て解放済み
}

export const PASS_THRESHOLD = 0.98;
export const MIN_COUNT = 40;
export const MIN_SETS = 2;
export const REQUIRED_DAYS = 7;
export const STORAGE_FORCE_FLAG = "growth_force_unlock";

/**
 * 今日の日付（YYYY-MM-DD）
 */
export function getToday() {
  return new Date().toISOString().split("T")[0];
}

/**
 * 今日の成績が合格基準を満たしているか（Supabase版）
 * @param {string} userId - SupabaseユーザーID
 * @returns {Promise<boolean>}
 */
export async function isQualifiedToday(userId) {
  if (!userId) {
    console.warn("isQualifiedToday called without valid user ID");
    return false;
  }
  const today = getToday();
  const { data, error } = await supabase
    .from("qualified_days")
    .select("id")
    .eq("user_id", userId)
    .eq("qualified_date", today)
    .maybeSingle();

  if (error) {
    console.error("❌ qualified today check:", error);
    return false;
  }
  return !!data;
}

/**
 * 合格した日数を取得（強制解放後はリセット） Supabase版
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getPassedDays(userId) {
  if (!userId) {
    console.warn("getPassedDays called without valid user ID");
    return 0;
  }
  const passed = await getConsecutiveQualifiedDays(userId);

  const resetFlag = localStorage.getItem(STORAGE_FORCE_FLAG);
  if (resetFlag === "true") {
    localStorage.removeItem(STORAGE_FORCE_FLAG);
    return 0;
  }

  return passed;
}

/**
 * 強制解放処理（次回から進捗リセット）
 */
export function forceUnlock() {
  localStorage.setItem(STORAGE_FORCE_FLAG, "true");
}

/**
 * 日付の昇順で並び替えられた記録を返す（過去表示など用）
 * @param {string} userId
 * @returns {Promise<Array<{date, count, correct, sets}>>}
 */
export async function getSortedRecordArray(userId) {
  if (!userId) {
    console.warn("getSortedRecordArray called without valid user ID");
    return [];
  }
  const data = await loadTrainingRecords(userId);
  const sortedKeys = Object.keys(data).sort();
  return sortedKeys.map(date => ({
    date,
    ...data[date]
  }));
}

/**
 * 解放済み和音から推奨出題セットを算出し、選択状態を更新する
 * @param {string} userId - SupabaseユーザーID
 */
export async function applyRecommendedSelection(userId) {
  if (!userId) {
    console.warn("applyRecommendedSelection called without valid user ID");
    return;
  }
  const flags = await loadGrowthFlags(userId);
  const queue = generateRecommendedQueue(flags);

  const countMap = {};
  queue.forEach(name => {
    countMap[name] = (countMap[name] || 0) + 1;
  });

  const recommended = chords
    .filter(ch => countMap[ch.name])
    .map(ch => ({ name: ch.name, count: countMap[ch.name] }));

  sessionStorage.removeItem("trainingMode");
  sessionStorage.removeItem("selectedChords");
  localStorage.setItem("selectedChords", JSON.stringify(recommended));
}
