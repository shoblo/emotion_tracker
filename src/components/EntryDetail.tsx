import { formatDate } from "../lib/dates";
import { MOOD_LABEL } from "../lib/moodRules";
import type { HistoryEntry } from "../lib/stats";
import MoodFace from "./MoodFace";

function Field({ label, children }: { label: string; children: string }) {
  if (!children.trim()) return null;
  return (
    <div className="field">
      <p className="field-label">{label}</p>
      <p className="field-text">{children}</p>
    </div>
  );
}

/** One day's English-only report. Used by both the parent and the teacher. */
export default function EntryDetail({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="card stack detail">
      <div className="detail-head">
        <MoodFace mood={entry.mood} size={64} />
        <div>
          <p className="result-title" style={{ textAlign: "left" }}>{formatDate(entry.entry_date)}</p>
          <p className="hint" style={{ textAlign: "left" }}>{MOOD_LABEL[entry.mood]}</p>
        </div>
      </div>
      <div className="chips">
        {entry.picked_up_early && <span className="chip chip--red">Picked up early</span>}
        {entry.had_incident && <span className="chip chip--yellow">Upset / incident</span>}
        {entry.had_meltdown && <span className="chip chip--yellow">Big meltdown</span>}
        {!entry.picked_up_early && !entry.had_incident && !entry.had_meltdown && (
          <span className="chip chip--green">Good day</span>
        )}
      </div>
      <Field label="Summary">{entry.summary_en}</Field>
      <Field label="What happened">{entry.incident_details_en}</Field>
      {entry.triggers.length > 0 && <Field label="Possible triggers">{entry.triggers.join(", ")}</Field>}
      <Field label="Teacher feedback">{entry.teacher_feedback_en}</Field>
      <details className="details">
        <summary>Full report</summary>
        <p>{entry.transcript_en}</p>
      </details>
    </div>
  );
}
