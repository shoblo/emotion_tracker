import { useMemo, useState } from "react";
import { addDays, countRange, daysInRange, greenStreak, lastNDays, triggerRanking, weekdayDistribution, weeklyTrend, type HistoryEntry } from "../lib/stats";
import { todayLocal } from "../lib/dates";
import { MOOD_COLOR } from "../lib/moodRules";
import type { Mood } from "../lib/types";

type Preset = 7 | 30 | 90 | "custom";
const MOODS: Mood[] = ["green", "yellow", "red"];

function Stack({ g, y, r }: { g: number; y: number; r: number }) {
  const total = g + y + r;
  if (!total) return <div className="bar bar--empty" />;
  return (
    <div className="bar" role="img" aria-label={`${g} green, ${y} yellow, ${r} red`}>
      {[["green", g], ["yellow", y], ["red", r]].map(([m, n]) =>
        (n as number) > 0 ? <span key={m as string} style={{ width: `${((n as number) / total) * 100}%`, background: MOOD_COLOR[m as Mood] }} /> : null,
      )}
    </div>
  );
}

export default function Insights({ entries }: { entries: HistoryEntry[] }) {
  const today = todayLocal();
  const [preset, setPreset] = useState<Preset>(7);
  const [custom, setCustom] = useState({ from: addDays(today, -13), to: today });

  const range = preset === "custom" ? custom : lastNDays(today, preset);
  const valid = range.from <= range.to;
  const from = valid ? range.from : range.to;
  const to = range.to;

  const counts = useMemo(() => countRange(entries, from, to), [entries, from, to]);
  const weekdays = useMemo(() => weekdayDistribution(entries, from, to), [entries, from, to]);
  const triggers = useMemo(() => triggerRanking(entries, from, to), [entries, from, to]);
  const weeks = useMemo(() => weeklyTrend(entries, from, to), [entries, from, to]);
  const streak = useMemo(() => greenStreak(entries, today), [entries, today]);
  const maxTrig = Math.max(1, ...triggers.map((t) => t.count));
  const maxWeek = Math.max(1, ...weeks.map((w) => w.green + w.yellow + w.red));

  return (
    <div className="stack">
      <div className="card stack">
        <div className="seg seg--wide" role="group" aria-label="Time range">
          {([7, 30, 90, "custom"] as Preset[]).map((p) => (
            <button key={String(p)} type="button" aria-pressed={preset === p} onClick={() => setPreset(p)}>
              {p === "custom" ? "Custom" : `${p} days`}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="row">
            <label className="label">From
              <input type="date" className="input input--inline" value={custom.from} max={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} />
            </label>
            <label className="label">To
              <input type="date" className="input input--inline" value={custom.to} min={custom.from} max={today} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} />
            </label>
          </div>
        )}
        <p className="hint">{daysInRange(from, to)} days · {counts.recorded} recorded{counts.missing ? ` · ${counts.missing} not recorded` : ""}</p>
      </div>

      <div className="card">
        <div className="tiles">
          {MOODS.map((m) => (
            <div key={m} className="tile">
              <span className="dot" style={{ background: MOOD_COLOR[m] }} />
              <p className="tile-num">{counts[m]}</p>
              <p className="tile-label">{m === "green" ? "Green" : m === "yellow" ? "Yellow" : "Red"}</p>
            </div>
          ))}
        </div>
        <Stack g={counts.green} y={counts.yellow} r={counts.red} />
        <div className="tiles tiles--small">
          <div className="tile"><p className="tile-num">{counts.pickedUp}</p><p className="tile-label">Picked up early</p></div>
          <div className="tile"><p className="tile-num">{counts.meltdowns}</p><p className="tile-label">Meltdowns</p></div>
          <div className="tile"><p className="tile-num">{streak}</p><p className="tile-label">Green streak</p></div>
        </div>
      </div>

      <div className="card">
        <p className="label">Week by week</p>
        <div className="weeks" role="img" aria-label="Green, yellow and red days per week">
          {weeks.map((w) => {
            const t = w.green + w.yellow + w.red;
            return (
              <div key={w.start} className="week">
                <div className="week-bar" style={{ height: `${(t / maxWeek) * 100}%` }}>
                  {[["red", w.red], ["yellow", w.yellow], ["green", w.green]].map(([m, n]) =>
                    (n as number) > 0 ? <span key={m as string} style={{ flex: n as number, background: MOOD_COLOR[m as Mood] }} /> : null,
                  )}
                </div>
                <p className="week-label">{w.start.slice(8)}/{w.start.slice(5, 7)}</p>
              </div>
            );
          })}
        </div>
        <p className="hint">Each bar is one week (labelled with its Monday).</p>
      </div>

      <div className="card stack">
        <p className="label">Which weekdays are harder?</p>
        {weekdays.map((d) => (
          <div key={d.day} className="wd">
            <span className="wd-name">{d.day}</span>
            <Stack g={d.green} y={d.yellow} r={d.red} />
            <span className="wd-n">{d.total}</span>
          </div>
        ))}
      </div>

      <div className="card stack">
        <p className="label">Most common triggers</p>
        {triggers.length === 0 && <p className="hint">No triggers recorded in this period.</p>}
        {triggers.map((t) => (
          <div key={t.trigger} className="wd wd--trig">
            <span className="trig-name">{t.trigger}</span>
            <div className="bar"><span style={{ width: `${(t.count / maxTrig) * 100}%`, background: "var(--coral)" }} /></div>
            <span className="wd-n">{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
