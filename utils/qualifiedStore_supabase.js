import { supabase } from "./supabaseClient.js";

const REQUIRED_DAYS = 7;

function sessionMeetsStats(stats, totalCount) {
  if (!stats) return false;
  if (totalCount < 20) return false;
  const counts = Object.values(stats).map(s => {
    const total = s.total ?? (s.correct || 0) + (s.wrong || 0) + (s.unknown || 0);
    return total;
  });
  if (counts.length === 0) return false;
  return counts.every(c => c >= 2);
}

export async function markQualifiedDayIfNeeded(userId, isoDate) {
  const dayStart = isoDate.split("T")[0];
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextStr = nextDay.toISOString().split("T")[0];

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("is_qualified, results_json")
    .eq("user_id", userId)
    .gte("session_date", dayStart)
    .lt("session_date", nextStr);

  if (error) {
    console.error("❌ qualified day check failed:", error);
    return;
  }

  if (!sessions || sessions.length === 0) return;

  let qualified = false;
  if (sessions.some(s => s.is_qualified)) {
    qualified = true;
  } else if (sessions.length >= 2) {
    const allRecommended = sessions.every(s => {
      const mode = s.results_json?.mode || s.results_json?.[0]?.mode;
      return mode === "recommended";
    });
    if (allRecommended) qualified = true;
  }

  if (!qualified) return;

  const { data: existing, error: existErr } = await supabase
    .from("qualified_days")
    .select("id")
    .eq("user_id", userId)
    .eq("qualified_date", dayStart)
    .maybeSingle();

  if (existErr) {
    console.error("❌ qualified day lookup failed:", existErr);
    return;
  }

  if (!existing) {
    await supabase
      .from("qualified_days")
      .insert([{ user_id: userId, qualified_date: dayStart }]);
  }
}

export async function getConsecutiveQualifiedDays(userId, days = REQUIRED_DAYS) {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - (days - 1));
  const fromStr = from.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("qualified_days")
    .select("qualified_date")
    .eq("user_id", userId)
    .gte("qualified_date", fromStr);

  if (error) {
    console.error("❌ qualified days fetch failed:", error);
    return 0;
  }

  const set = new Set(data.map(d => d.qualified_date));
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (set.has(ds)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export { sessionMeetsStats };
