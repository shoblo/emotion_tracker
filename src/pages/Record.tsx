import { useEffect, useRef, useState } from "react";
import Pets from "../components/Pets";
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

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
    </svg>
  );
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

  // Add ?debug=1 to the site address to see the raw speech-recognition results on screen.
  const debugOn = useRef(new URLSearchParams(window.location.search).has("debug")).current;
  const [debugLog, setDebugLog] = useState<string[]>([]);

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
      onDebug: debugOn ? (line) => setDebugLog((prev) => [...prev.slice(-9), line]) : undefined,
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
    <>
      <div className="card stack">
        <div className="row">
          <label className="label">
            📅 Date
            <input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="input input--inline"
            />
          </label>
          <div className="seg" role="group" aria-label="Language you will speak">
            <button type="button" onClick={() => setLang("zh")} disabled={listening} aria-pressed={lang === "zh"}>
              中文
            </button>
            <button type="button" onClick={() => setLang("en")} disabled={listening} aria-pressed={lang === "en"}>
              English
            </button>
          </div>
        </div>

        {existing && (
          <div className="note note--warn">
            <strong>An entry for {formatDate(date)} is already saved.</strong>
            <label>
              <input type="checkbox" checked={append} onChange={(e) => setAppend(e.target.checked)} />
              <span>Add what I say now to the saved report (untick to replace it).</span>
            </label>
            <button type="button" onClick={() => onOpenExisting(existing)} className="linkbtn">
              Open the saved entry
            </button>
          </div>
        )}

        <div className="mic-wrap">
          <button
            type="button"
            onClick={toggleListening}
            disabled={!supported || busy}
            aria-pressed={listening}
            aria-label={listening ? "Stop recording" : "Start recording"}
            className={`mic${listening ? " mic--on" : ""}`}
          >
            {listening ? <StopIcon /> : <MicIcon />}
          </button>
          <p className="hint">
            {listening
              ? "Listening… tap to stop"
              : supported
                ? "Tap to speak about today"
                : "Voice input isn't available in this browser. Type below, or use your keyboard's microphone."}
          </p>
        </div>

        <label className="label">
          💬 What happened today? (you can edit the text)
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={
              lang === "zh"
                ? "例如：今天老师说他上午很开心，但是午饭后哭了，没有被接回家。"
                : "e.g. The teacher said he had a good morning but cried after lunch. He stayed all day."
            }
            className="textarea"
          />
        </label>

        {debugOn && (
          <pre className="debug">
            {debugLog.length ? debugLog.join("\n") : "Debug: raw speech results will appear here."}
          </pre>
        )}

        {error && (
          <p className="note note--err" role="alert">
            {error}
          </p>
        )}

        <button type="button" onClick={analyse} disabled={!text.trim() || busy} className="btn btn--green">
          {busy ? "Analysing…" : "Analyse"}
        </button>
      </div>

      <Pets className="pets pets--bottom bob" />
    </>
  );
}
