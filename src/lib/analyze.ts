import { supabase } from "./supabase";
import { normalizeAnalysis } from "./analysis";
import type { Analysis } from "./types";

export type ReportLanguage = "zh" | "en";

async function readError(error: unknown): Promise<string> {
  // supabase-js puts the failed Response in error.context for non-2xx replies.
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = (await ctx.json()) as { message?: unknown };
      if (typeof body?.message === "string") return body.message;
    } catch {
      /* fall through */
    }
  }
  return error instanceof Error ? error.message : "Analysis failed. Please try again.";
}

/** Sends the (edited) text to the analyze-entry Edge Function and returns validated results. */
export async function analyzeText(text: string, language: ReportLanguage): Promise<Analysis> {
  const { data, error } = await supabase.functions.invoke("analyze-entry", {
    body: { text, language },
  });
  if (error) throw new Error(await readError(error));
  const payload = data as { analysis?: unknown } | null;
  return normalizeAnalysis(payload?.analysis);
}
