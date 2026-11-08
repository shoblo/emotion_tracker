export type Mood = "green" | "yellow" | "red";
export type Role = "parent" | "teacher";

/** What the AI extracts from the parent's report. */
export interface Analysis {
  transcript_en: string;
  picked_up_early: boolean;
  had_incident: boolean;
  had_meltdown: boolean;
  incident_details_en: string;
  triggers: string[];
  teacher_feedback_en: string;
  summary_en: string;
}

/** A day's entry as shown on the review screen (before or after saving). */
export interface EntryDraft extends Analysis {
  entry_date: string; // YYYY-MM-DD, local date
  transcript_original: string;
  mood: Mood;
  mood_overridden: boolean;
}
