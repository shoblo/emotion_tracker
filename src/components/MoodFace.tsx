import type { Mood } from "../lib/types";
import { MOOD_COLOR, MOOD_LABEL } from "../lib/moodRules";

const MOUTH: Record<Mood, string> = {
  green: "M 34 68 Q 60 92 86 68", // smile
  yellow: "M 38 76 L 82 76", // flat
  red: "M 34 86 Q 60 62 86 86", // frown
};

export default function MoodFace({ mood, size = 120 }: { mood: Mood; size?: number }) {
  return (
    <svg role="img" aria-label={MOOD_LABEL[mood]} width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill={MOOD_COLOR[mood]} />
      <circle cx="42" cy="48" r="6" fill="#0f172a" />
      <circle cx="78" cy="48" r="6" fill="#0f172a" />
      <path d={MOUTH[mood]} fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
