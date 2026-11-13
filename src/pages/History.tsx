import { useMemo, useState } from "react";
import EntryDetail from "../components/EntryDetail";
import { todayLocal } from "../lib/dates";
import { MOOD_COLOR } from "../lib/moodRules";
import { monthGrid, shiftMonth, WEEKDAYS, type HistoryEntry } from "../lib/stats";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function History({ entries }: { entries: HistoryEntry[] }) {
  const today = todayLocal();
  const [month, setMonth] = useState(today.slice(0, 7) + "-01");
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMemo(() => monthGrid(entries, month), [entries, month]);
  const [y, m] = month.split("-").map(Number);
  const sel = selected ? entries.find((e) => e.entry_date === selected) ?? null : null;
  const thisMonth = today.slice(0, 7) + "-01";

  return (
    <div className="stack">
      <div className="card">
        <div className="cal-head">
          <button type="button" className="pill-link" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <p className="result-title">{MONTHS[m - 1]} {y}</p>
          <button type="button" className="pill-link" aria-label="Next month" disabled={month >= thisMonth} onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
        <div className="cal" role="grid" aria-label="Calendar of daily check-ins">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-dow">{d[0]}</div>
          ))}
          {grid.flat().map((c) => {
            const day = Number(c.date.slice(8));
            const isSel = selected === c.date;
            const label = `${c.date}${c.entry ? ", " + c.entry.mood : ", no entry"}`;
            return (
              <button
                key={c.date}
                type="button"
                className={`cal-cell${c.inMonth ? "" : " cal-cell--out"}${isSel ? " cal-cell--sel" : ""}${c.date === today ? " cal-cell--today" : ""}`}
                disabled={!c.entry}
                aria-label={label}
                aria-pressed={isSel}
                onClick={() => setSelected(c.date)}
              >
                <span className="cal-num">{day}</span>
                {c.entry && <span className="cal-dot" style={{ background: MOOD_COLOR[c.entry.mood] }} />}
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: MOOD_COLOR.green }} /> Happy</span>
          <span><i style={{ background: MOOD_COLOR.yellow }} /> Upset</span>
          <span><i style={{ background: MOOD_COLOR.red }} /> Picked up</span>
        </div>
      </div>

      {sel ? (
        <EntryDetail entry={sel} />
      ) : (
        <p className="hint card">{entries.length === 0 ? "No entries yet." : "Tap a coloured day to read its report."}</p>
      )}
    </div>
  );
}
