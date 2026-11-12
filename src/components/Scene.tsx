// Decorative meadow background drawn in SVG (sky, clouds, hills, tree, fence, flowers).
// Anchored to the bottom-centre so the middle of the picture is what phones show.

const FLOWERS: Array<[number, number, string, number]> = [
  [70, 705, "#ffffff", 1.1],
  [150, 765, "#ffb3c7", 1.2],
  [260, 692, "#ffffff", 0.9],
  [335, 772, "#ffd166", 1],
  [395, 700, "#ffb3c7", 0.9],
  [440, 735, "#ffffff", 1],
  [505, 778, "#ffffff", 1.2],
  [560, 705, "#ff9aa8", 0.95],
  [620, 758, "#ffd166", 1],
  [670, 700, "#ffffff", 1],
  [725, 772, "#ffb3c7", 1.15],
  [790, 712, "#ffd166", 1.05],
  [850, 770, "#ffffff", 1],
  [930, 705, "#ff9aa8", 1.2],
  [1030, 775, "#ffffff", 1],
  [1100, 700, "#ffd166", 1.1],
  [1165, 765, "#ffb3c7", 1],
];

function Flower({ x, y, color, s }: { x: number; y: number; color: string; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-7" rx="4.6" ry="7" transform={`rotate(${a})`} fill={color} />
      ))}
      <circle r="3.8" fill="#f7c948" />
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity="0.95">
      <ellipse cx="0" cy="0" rx="52" ry="22" />
      <ellipse cx="-32" cy="6" rx="34" ry="18" />
      <ellipse cx="36" cy="8" rx="38" ry="18" />
      <ellipse cx="6" cy="-14" rx="34" ry="22" />
    </g>
  );
}

function Heart({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 6 C-10 -6 -18 6 0 18 C18 6 10 -6 0 6Z"
      fill={c}
      opacity="0.85"
    />
  );
}

export default function Scene() {
  return (
    <svg
      className="scene"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a6dbf5" />
          <stop offset="0.55" stopColor="#dcf2fb" />
          <stop offset="1" stopColor="#eaf8e6" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#sky)" />
      <circle cx="220" cy="90" r="230" fill="url(#glow)" />

      <Cloud x={260} y={120} s={1.3} />
      <Cloud x={560} y={85} s={1.1} />
      <Cloud x={860} y={175} s={1.4} />
      <Cloud x={1070} y={80} s={1} />
      <Cloud x={690} y={235} s={0.8} />
      <Cloud x={450} y={205} s={0.7} />

      {/* hills */}
      <path d="M0 520 C150 470 300 470 450 520 C600 570 750 480 900 490 C1050 500 1130 520 1200 500 V800 H0Z" fill="#c6e8ad" />
      <path d="M0 600 C200 540 380 560 560 610 C760 665 960 560 1200 590 V800 H0Z" fill="#a9da8c" />

      {/* tree */}
      <path d="M135 650 C145 555 125 480 155 390 L195 390 C180 480 205 555 215 650Z" fill="#a8703a" />
      <circle cx="100" cy="340" r="88" fill="#7cc255" />
      <circle cx="225" cy="305" r="98" fill="#86ca5b" />
      <circle cx="165" cy="235" r="80" fill="#91d264" />
      <circle cx="60" cy="410" r="58" fill="#7cc255" />
      <circle cx="265" cy="395" r="68" fill="#86ca5b" />
      <circle cx="140" cy="290" r="46" fill="#a3dc78" opacity="0.8" />

      {/* front grass */}
      <path d="M0 680 C250 640 500 660 700 690 C900 715 1050 660 1200 675 V800 H0Z" fill="#8fcd70" />

      {/* fence */}
      <g fill="#e2b06c">
        <rect x="925" y="585" width="275" height="14" rx="7" />
        <rect x="925" y="632" width="275" height="14" rx="7" />
        {[950, 1015, 1080, 1145].map((x) => (
          <rect key={x} x={x} y="560" width="26" height="122" rx="9" />
        ))}
      </g>

      {FLOWERS.map(([x, y, color, s]) => (
        <Flower key={`${x}-${y}`} x={x} y={y} color={color} s={s} />
      ))}

      <Heart x={520} y={255} s={0.8} c="#ff8fa3" />
      <Heart x={905} y={265} s={0.6} c="#ff8fa3" />

      {/* butterfly (sits beside the card on wide screens) */}
      <g transform="translate(330 430) rotate(-12)">
        <ellipse cx="-10" cy="-6" rx="14" ry="10" fill="#ffb74d" />
        <ellipse cx="10" cy="-6" rx="14" ry="10" fill="#ffa23a" />
        <ellipse cx="-8" cy="8" rx="10" ry="8" fill="#ffd180" />
        <ellipse cx="8" cy="8" rx="10" ry="8" fill="#ffc266" />
        <rect x="-1.5" y="-12" width="3" height="26" rx="1.5" fill="#6b4423" />
      </g>

      {/* little yellow bird */}
      <g transform="translate(900 360)">
        <ellipse cx="0" cy="0" rx="22" ry="16" fill="#ffd54f" />
        <circle cx="-14" cy="-10" r="11" fill="#ffd54f" />
        <path d="M-24 -10 l-9 3 l9 3z" fill="#ff9a3c" />
        <circle cx="-17" cy="-12" r="2" fill="#4a2f22" />
        <path d="M2 -2 q16 -22 30 -16 q-8 4 -14 18z" fill="#ffb74d" />
        <path d="M18 2 l16 6 l-18 2z" fill="#ffb74d" />
      </g>
    </svg>
  );
}
