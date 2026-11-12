import { useState } from "react";
import MoodFace from "../components/MoodFace";
import { parseTriggerInput } from "../lib/analysis";
import { formatDate } from "../lib/dates";
import { saveEntry } from "../lib/entries";
import { computeMood, MOOD_COLOR, MOOD_LABEL } from "../lib/moodRules";
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
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
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
      <div className="card result">
        <MoodFace mood={effective} size={140} />
        <p className="result-title">Saved!</p>
        <p className="hint">{formatDate(f.entry_date)}</p>
        <button type="button" onClick={onSaved} className="btn btn--blue">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card result">
        <p className="hint">{formatDate(f.entry_date)}</p>
        <MoodFace mood={effective} size={130} />
        <p className="result-title">{MOOD_LABEL[effective]}</p>
        {override !== null && override !== computed && (
          <p className="hint">Colour changed by hand (the automatic colour would be {computed}).</p>
        )}
      </div>

      {replacesExisting && (
        <p className="note note--warn">Saving will replace the entry already saved for this date.</p>
      )}

      <div className="card stack">
        <Switch label="Picked up early from school" checked={f.picked_up_early} onChange={setPickedUp} />
        <Switch label="Upset / incident at school" checked={f.had_incident} onChange={(v) => set("had_incident", v)} />
        <Switch label="Big meltdown" checked={f.had_meltdown} onChange={setMeltdown} />

        <label className="label">
          Summary (English)
          <textarea
            value={f.summary_en}
            onChange={(e) => set("summary_en", e.target.value)}
            rows={3}
            className="textarea"
          />
        </label>

        <label className="label">
          What happened (English)
          <textarea
            value={f.incident_details_en}
            onChange={(e) => set("incident_details_en", e.target.value)}
            rows={3}
            className="textarea"
          />
        </label>

        <label className="label">
          Possible triggers (comma separated)
          <input
            value={triggersText}
            onChange={(e) => setTriggersText(e.target.value)}
            placeholder="noise, lunch time, transitions"
            className="input"
          />
        </label>

        <label className="label">
          Teacher feedback (English)
          <textarea
            value={f.teacher_feedback_en}
            onChange={(e) => set("teacher_feedback_en", e.target.value)}
            rows={3}
            className="textarea"
          />
        </label>

        <label className="label">
          Full report in English (the teacher can read this)
          <textarea
            value={f.transcript_en}
            onChange={(e) => set("transcript_en", e.target.value)}
            rows={5}
            className="textarea"
          />
        </label>

        <details className="details">
          <summary>Original text (only you can see this)</summary>
          <p>{f.transcript_original}</p>
        </details>
      </div>

      <div className="card">
        <p className="label">Colour</p>
        <div className="moods">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={effective === m}
              onClick={() => setOverride(m === computed ? null : m)}
              className="mood-btn"
            >
              <span className="dot" style={{ background: MOOD_COLOR[m] }} />
              {m}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Automatic: red if picked up early, yellow if there was an incident, otherwise green. Tap a colour to override.
        </p>
      </div>

      {error && (
        <p className="note note--err" role="alert">
          {error}
        </p>
      )}

      <div className="btns">
        <button type="button" onClick={onBack} disabled={saving} className="btn btn--ghost">
          Back
        </button>
        <button type="button" onClick={save} disabled={saving} className="btn btn--green">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
