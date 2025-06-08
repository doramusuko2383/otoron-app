import { supabase } from "./supabaseClient.js";
import { chords, chordOrder } from "../data/chords.js";
import { getCounts } from "./chordQueue.js";

const REQUIRED_DAYS = 7;
const PASS_THRESHOLD = 0.98;
// A day is only qualified when at least this many sessions were played
const MIN_SESSIONS_PER_DAY = 2;

const chordNameOrder = chordOrder
  .map(key => chords.find(c => c.key === key)?.name)
  .filter(Boolean);

function sessionMeetsStats(stats, totalCount) {
  if (!stats) return false;

  const names = Object.keys(stats);
  const n = names.length;
  if (n === 0) return false;

  const required = getCounts(n);
  const sorted = chordNameOrder.filter(name => names.includes(name));
  names.forEach(nm => {
    if (!sorted.includes(nm)) sorted.push(nm);
  });

  let total = 0;
  let correctTotal = 0;
  for (let i = 0; i < sorted.length; i++) {
    const name = sorted[i];
    const stat = stats[name] || {};
    const count =
      stat.total ?? (stat.correct || 0) + (stat.wrong || 0) + (stat.unknown || 0);
    if (count < required[i]) return false;
    total += count;
    correctTotal += stat.correct || 0;
  }

  const minTotal = required.reduce((a, b) => a + b, 0);
  if (totalCount < minTotal) return false;

  const accuracy = total > 0 ? correctTotal / total : 0;
  if (accuracy < PASS_THRESHOLD) return false;

  return true;
}

export async function markQualifiedDayIfNeeded(userId, isoDate) {
  if (!userId) {
    console.warn("markQualifiedDayIfNeeded called without valid user ID");
    return;
  }
  const dayStart = isoDate.split("T")[0];
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextStr = nextDay.toISOString().split("T")[0];

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("stats_json, total_count")
    .eq("user_id", userId)
    .gte("session_date", dayStart)
    .lt("session_date", nextStr);

  if (error) {
    console.error("❌ qualified day check failed:", error);
    return;
  }

  if (!sessions || sessions.length < MIN_SESSIONS_PER_DAY) return;

  const aggregated = {};
  let total = 0;
  sessions.forEach(s => {
    total += s.total_count || 0;
    const st = s.stats_json || {};
    for (const name in st) {
      const ent = st[name];
      const c =
        ent.total ?? (ent.correct || 0) + (ent.wrong || 0) + (ent.unknown || 0);
      if (!aggregated[name]) {
        aggregated[name] = { correct: 0, wrong: 0, unknown: 0, total: 0 };
      }
      aggregated[name].correct += ent.correct || 0;
      aggregated[name].wrong += ent.wrong || 0;
      aggregated[name].unknown += ent.unknown || 0;
      aggregated[name].total += c;
    }
  });

  const qualified = sessionMeetsStats(aggregated, total);
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
  if (!userId) {
    console.warn("getConsecutiveQualifiedDays called without valid user ID");
    return 0;
  }
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
      .select("date")
      .eq("user_id", userId)
      .gte("date", fromStr),
    supabase
      .from("user_chord_progress")
      .select("chord_key, status, unlocked_date")
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

  const recordSet = new Set(records.map(r => r.date));

  const qualifiedSet = new Set(qualified.map(d => d.qualified_date));

  function isValidPassingDay(dateStr) {
    const unlockedOnDate = progress
      .filter(
        p =>
          p.status !== "locked" &&
          (!p.unlocked_date || p.unlocked_date <= dateStr)
      )
      .map(p => p.chord_key);
    if (unlockedOnDate.length !== currentUnlocked.length) return false;
    return unlockedOnDate.every(ch => currentSet.has(ch));
  }

  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (qualifiedSet.has(ds) && recordSet.has(ds) && isValidPassingDay(ds)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export { sessionMeetsStats };
