import { chords } from "../data/chords.js";
import { loadTrainingRecords } from "./recordStore_supabase.js";

/**
 * 現在挑戦中の和音を返す（未解放の最初の1つ）
 * @param {object} flags - 和音解放フラグ（loadGrowthFlagsの結果）
 * @returns {object|null} 該当する chord オブジェクト or null
 */
export function getCurrentTargetChord(flags) {
  for (const chord of chords) {
    if (!chord.colorClass || chord.type === "black-inv") continue;
    if (!flags[chord.name]?.unlocked) {
      return chord;
    }
  }
  return null;
}

export const PASS_THRESHOLD = 0.98;
export const MIN_COUNT = 40;
export const MIN_SETS = 2;
export const REQUIRED_DAYS = 14;
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
  const data = await loadTrainingRecords(userId);
  const today = getToday();
  const record = data[today];
  if (!record) return false;
  if (record.count < MIN_COUNT || record.sets < MIN_SETS) return false;
  const rate = record.correct / record.count;
  return rate >= PASS_THRESHOLD;
}

/**
 * 合格した日数を取得（強制解放後はリセット） Supabase版
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getPassedDays(userId) {
  const data = await loadTrainingRecords(userId);
  let passed = 0;

  for (const date in data) {
    const record = data[date];
    if (
      record &&
      record.count >= MIN_COUNT &&
      record.sets >= MIN_SETS &&
      (record.correct / record.count) >= PASS_THRESHOLD
    ) {
      passed++;
    }
  }

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
  const data = await loadTrainingRecords(userId);
  const sortedKeys = Object.keys(data).sort();
  return sortedKeys.map(date => ({
    date,
    ...data[date]
  }));
}
