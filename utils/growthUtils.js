import { loadGrowthData, saveGrowthData, loadGrowthFlags } from "./growthStore.js";
import { chords } from "../data/chords.js";

/**
 * 現在挑戦中の和音を返す（未解放の最初の1つ）
 */
export function getCurrentTargetChord() {
  const flags = loadGrowthFlags();

  for (const chord of chords) {
    if (!chord.colorClass || chord.type === "black-inv") continue;
    if (!flags[chord.name]?.unlocked) {
      return chord;
    }
  }

  return null; // 全て解放済み
}

const PASS_THRESHOLD = 0.98;
const MIN_COUNT = 40;
const MIN_SETS = 2;
const REQUIRED_DAYS = 14;
const STORAGE_FORCE_FLAG = "growth_force_unlock";

/**
 * 今日の日付（YYYY-MM-DD）
 */
export function getToday() {
  return new Date().toISOString().split("T")[0];
}

/**
 * 今日の成績が合格基準を満たしているか
 */
export function isQualifiedToday() {
  const data = loadGrowthData();
  const today = getToday();
  const record = data[today];
  if (!record) return false;
  if (record.count < MIN_COUNT || record.sets < MIN_SETS) return false;
  const rate = record.correct / record.count;
  return rate >= PASS_THRESHOLD;
}

/**
 * 合格した日数を取得（強制解放後はリセット）
 */
export function getPassedDays() {
  const data = loadGrowthData();
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
 * 今日を合格済みにマーク（デバッグ・テスト用）
 */
export function markTodayAsPassed() {
  const data = loadGrowthData();
  const today = getToday();
  data[today] = {
    count: 60,
    correct: 60,
    sets: 3
  };
  saveGrowthData(data);
}

/**
 * トレーニング中の出題・正解数を記録
 */
export function updateGrowthRecord({ correct = 0, total = 1 }) {
  const data = JSON.parse(localStorage.getItem("growthRecords") || "{}");
  const today = getToday();

  if (!data[today]) {
    data[today] = { correct: 0, count: 0, sets: 0 };
  }

  data[today].correct += correct;
  data[today].count += total;

  localStorage.setItem("growthRecords", JSON.stringify(data));
}
