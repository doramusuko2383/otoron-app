import { supabase } from "./supabaseClient.js";
import { unlockChord } from "./progressUtils.js";
import { applyRecommendedSelection } from "./growthUtils.js";
import { showCustomConfirm } from "../components/home.js";
import { getConsecutiveQualifiedDays } from "./qualifiedStore_supabase.js";

const PASS_DAYS = 7;
const POST_UNLOCK_DAYS = 7;

export async function checkRecentUnlockCriteria(userId) {
  const days = await getConsecutiveQualifiedDays(userId, PASS_DAYS);
  if (days < PASS_DAYS) return false;

  const { data: progress } = await supabase
    .from("user_chord_progress")
    .select("unlocked_date")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (progress && progress.unlocked_date) {
    const diff = (Date.now() - new Date(progress.unlocked_date).getTime()) / 86400000;
    if (diff < POST_UNLOCK_DAYS) return false;
  }
  return true;
}

export async function countQualifiedDays(userId) {
  return getConsecutiveQualifiedDays(userId, PASS_DAYS);
}

export async function getUnlockCriteriaStatus(userId) {
  const consecutiveDays = await getConsecutiveQualifiedDays(userId, PASS_DAYS);

  const { data: progress } = await supabase
    .from("user_chord_progress")
    .select("unlocked_date")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  let daysSinceUnlock = null;
  if (progress && progress.unlocked_date) {
    daysSinceUnlock = (Date.now() - new Date(progress.unlocked_date).getTime()) / 86400000;
  }

  return {
    consecutiveDays,
    requiredDays: PASS_DAYS,
    daysSinceUnlock,
    requiredInterval: POST_UNLOCK_DAYS
  };
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
