import { supabase } from "./supabase";
import type { EntryDraft, Mood } from "./types";

const asBool = (v: unknown): boolean => v === true;
const asStr = (v: unknown): string => (typeof v === "string" ? v : "");

/** Converts a database row into the shape the screens use (null-safe). */
export function rowToDraft(row: Record<string, unknown>): EntryDraft {
  const m = row.mood;
  const mood: Mood = m === "red" || m === "yellow" || m === "green" ? m : "green";
  const triggers = Array.isArray(row.triggers)
    ? (row.triggers as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  return {
    entry_date: asStr(row.entry_date),
    transcript_original: asStr(row.transcript_original),
    transcript_en: asStr(row.transcript_en),
    mood,
    mood_overridden: asBool(row.mood_overridden),
    summary_en: asStr(row.summary_en),
    picked_up_early: asBool(row.picked_up_early),
    had_incident: asBool(row.had_incident),
    had_meltdown: asBool(row.had_meltdown),
    incident_details_en: asStr(row.incident_details_en),
    triggers,
    teacher_feedback_en: asStr(row.teacher_feedback_en),
  };
}

export async function loadEntry(date: string): Promise<EntryDraft | null> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("entry_date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToDraft(data as Record<string, unknown>) : null;
}

/** One entry per day: inserts, or replaces the existing entry for that date. */
export async function saveEntry(d: EntryDraft): Promise<void> {
  const { error } = await supabase.from("daily_entries").upsert(
    {
      entry_date: d.entry_date,
      transcript_original: d.transcript_original,
      transcript_en: d.transcript_en,
      mood: d.mood,
      mood_overridden: d.mood_overridden,
      summary_en: d.summary_en,
      picked_up_early: d.picked_up_early,
      had_incident: d.had_incident,
      had_meltdown: d.had_meltdown,
      incident_details_en: d.incident_details_en,
      triggers: d.triggers,
      teacher_feedback_en: d.teacher_feedback_en,
    },
    { onConflict: "entry_date" },
  );
  if (error) throw new Error(error.message);
}
