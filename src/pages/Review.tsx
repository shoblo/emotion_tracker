import { useState } from "react";
import MoodFace from "../components/MoodFace";
import { parseTriggerInput } from "../lib/analysis";
import { formatDate } from "../lib/dates";
import { saveEntry } from "../lib/entries";
import { computeMood, MOOD_LABEL } from "../lib/moodRules";
import type { EntryDraft, Mood } from "../lib/types";

interface Props {
  draft: EntryDraft;
  /** True when saving will replace an entry that already exists for this date. */
  replacesExisting: boolean;
  onSaved: () => void;
  onBack: () => void;
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
      <span className="text-base font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6"
      />
    </label>
  );
}

const MOODS: Mood[] = ["green", "yellow", "red"];

export default function Review({ draft, replacesExisting, onSaved, onBack }: Props) {
  const [f, setF] = useState<EntryDraft>(draft);
  const [triggersText, setTriggersText] = useState(draft.triggers.join(", "));
  const [override, setOverride] = useState<Mood | null>(draft.mood_overridden ? draft.mood : null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const computed = computeMood(f);
  const effective = override ?? computed;

  function setPickedUp(v: boolean) {
    setF((p) => ({ ...p, picked_up_early: v, had_incident: v ? true : p.had_incident }));
  }
  function setMeltdown(v: boolean) {
    setF((p) => ({ ...p, had_meltdown: v, had_incident: v ? true : p.had_incident }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveEntry({
        ...f,
        had_incident: f.had_incident || f.had_meltdown || f.picked_up_early,
        triggers: parseTriggerInput(triggersText),
        mood: effective,
        mood_overridden: override !== null && override !== computed,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <MoodFace mood={effective} size={140} />
        <p className="text-xl font-semibold">Saved</p>
        <p className="text-slate-600">{formatDate(f.entry_date)}</p>
        <button
          type="button"
          onClick={onSaved}
          className="mt-4 rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-slate-600">{formatDate(f.entry_date)}</p>
        <MoodFace mood={effective} size={130} />
        <p className="text-lg font-semibold">{MOOD_LABEL[effective]}</p>
        {override !== null && override !== computed && (
          <p className="text-xs text-slate-500">Colour changed by hand (the automatic colour would be {computed}).</p>
        )}
      </div>

      {replacesExisting && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          Saving will replace the entry already saved for this date.
        </p>
      )}

      <div className="space-y-2">
        <Switch label="Picked up early from school" checked={f.picked_up_early} onChange={setPickedUp} />
        <Switch label="Upset / incident at school" checked={f.had_incident} onChange={(v) => set("had_incident", v)} />
        <Switch label="Big meltdown" checked={f.had_meltdown} onChange={setMeltdown} />
      </div>

      <label className="block text-sm font-medium">
        Summary (English)
        <textarea
          value={f.summary_en}
          onChange={(e) => set("summary_en", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
        />
      </label>

      <label className="block text-sm font-medium">
        What happened (English)
        <textarea
          value={f.incident_details_en}
          onChange={(e) => set("incident_details_en", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
        />
      </label>

      <label className="block text-sm font-medium">
        Possible triggers (comma separated)
        <input
          value={triggersText}
          onChange={(e) => setTriggersText(e.target.value)}
          placeholder="noise, lunch time, transitions"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
        />
      </label>

      <label className="block text-sm font-medium">
        Teacher feedback (English)
        <textarea
          value={f.teacher_feedback_en}
          onChange={(e) => set("teacher_feedback_en", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
        />
      </label>

      <label className="block text-sm font-medium">
        Full report in English (the teacher can read this)
        <textarea
          value={f.transcript_en}
          onChange={(e) => set("transcript_en", e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
        />
      </label>

      <details className="rounded-xl bg-white p-3 text-sm shadow-sm">
        <summary className="cursor-pointer font-medium">Original text (only you can see this)</summary>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{f.transcript_original}</p>
      </details>

      <div>
        <p className="mb-2 text-sm font-medium">Colour</p>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setOverride(m === computed ? null : m)}
              className={`rounded-xl border-2 py-3 text-sm font-semibold capitalize ${
                effective === m ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Automatic: red if picked up early, yellow if there was an incident, otherwise green. Tap a colour to override.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-xl border border-slate-300 bg-white py-4 text-base font-semibold"
        >
          Back
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
