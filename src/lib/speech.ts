// Thin wrapper around the browser's built-in speech recognition (free, no server involved).
// Works in Chrome/Edge on Android and desktop; Safari support is partial; Firefox has none.
// The text box on the Record page is always editable, and the phone keyboard's own
// dictation button works there too, so speech recognition here is a convenience, not a requirement.

export type SpeechLang = "zh-CN" | "en-NZ";

/* eslint-disable @typescript-eslint/no-explicit-any */
type RecognitionCtor = new () => any;

function getCtor(): RecognitionCtor | null {
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as RecognitionCtor | null;
}

export function speechSupported(): boolean {
  return getCtor() !== null;
}

export interface Listener {
  stop(): void;
}

interface Options {
  lang: SpeechLang;
  /** Called with the FULL text recognised so far in this session (not just the newest piece). */
  onText: (fullText: string) => void;
  onError: (message: string) => void;
  /** Called once, when listening has really ended. */
  onStop: () => void;
}

function join(a: string, b: string): string {
  return a && b ? `${a} ${b}` : a || b;
}

export function startListening(opts: Options): Listener {
  const Ctor = getCtor();
  if (!Ctor) {
    opts.onError("Speech recognition is not supported in this browser. You can type, or use your keyboard's microphone button.");
    opts.onStop();
    return { stop: () => undefined };
  }

  let stopped = false;
  let committed = ""; // text from earlier recogniser runs in this session
  let latest = ""; // everything recognised so far, including the current run
  let quickEnds = 0; // guards against a restart loop if the recogniser keeps ending instantly
  let current: any = null;

  const begin = () => {
    const rec = new Ctor();
    current = rec;
    rec.lang = opts.lang;
    rec.continuous = true;
    rec.interimResults = true;
    const startedAt = Date.now();

    rec.onresult = (e: any) => {
      // Rebuild from ALL results each time: more robust than appending (avoids duplicated phrases).
      let run = "";
      for (let i = 0; i < e.results.length; i++) run += e.results[i][0].transcript;
      latest = join(committed, run.trim());
      opts.onText(latest);
    };

    rec.onerror = (e: any) => {
      const code = String(e?.error ?? "");
      if (code === "no-speech" || code === "aborted") return;
      stopped = true;
      if (code === "not-allowed" || code === "service-not-allowed") {
        opts.onError("Microphone permission was denied. Allow microphone access for this site in your browser settings.");
      } else if (code === "network") {
        opts.onError("Speech recognition needs an internet connection.");
      } else if (code === "language-not-supported") {
        opts.onError("This language is not supported by your browser's speech recognition.");
      } else {
        opts.onError(`Speech recognition stopped (${code || "unknown error"}). You can type instead.`);
      }
    };

    rec.onend = () => {
      if (stopped) {
        opts.onStop();
        return;
      }
      // The browser ends a session by itself after a pause; keep going until the user taps stop.
      quickEnds = Date.now() - startedAt < 400 ? quickEnds + 1 : 0;
      if (quickEnds >= 3) {
        stopped = true;
        opts.onError("Speech recognition keeps stopping. You can type instead.");
        opts.onStop();
        return;
      }
      committed = latest;
      begin();
    };

    try {
      rec.start();
    } catch {
      stopped = true;
      opts.onError("Could not start the microphone.");
      opts.onStop();
    }
  };

  begin();

  return {
    stop() {
      stopped = true;
      try {
        current?.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}
