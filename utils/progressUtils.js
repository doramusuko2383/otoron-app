// utils/progressUtils.js

import { getPassedDays, getCurrentTargetChord } from "./growthUtils.js";
import { supabase } from "../components/supabaseClient.js";

/**
 * 合格日数が14日あれば、現在のターゲット和音を解放する
 * @param {object} user - Supabaseのユーザーオブジェクト
 */
export async function autoUnlockNextChord(user) {
  const flags = await supabase
    .from("user_chord_progress")
    .select("chord_key, status")
    .eq("user_id", user.id);

  if (flags.error) {
    console.error("❌ 解放状況の取得失敗:", flags.error);
    return;
  }

  const flagMap = {};
  flags.data.forEach(f => {
    flagMap[f.chord_key] = {
      unlocked: f.status === "completed" || f.status === "unlocked"
    };
  });

  const passed = await getPassedDays(user.id);

  if (passed >= 14) {
    const target = getCurrentTargetChord(flagMap);
    if (!target) {
      console.log("🎉 全ての和音が解放済みです");
      return;
    }

    const { error } = await supabase
      .from("user_chord_progress")
      .update({
        status: "completed",
        unlocked_date: new Date().toISOString().split("T")[0]
      })
      .eq("user_id", user.id)
      .eq("chord_key", target.name);

    if (error) {
      console.error("❌ 和音自動解放失敗:", error);
    } else {
      console.log(`✅ 自動で「${target.label}」を解放しました`);
    }
  }
}