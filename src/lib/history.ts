import { supabase } from "./supabase";
import type { HistoryEntry } from "./stats";
import type { Mood } from "./types";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const bool = (v: unknown) => v === true;

export function rowToHistory(r: Record<string, unknown>): HistoryEntry {
  const m = r.mood;
  const mood: Mood = m === "red" || m === "yellow" || m === "green" ? m : "green";
  return {
    id: str(r.id),
    entry_date: str(r.entry_date),
    mood,
    summary_en: str(r.summary_en),
    transcript_en: str(r.transcript_en),
    picked_up_early: bool(r.picked_up_early),
    had_incident: bool(r.had_incident),
    had_meltdown: bool(r.had_meltdown),
    incident_details_en: str(r.incident_details_en),
    triggers: Array.isArray(r.triggers) ? (r.triggers as unknown[]).filter((t): t is string => typeof t === "string") : [],
    teacher_feedback_en: str(r.teacher_feedback_en),
  };
}

/**
 * Loads every entry (newest first) from the teacher_entries view.
 * Both roles use this same view, so the parent's original-language text is never
 * pulled into these screens and the teacher view cannot show it by accident.
 */
export async function loadAllEntries(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("teacher_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToHistory(r as Record<string, unknown>));
}
