import { supabase } from "./supabaseClient.js";

const REQUIRED_DAYS = 7;
const PASS_THRESHOLD = 0.98;

function sessionMeetsStats(stats, totalCount) {
  if (!stats) return false;

  const chordCount = Object.keys(stats).length;
  if (chordCount === 0) return false;
  if (totalCount < chordCount * 4) return false;

  const counts = Object.values(stats).map(s => {
    const total =
      s.total ?? (s.correct || 0) + (s.wrong || 0) + (s.unknown || 0);
    return total;
  });
  if (!counts.every(c => c >= 4)) return false;

  const correctTotal = Object.values(stats).reduce(
    (sum, s) => sum + (s.correct || 0),
    0
  );
  const accuracy = totalCount > 0 ? correctTotal / totalCount : 0;
  if (accuracy < PASS_THRESHOLD) return false;

  return true;
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

  const [{ data: qualified, error: qErr }, { data: records, error: rErr }, { data: progress, error: pErr }] = await Promise.all([
    supabase
      .from("qualified_days")
      .select("qualified_date")
      .eq("user_id", userId)
      .gte("qualified_date", fromStr),
    supabase
      .from("training_records")
      .select("date, chords_required")
      .eq("user_id", userId)
      .gte("date", fromStr),
    supabase
      .from("user_chord_progress")
      .select("chord_key, status")
      .eq("user_id", userId)
  ]);

  if (qErr || rErr || pErr) {
    console.error("❌ qualified days fetch failed:", qErr || rErr || pErr);
    return 0;
  }

  const currentUnlocked = progress
    .filter(p => p.status !== "locked")
    .map(p => p.chord_key);

  const currentSet = new Set(currentUnlocked);

  const recordMap = {};
  records.forEach(r => {
    recordMap[r.date] = r;
  });

  const qualifiedSet = new Set(qualified.map(d => d.qualified_date));

  function isValidPassingDay(rec) {
    if (!rec || !rec.chords_required) return false;
    const req = Array.isArray(rec.chords_required)
      ? rec.chords_required
      : JSON.parse(rec.chords_required || "[]");
    if (req.length !== currentUnlocked.length) return false;
    return req.every(ch => currentSet.has(ch));
  }

  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (qualifiedSet.has(ds) && isValidPassingDay(recordMap[ds])) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export { sessionMeetsStats };
