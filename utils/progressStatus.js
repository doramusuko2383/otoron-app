import { supabase } from "./supabaseClient.js";
import { unlockChord } from "./progressUtils.js";
import { applyRecommendedSelection } from "./growthUtils.js";
import { showCustomConfirm } from "../components/home.js";

const PASS_DAYS = 14;
const MIN_SETS = 2;
const MIN_COUNT = 40;
const PASS_RATE = 0.98;

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

  const passed = await countQualifiedDays(user.id);
  if (passed >= PASS_DAYS) {
    msg.textContent = "🎉 和音の進捗条件を満たしました。次の和音を解放してください。";
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
    const remain = PASS_DAYS - passed;
    msg.textContent = `いま ${label} の解放に挑戦中　解放まであと${remain}日`;
    btn.disabled = true;
    btn.style.display = "none";
  }
}
