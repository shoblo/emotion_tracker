import type { Analysis } from "./types";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function labels(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.trim().toLowerCase().slice(0, 40);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 8) break;
  }
  return out;
}

/** Second line of defence on the client: validates what the Edge Function returned. */
export function normalizeAnalysis(raw: unknown): Analysis {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Unexpected response from the analysis service.");
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.transcript_en !== "string") throw new Error("Unexpected response from the analysis service.");
  for (const k of ["picked_up_early", "had_incident", "had_meltdown"] as const) {
    if (typeof o[k] !== "boolean") throw new Error("Unexpected response from the analysis service.");
  }
  const meltdown = o.had_meltdown === true;
  const pickedUp = o.picked_up_early === true;
  return {
    transcript_en: str(o.transcript_en, 12000),
    picked_up_early: pickedUp,
    had_incident: o.had_incident === true || meltdown || pickedUp,
    had_meltdown: meltdown,
    incident_details_en: str(o.incident_details_en, 2000),
    triggers: labels(o.triggers),
    teacher_feedback_en: str(o.teacher_feedback_en, 2000),
    summary_en: str(o.summary_en, 1000),
  };
}

/** "noise, lunch time ,Noise" -> ["noise", "lunch time"] */
export function parseTriggerInput(input: string): string[] {
  return labels(input.split(/[,;\n]/));
}
