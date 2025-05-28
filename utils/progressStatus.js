import { supabase } from "./supabaseClient.js";
import { unlockChord } from "./progressUtils.js";
import { applyRecommendedSelection } from "./growthUtils.js";
import { showCustomConfirm } from "../components/home.js";

const PASS_DAYS = 14;
const MIN_SETS = 2;
const MIN_COUNT = 40;
const PASS_RATE = 0.98;

const RECENT_DAYS = 7;
const DAILY_SETS = 2;
const WEEK_RATE = 0.98;
const MIN_QUESTIONS = 20;
const POST_UNLOCK_DAYS = 7;

function sessionEligible(row) {
  const mode = row.results_json?.mode || row.stats_json?.mode || row.results_json?.[0]?.mode;
  if (mode === "recommended") return true;

  const stats = row.stats_json;
  if (!stats) return false;
  const counts = Object.values(stats).map(s => {
    const total = s.total ?? (s.correct || 0) + (s.wrong || 0) + (s.unknown || 0);
    return total;
  });
  if (counts.length === 0) return false;
  const eachTwo = counts.every(c => c >= 2);
  return eachTwo && row.total_count >= MIN_QUESTIONS;
}

export async function checkRecentUnlockCriteria(userId) {
  const from = new Date();
  from.setDate(from.getDate() - (RECENT_DAYS - 1));
  const fromStr = from.toISOString().split("T")[0];

  const verbose = window.unlockDebugLogs === true;
  if (verbose) console.log("[unlock] 判定開始:", fromStr);

  const { data: records, error: recErr } = await supabase
    .from("training_records")
    .select("date, count, correct, sets")
    .eq("user_id", userId)
    .gte("date", fromStr);

  if (recErr) {
    console.error("❌ 記録取得失敗:", recErr);
    return false;
  }

  if (!records || records.length < RECENT_DAYS) {
    if (verbose) console.log("[unlock] ✗ 記録不足", records?.length);
    return false;
  }

  let totalCorrect = 0;
  let totalCount = 0;
  const recordMap = {};
  records.forEach(r => {
    recordMap[r.date] = r;
    totalCorrect += r.correct;
    totalCount += r.count;
  });

  for (const r of Object.values(recordMap)) {
    if ((r.sets || 0) < DAILY_SETS) {
      if (verbose) console.log("[unlock] ✗ セット不足", r.date, r.sets);
      return false;
    }
  }

  if (totalCount === 0 || totalCorrect / totalCount < WEEK_RATE) {
    if (verbose)
      console.log(
        "[unlock] ✗ 週間正答率", totalCount ? totalCorrect / totalCount : 0
      );
    return false;
  }

  const { data: sessions, error: sesErr } = await supabase
    .from("training_sessions")
    .select("session_date, total_count, results_json, stats_json")
    .eq("user_id", userId)
    .gte("session_date", fromStr);

  if (sesErr) {
    console.error("❌ セッション取得失敗:", sesErr);
    return false;
  }

  for (const row of sessions) {
    if (!sessionEligible(row)) {
      if (verbose) console.log("[unlock] ✗ セッション条件未達", row.session_date);
      return false;
    }
  }

  const { data: progress } = await supabase
    .from("user_chord_progress")
    .select("unlocked_date")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (progress && progress.unlocked_date) {
    const last = new Date(progress.unlocked_date);
    const diff = (Date.now() - last.getTime()) / 86400000;
    if (diff < POST_UNLOCK_DAYS) {
      if (verbose) console.log("[unlock] ✗ 前回解放からの日数", diff);
      return false;
    }
  }

  if (verbose) console.log("[unlock] ✓ 条件クリア");

  return true;
}

export async function countQualifiedDays(userId) {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("session_date, total_count, correct_count, results_json, stats_json")
    .eq("user_id", userId);

  if (error) {
    console.error("❌ セッション取得失敗:", error);
    return 0;
  }

  const daily = {};
  data.forEach(row => {
    const mode = row.results_json?.mode || row.stats_json?.mode || row.results_json?.[0]?.mode;
    if (mode !== "recommended") return;
    const dateStr = row.session_date.split("T")[0];
    if (!daily[dateStr]) daily[dateStr] = { sets: 0, total: 0, correct: 0 };
    daily[dateStr].sets += 1;
    daily[dateStr].total += row.total_count;
    daily[dateStr].correct += row.correct_count;
  });

  let passed = 0;
  for (const date in daily) {
    const d = daily[date];
    if (d.sets >= MIN_SETS && d.total >= MIN_COUNT && d.correct / d.total >= PASS_RATE) {
      passed++;
    }
  }

  return passed;
}

export async function updateGrowthStatusBar(user, target, onUnlocked) {
  const msg = document.getElementById("growth-message");
  const btn = document.getElementById("unlock-button");
  if (!msg || !btn) return;

  const canUnlock = await checkRecentUnlockCriteria(user.id);
  if (canUnlock) {
    msg.textContent = "🎉 合格条件を満たしました。次の和音を解放できます。";
    btn.disabled = false;
    btn.style.display = "inline-block";
    btn.onclick = () => {
      if (!target) return;
      showCustomConfirm(async () => {
        const success = await unlockChord(user.id, target.key);
        if (success) {
          alert(`🎉 ${target.label} を解放しました！`);
          await applyRecommendedSelection(user.id);
          btn.disabled = true;
          btn.style.display = "none";
          if (onUnlocked) {
            await onUnlocked();
          } else {
            await updateGrowthStatusBar(user, target);
          }
        }
      });
    };
  } else {
    const label = target ? target.label : "";
    msg.textContent = `いま ${label} の解放条件を満たしていません`;
    btn.disabled = true;
    btn.style.display = "none";
  }
}
