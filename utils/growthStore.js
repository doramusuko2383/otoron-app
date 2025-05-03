// utils/growthStore.js

// 和音ごとの解放状態（例：{ "C-E-G": { unlocked: true }, ... }）
const STORAGE_FLAGS_KEY = "growthChordFlags";

// 日別の記録（例：{ "2025-04-20": { count: 60, correct: 58, sets: 3 } }）
const STORAGE_RECORD_KEY = "growthRecords";

/**
 * 和音の解放状態を読み込む
 */
export function loadGrowthFlags() {
  const json = localStorage.getItem(STORAGE_FLAGS_KEY);
  return json ? JSON.parse(json) : {};
}

/**
 * 和音の解放状態を保存する
 */
export function saveGrowthFlags(data) {
  localStorage.setItem(STORAGE_FLAGS_KEY, JSON.stringify(data));
}

/**
 * 日別トレーニング記録を読み込む
 */
export function loadGrowthData() {
  const json = localStorage.getItem(STORAGE_RECORD_KEY);
  return json ? JSON.parse(json) : {};
}

/**
 * 日別トレーニング記録を保存する
 */
export function saveGrowthData(data) {
  localStorage.setItem(STORAGE_RECORD_KEY, JSON.stringify(data));
}

/**
 * デバッグ用の仮データを追加
 */
export function mockGrowthDebug() {
  const data = loadGrowthData();
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    data[key] = {
      count: 60,
      correct: 55 + Math.floor(Math.random() * 5),
      sets: 3
    };
  }
  saveGrowthData(data);
}
export function markChordAsUnlocked(name) {
  const flags = loadGrowthFlags();
  flags[name] = { unlocked: true };
  saveGrowthFlags(flags);
}
