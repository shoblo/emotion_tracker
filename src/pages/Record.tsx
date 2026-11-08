import { useEffect, useRef, useState } from "react";
import { analyzeText, type ReportLanguage } from "../lib/analyze";
import { formatDate, todayLocal } from "../lib/dates";
import { loadEntry } from "../lib/entries";
import { computeMood } from "../lib/moodRules";
import { speechSupported, startListening, type Listener } from "../lib/speech";
import type { EntryDraft } from "../lib/types";

interface Props {
  /** Called with the analysed draft. `replaces` is true if an entry for that date already exists. */
  onAnalyzed: (draft: EntryDraft, replaces: boolean) => void;
  /** Open the already-saved entry for the date without re-analysing. */
  onOpenExisting: (draft: EntryDraft) => void;
}

export default function Record({ onAnalyzed, onOpenExisting }: Props) {
  const [date, setDate] = useState(todayLocal());
  const [lang, setLang] = useState<ReportLanguage>("zh");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<EntryDraft | null>(null);
  const [append, setAppend] = useState(true);

  const listenerRef = useRef<Listener | null>(null);
  const baseRef = useRef("");

  // Stop the microphone if the page is left while recording.
  useEffect(() => () => listenerRef.current?.stop(), []);

  // Is there already an entry for the chosen date?
  useEffect(() => {
    let cancelled = false;
    setExisting(null);
    loadEntry(date)
      .then((e) => {
        if (!cancelled) setExisting(e);
      })
      .catch(() => {
        if (!cancelled) setExisting(null);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  function toggleListening() {
    if (listening) {
      listenerRef.current?.stop();
      return;
    }
    setError(null);
    baseRef.current = text.trim();
    setListening(true);
    listenerRef.current = startListening({
      lang: lang === "zh" ? "zh-CN" : "en-NZ",
      onText: (spoken) => setText(baseRef.current ? `${baseRef.current}\n${spoken}` : spoken),
      onError: (msg) => setError(msg),
      onStop: () => setListening(false),
    });
  }

  async function analyse() {
    const spoken = text.trim();
    if (!spoken || busy) return;
    listenerRef.current?.stop();
    setBusy(true);
    setError(null);
    try {
      const original =
        existing && append && existing.transcript_original
          ? `${existing.transcript_original}\n${spoken}`
          : spoken;
      const result = await analyzeText(original, lang);
      onAnalyzed(
        {
          ...result,
          entry_date: date,
          transcript_original: original,
          mood: computeMood(result),
          mood_overridden: false,
        },
        existing !== null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const supported = speechSupported();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium">
          Date
          <input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
        </label>
        <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm font-medium">
          <button
            type="button"
            onClick={() => setLang("zh")}
            disabled={listening}
            className={`px-4 py-2 ${lang === "zh" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            disabled={listening}
            className={`px-4 py-2 ${lang === "en" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            English
          </button>
        </div>
      </div>

      {existing && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium">An entry for {formatDate(date)} is already saved.</p>
          <label className="mt-2 flex items-start gap-2">
            <input
              type="checkbox"
              checked={append}
              onChange={(e) => setAppend(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>Add what I say now to the saved report (untick to replace it).</span>
          </label>
          <button
            type="button"
            onClick={() => onOpenExisting(existing)}
            className="mt-2 text-sm font-semibold underline"
          >
            Open the saved entry
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!supported || busy}
          aria-pressed={listening}
          className={`flex h-28 w-28 items-center justify-center rounded-full text-5xl text-white shadow-lg transition disabled:opacity-40 ${
            listening ? "animate-pulse bg-red-600" : "bg-slate-900"
          }`}
        >
          {listening ? "■" : "🎤"}
        </button>
        <p className="text-sm text-slate-600">
          {listening
            ? "Listening… tap to stop"
            : supported
              ? "Tap to speak about today"
              : "Voice input isn't available in this browser. Type below, or use your keyboard's microphone."}
        </p>
      </div>

      <label className="block text-sm font-medium">
        What happened today? (you can edit the text)
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={
            lang === "zh"
              ? "例如：今天老师说他上午很开心，但是午饭后哭了，没有被接回家。"
              : "e.g. The teacher said he had a good morning but cried after lunch. He stayed all day."
          }
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
        />
      </label>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={analyse}
        disabled={!text.trim() || busy}
        className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {busy ? "Analysing…" : "Analyse"}
      </button>
    </div>
  );
}
