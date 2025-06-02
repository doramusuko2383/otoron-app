import { supabase } from "./supabaseClient.js";
import { unlockChord } from "./progressUtils.js";
import { applyRecommendedSelection, forceUnlock } from "./growthUtils.js";
import { showCustomConfirm } from "../components/home.js";
import { getAudio } from "./audioCache.js";
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
    .order("unlocked_date", { ascending: false })
    .limit(1)
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
    .order("unlocked_date", { ascending: false })
    .limit(1)
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
  const btn = document.getElementById("unlockBtn");
  const card = document.getElementById("unlockCard");
  const progress = btn?.querySelector(".progress");
  if (!msg || !btn || !progress || !card) return;

  const canUnlock = await checkRecentUnlockCriteria(user.id);
  const holdTime = 1500;
  let timer;

  const cancelProgress = () => {
    clearTimeout(timer);
    progress.style.transition = "width 0.2s ease-out";
    progress.style.width = "0%";
  };

  if (canUnlock) {
    msg.textContent = "合格条件（7日間の合格）を満たしました。次の和音を解放できます。";
    msg.classList.add("can-unlock");
    card.classList.add("highlight");
    btn.style.display = "block";

    btn.onpointerdown = () => {
      progress.style.transition = `width ${holdTime}ms linear`;
      progress.style.width = "100%";

      timer = setTimeout(async () => {
        progress.style.transition = "width 0s";
        progress.style.width = "0%";
        if (!target) return;
        const success = await unlockChord(user.id, target.key);
        if (success) {
          const audio = getAudio("audio/unlock_chord.mp3");
          const applause = getAudio("audio/applause.mp3");
          audio.play();
          applause.play();
          await applyRecommendedSelection(user.id);
          forceUnlock();
          btn.style.display = "none";
          if (onUnlocked) {
            await onUnlocked();
          } else {
            await updateGrowthStatusBar(user, target);
          }
        }
      }, holdTime);
    };

    btn.onpointerup = cancelProgress;
    btn.onpointerleave = cancelProgress;
  } else {
    const label = target ? target.label : "";
    msg.textContent = `いま ${label} の解放条件を満たしていません`;
    msg.classList.remove("can-unlock");
    card.classList.remove("highlight");
    btn.style.display = "none";
    btn.onpointerdown = null;
    btn.onpointerup = null;
    btn.onpointerleave = null;
  }
}
