import type { Mood } from "./types";

export interface MoodFlags {
  picked_up_early: boolean;
  had_incident: boolean;
  had_meltdown: boolean;
}

/**
 * The colour rule (kept identical to the database trigger apply_entry_rules):
 *  - Red:    the child was picked up early (whatever else happened)
 *  - Yellow: upset / incident at school, but NOT picked up (a meltdown counts as an incident)
 *  - Green:  otherwise
 */
export function computeMood(f: MoodFlags): Mood {
  if (f.picked_up_early) return "red";
  if (f.had_incident || f.had_meltdown) return "yellow";
  return "green";
}

export const MOOD_LABEL: Record<Mood, string> = {
  green: "Green: happy day",
  yellow: "Yellow: upset at school",
  red: "Red: picked up early",
};

export const MOOD_COLOR: Record<Mood, string> = {
  green: "#22c55e",
  yellow: "#facc15",
  red: "#ef4444",
};
