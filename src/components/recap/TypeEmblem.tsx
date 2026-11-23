import type { RecapTypeId } from "@/types/recap/Recap";

const INK = "currentColor";
const ACCENT = "var(--a)";
const GROUND = "var(--bg)";

// Short strokes around a point, like light off a stock icon.
const Rays = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    {Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={cx + 20 * Math.cos(angle)}
          y1={cy + 20 * Math.sin(angle)}
          x2={cx + 26 * Math.cos(angle)}
          y2={cy + 26 * Math.sin(angle)}
          stroke={ACCENT}
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    })}
  </>
);

const EMBLEMS: Record<RecapTypeId, React.ReactNode> = {
  // The last stock left standing.
  closer: (
    <>
      <circle cx="18" cy="52" r="10" fill="none" stroke={INK} strokeWidth="5" />
      <circle cx="45" cy="52" r="10" fill="none" stroke={INK} strokeWidth="5" />
      <circle
        cx="76"
        cy="52"
        r="13"
        fill={ACCENT}
        stroke={INK}
        strokeWidth="5"
      />
      <Rays cx={76} cy={52} />
    </>
  ),
  // A crowned block, toppled by something much smaller.
  slayer: (
    <>
      <rect
        x="42"
        y="14"
        width="40"
        height="66"
        rx="5"
        fill={INK}
        transform="rotate(13 62 80)"
      />
      <path
        d="M60 8 l6 9 8-7 8 7 6-9 v16 h-28z"
        fill={ACCENT}
        transform="rotate(13 62 80)"
      />
      <circle
        cx="22"
        cy="68"
        r="12"
        fill={ACCENT}
        stroke={INK}
        strokeWidth="5"
      />
      <path d="M8 86 H92" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path
        d="M36 46 l8 6 M32 56 h10 M38 38 l6 9"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
  road: (
    <>
      <path
        d="M50 74 C50 74 28 50 28 34 a22 22 0 1 1 44 0 C72 50 50 74 50 74Z"
        fill={ACCENT}
      />
      <circle cx="50" cy="34" r="8" fill={GROUND} />
      <path
        d="M10 90 Q30 72 50 88 T90 84"
        fill="none"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
    </>
  ),
  local: (
    <>
      <path d="M50 30 V8" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M50 8 h22 l-6 7 6 7 h-22z" fill={ACCENT} />
      <path d="M14 54 L50 26 L86 54 V88 H14Z" fill={INK} />
      <rect x="41" y="60" width="18" height="28" rx="2" fill={ACCENT} />
    </>
  ),
  // A calendar with every week filled.
  iron: (
    <>
      <rect x="14" y="20" width="72" height="68" rx="8" fill={INK} />
      <rect x="14" y="20" width="72" height="18" rx="8" fill={ACCENT} />
      <path
        d="M32 12 v16 M68 12 v16"
        stroke={ACCENT}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g fill={GROUND}>
        {[46, 66].flatMap((y) =>
          [24, 43.5, 63].map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="13" height="13" rx="3" />
          )),
        )}
      </g>
    </>
  ),
  loyal: (
    <>
      <path
        d="M50 88 C18 64 10 46 10 33 a20 20 0 0 1 40 -7 a20 20 0 0 1 40 7 C90 46 82 64 50 88Z"
        fill={ACCENT}
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle
        cx="50"
        cy="48"
        r="10"
        fill={GROUND}
        stroke={INK}
        strokeWidth="5"
      />
    </>
  ),
  lab: (
    <>
      <path
        d="M38 12 H62 M42 12 V40 L20 80 a6 6 0 0 0 5 9 H75 a6 6 0 0 0 5 -9 L58 40 V12"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 64 H68 L78 84 H22Z" fill={INK} />
      <circle cx="46" cy="52" r="4" fill={ACCENT} />
      <circle cx="56" cy="42" r="3" fill={ACCENT} />
      <circle cx="50" cy="28" r="3" fill={ACCENT} />
    </>
  ),
  gate: (
    <>
      <path
        d="M18 90 V44 a32 32 0 0 1 64 0 V90"
        fill="none"
        stroke={INK}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M34 90 V26 M50 90 V16 M66 90 V26 M18 58 H82"
        stroke={INK}
        strokeWidth="5"
      />
      <circle
        cx="50"
        cy="58"
        r="9"
        fill={ACCENT}
        stroke={INK}
        strokeWidth="4"
      />
    </>
  ),
  rookie: (
    <>
      <path d="M50 90 V46" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d="M50 58 C50 34 30 26 14 28 C14 48 30 60 50 58Z" fill={INK} />
      <path d="M50 46 C50 24 68 14 86 16 C86 36 70 48 50 46Z" fill={INK} />
      <path d="M20 90 H80" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d="M24 6 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill={ACCENT} />
    </>
  ),
};

// A player type's emblem. Drawn in the colours its container sets: the
// current text colour, `--a` (accent) and `--bg` (the ground behind it).
export const TypeEmblem = ({ type }: { type: RecapTypeId }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    {EMBLEMS[type]}
  </svg>
);
