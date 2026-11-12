// A happy puppy and kitten (original drawing, simple SVG shapes).

export default function Pets({ className }: { className?: string }) {
  const ink = "#4a2f22";
  return (
    <svg className={className} viewBox="0 0 230 160" role="img" aria-label="A happy puppy and kitten">
      <ellipse cx="115" cy="156" rx="100" ry="5" fill="#000" opacity="0.08" />

      {/* ---------- cat (behind) ---------- */}
      <path d="M198 138 q24 -6 18 -36" stroke="#b8aea2" strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="160" cy="134" rx="30" ry="22" fill="#efe9df" />
      <ellipse cx="148" cy="152" rx="9" ry="6" fill="#efe9df" />
      <ellipse cx="172" cy="152" rx="9" ry="6" fill="#efe9df" />
      <circle cx="160" cy="98" r="30" fill="#d3c9bd" />
      <path d="M134 84 L136 58 L156 74Z" fill="#b9ae9f" />
      <path d="M138 80 L139 66 L150 74Z" fill="#f5b5c0" />
      <path d="M186 84 L184 58 L164 74Z" fill="#b9ae9f" />
      <path d="M182 80 L181 66 L170 74Z" fill="#f5b5c0" />
      <ellipse cx="160" cy="108" rx="18" ry="14" fill="#f4efe8" />
      <g stroke="#9c9183" strokeWidth="2.5" strokeLinecap="round">
        <path d="M160 70 v7" />
        <path d="M151 72 l2 6" />
        <path d="M169 72 l-2 6" />
      </g>
      <g stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M142 98 q6 -8 12 0" />
        <path d="M166 98 q6 -8 12 0" />
        <path d="M160 110 q-5 6 -10 1" strokeWidth="2.2" />
        <path d="M160 110 q5 6 10 1" strokeWidth="2.2" />
      </g>
      <path d="M156 105 h8 l-4 5z" fill="#f08aa0" />
      <g stroke="#8c8174" strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
        <path d="M136 106 L122 103" />
        <path d="M136 110 L122 113" />
        <path d="M184 106 L198 103" />
        <path d="M184 110 L198 113" />
      </g>
      <circle cx="142" cy="108" r="5" fill="#ff9eb0" opacity="0.5" />
      <circle cx="178" cy="108" r="5" fill="#ff9eb0" opacity="0.5" />
      <path d="M138 120 Q160 132 182 120" stroke="#ef5b4c" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="160" cy="128" r="5" fill="#f5c542" stroke="#d9a32a" strokeWidth="1.5" />

      {/* ---------- dog (front) ---------- */}
      <path d="M32 128 q-20 -4 -16 -26" stroke="#e6a23c" strokeWidth="12" strokeLinecap="round" fill="none" />
      <ellipse cx="80" cy="128" rx="44" ry="28" fill="#f7c25c" />
      <ellipse cx="86" cy="134" rx="26" ry="18" fill="#fde3a4" />
      <ellipse cx="60" cy="150" rx="14" ry="8" fill="#f7c25c" />
      <ellipse cx="98" cy="150" rx="14" ry="8" fill="#f7c25c" />
      <circle cx="80" cy="78" r="40" fill="#f9c968" />
      <ellipse cx="42" cy="78" rx="13" ry="26" transform="rotate(14 42 78)" fill="#e6a23c" />
      <ellipse cx="118" cy="78" rx="13" ry="26" transform="rotate(-14 118 78)" fill="#e6a23c" />
      <ellipse cx="80" cy="92" rx="22" ry="17" fill="#fde8b8" />
      <g stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M58 74 q7 -9 14 0" />
        <path d="M88 74 q7 -9 14 0" />
        <path d="M80 91 v5" strokeWidth="3" />
        <path d="M80 96 q-9 9 -17 1" strokeWidth="3" />
        <path d="M80 96 q9 9 17 1" strokeWidth="3" />
      </g>
      <ellipse cx="80" cy="86" rx="8" ry="5.5" fill={ink} />
      <circle cx="77" cy="84.5" r="1.6" fill="#fff" opacity="0.8" />
      <path d="M74 98 q6 13 12 0z" fill="#ff8fa3" />
      <circle cx="56" cy="92" r="6" fill="#ff9eb0" opacity="0.55" />
      <circle cx="104" cy="92" r="6" fill="#ff9eb0" opacity="0.55" />
      <path d="M50 108 Q80 124 110 108 L80 142Z" fill="#ef5b4c" />
      <g fill="#fff" opacity="0.9">
        <circle cx="68" cy="115" r="2.5" />
        <circle cx="92" cy="115" r="2.5" />
        <circle cx="80" cy="127" r="2.5" />
      </g>
    </svg>
  );
}
