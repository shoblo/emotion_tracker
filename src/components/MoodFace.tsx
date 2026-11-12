import type { Mood } from "../lib/types";
import { MOOD_COLOR, MOOD_LABEL } from "../lib/moodRules";

const MOUTH: Record<Mood, string> = {
  green: "M34 70 Q60 94 86 70", // smile
  yellow: "M40 78 L80 78", // flat
  red: "M36 88 Q60 64 84 88", // frown
};

export default function MoodFace({ mood, size = 120 }: { mood: Mood; size?: number }) {
  return (
    <svg
      role="img"
      aria-label={MOOD_LABEL[mood]}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))" }}
    >
      <circle cx="60" cy="60" r="54" fill={MOOD_COLOR[mood]} stroke="#fff" strokeWidth="5" />
      <ellipse cx="34" cy="72" rx="9" ry="6" fill="#ff8fa3" opacity="0.45" />
      <ellipse cx="86" cy="72" rx="9" ry="6" fill="#ff8fa3" opacity="0.45" />
      {mood === "green" ? (
        <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M31 52 q9 -11 18 0" />
          <path d="M71 52 q9 -11 18 0" />
        </g>
      ) : (
        <g fill="#0f172a">
          <circle cx="42" cy="50" r="6" />
          <circle cx="78" cy="50" r="6" />
        </g>
      )}
      {mood === "red" && <ellipse cx="40" cy="64" rx="3.5" ry="6" fill="#8fd3ff" />}
      <path d={MOUTH[mood]} fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
