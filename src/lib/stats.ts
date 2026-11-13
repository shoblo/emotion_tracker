import type { Mood } from "./types";

/** The English-only fields both the parent and the teacher may see (matches the teacher_entries view). */
export interface HistoryEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  mood: Mood;
  summary_en: string;
  transcript_en: string;
  picked_up_early: boolean;
  had_incident: boolean;
  had_meltdown: boolean;
  incident_details_en: string;
  triggers: string[];
  teacher_feedback_en: string;
}

// ---------- date helpers (pure string/UTC maths, so time zones can't shift a day) ----------

const pad = (n: number) => String(n).padStart(2, "0");

export function toIso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function addDays(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}
/** Inclusive number of days between two ISO dates. */
export function daysInRange(from: string, to: string): number {
  return Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86400000) + 1;
}
/** Range ending today covering the last `n` days (today included). */
export function lastNDays(today: string, n: number): { from: string; to: string } {
  return { from: addDays(today, -(n - 1)), to: today };
}

export function inRange(entries: HistoryEntry[], from: string, to: string): HistoryEntry[] {
  return entries.filter((e) => e.entry_date >= from && e.entry_date <= to);
}

// ---------- counts ----------

export interface Counts {
  green: number;
  yellow: number;
  red: number;
  /** Days that have an entry. */
  recorded: number;
  /** Days in the range with no entry. */
  missing: number;
  pickedUp: number;
  meltdowns: number;
}

export function countRange(entries: HistoryEntry[], from: string, to: string): Counts {
  const es = inRange(entries, from, to);
  const c: Counts = { green: 0, yellow: 0, red: 0, recorded: es.length, missing: 0, pickedUp: 0, meltdowns: 0 };
  for (const e of es) {
    c[e.mood] += 1;
    if (e.picked_up_early) c.pickedUp += 1;
    if (e.had_meltdown) c.meltdowns += 1;
  }
  c.missing = Math.max(0, daysInRange(from, to) - es.length);
  return c;
}

// ---------- weekday distribution (Mon..Sun) ----------

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface WeekdayRow {
  day: (typeof WEEKDAYS)[number];
  green: number;
  yellow: number;
  red: number;
  total: number;
}

export function weekdayDistribution(entries: HistoryEntry[], from: string, to: string): WeekdayRow[] {
  const rows: WeekdayRow[] = WEEKDAYS.map((day) => ({ day, green: 0, yellow: 0, red: 0, total: 0 }));
  for (const e of inRange(entries, from, to)) {
    const idx = (fromIso(e.entry_date).getUTCDay() + 6) % 7; // Monday = 0
    rows[idx][e.mood] += 1;
    rows[idx].total += 1;
  }
  return rows;
}

// ---------- trigger ranking ----------

export function triggerRanking(
  entries: HistoryEntry[],
  from: string,
  to: string,
  limit = 8,
): Array<{ trigger: string; count: number }> {
  const counts = new Map<string, { label: string; count: number }>();
  for (const e of inRange(entries, from, to)) {
    // Count each trigger once per day, case-insensitively.
    const seen = new Set<string>();
    for (const raw of e.triggers) {
      const label = raw.trim();
      const key = label.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = counts.get(key);
      if (cur) cur.count += 1;
      else counts.set(key, { label, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((v) => ({ trigger: v.label, count: v.count }));
}

// ---------- weekly trend ----------

export interface WeekBucket {
  /** Monday of the week (ISO date). */
  start: string;
  green: number;
  yellow: number;
  red: number;
  pickedUp: number;
  meltdowns: number;
}

export function mondayOf(iso: string): string {
  const d = fromIso(iso);
  const back = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -back);
}

/** One bucket per calendar week (Mon-Sun) touching the range, oldest first, empty weeks included. */
export function weeklyTrend(entries: HistoryEntry[], from: string, to: string): WeekBucket[] {
  const buckets = new Map<string, WeekBucket>();
  for (let w = mondayOf(from); w <= to; w = addDays(w, 7)) {
    buckets.set(w, { start: w, green: 0, yellow: 0, red: 0, pickedUp: 0, meltdowns: 0 });
  }
  for (const e of inRange(entries, from, to)) {
    const b = buckets.get(mondayOf(e.entry_date));
    if (!b) continue;
    b[e.mood] += 1;
    if (e.picked_up_early) b.pickedUp += 1;
    if (e.had_meltdown) b.meltdowns += 1;
  }
  return [...buckets.values()];
}

// ---------- calendar ----------

export interface CalendarCell {
  date: string;
  inMonth: boolean;
  entry: HistoryEntry | null;
}

/** 6-or-fewer rows of 7 (Mon-first) for the month containing `monthIso` (any date in it). */
export function monthGrid(entries: HistoryEntry[], monthIso: string): CalendarCell[][] {
  const [y, m] = monthIso.split("-").map(Number);
  const first = `${y}-${pad(m)}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${y}-${pad(m)}-${pad(lastDay)}`;
  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const rows: CalendarCell[][] = [];
  for (let start = mondayOf(first); start <= last; start = addDays(start, 7)) {
    const row: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      row.push({ date, inMonth: date >= first && date <= last, entry: byDate.get(date) ?? null });
    }
    rows.push(row);
  }
  return rows;
}

export function shiftMonth(monthIso: string, delta: number): string {
  const [y, m] = monthIso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return toIso(d);
}

/** Longest current run of consecutive green days ending at the latest recorded day on or before `today`. */
export function greenStreak(entries: HistoryEntry[], today: string): number {
  const byDate = new Map(entries.map((e) => [e.entry_date, e.mood]));
  let day = today;
  if (!byDate.has(day)) day = addDays(day, -1); // today not logged yet: don't break the streak
  let n = 0;
  while (byDate.get(day) === "green") {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}
