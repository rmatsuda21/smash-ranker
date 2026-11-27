// Types and pure helpers shared by the results image layouts
// (api/results-image.ts and api/_lib/resultsPathGraphic.ts).
import type React from "react";

export type PredictionPalette = {
  bgGradientStart: string;
  bgGradientEnd: string;
  accent: string;
  accentRowBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFooter: string;
  borderSubtle: string;
};

export type SetOpponent = {
  name: string;
  prefix?: string;
  country?: string;
  topRanking?: PlayerRanking;
  seed: number;
  placement: number;
  characters: string[];
  fallbackCharacterId?: string | null;
};

export type ResultSet = {
  id: string;
  fullRoundText: string;
  scoreSelf: number;
  scoreOpponent: number;
  didWin: boolean;
  isDQ: boolean;
  upsetFactor?: number;
  phaseId: string;
  phaseName: string;
  selfCharacters: string[];
  opponent: SetOpponent;
};

export type PlayerRanking = {
  title: string;
  rank: number;
  displayTitle?: string;
};

export type PlayerInfo = {
  name: string;
  prefix?: string;
  country?: string;
  iconUrl?: string;
  rankings: PlayerRanking[];
  seed: number;
  placement: number;
  wins: number;
  losses: number;
};

// Mirrors src/types/results/SetListDisplay.ts.
export type SetListLayout = "path" | "versus" | "bracket" | "compact";
export type SetListStyle =
  "default" | "borderedDots" | "scoreline" | "gradientEdge";
export type SetListDisplay = { layout: SetListLayout; style: SetListStyle };
export const SET_LIST_LAYOUTS: readonly SetListLayout[] = [
  "path",
  "versus",
  "bracket",
  "compact",
];
export const SET_LIST_STYLES: readonly SetListStyle[] = [
  "default",
  "borderedDots",
  "scoreline",
  "gradientEdge",
];
export const DEFAULT_DISPLAY: SetListDisplay = {
  layout: "versus",
  style: "default",
};

export type RequestBody = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentIconUrl: string;
  tournamentCountry?: string | null;
  numEntrants: number;
  palette?: Partial<PredictionPalette>;
  locale?: string;
  player: PlayerInfo;
  fallbackCharacterId?: string | null;
  sets: ResultSet[];
  display?: SetListDisplay;
};

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Stylistic tier for the UF badge. Mirrors `upsetTier` in
// src/utils/results/upsetFactor.ts; satori can't run that file directly so we
// inline the tiny mapping here.
export type UpsetTier = "minor" | "notable" | "major" | "legendary";
export function upsetTier(uf: number): UpsetTier {
  if (uf >= 9) return "legendary";
  if (uf >= 6) return "major";
  if (uf >= 3) return "notable";
  return "minor";
}

// Placement-tier lookup, lifted from upsets.gg. Mirrors `SEED_TIERS` in
// src/utils/results/upsetFactor.ts. Used for the tier-based seed delta in
// the player summary band (how many bracket tiers up/down did they go vs
// their seed projection).
export const SEED_TIERS_SERVER: ReadonlyArray<
  readonly [number, number, number]
> = [
  [1, 1, 0],
  [2, 2, 1],
  [3, 3, 2],
  [4, 4, 3],
  [5, 6, 4],
  [7, 8, 5],
  [9, 12, 6],
  [13, 16, 7],
  [17, 24, 8],
  [25, 32, 9],
  [33, 48, 10],
  [49, 64, 11],
  [65, 96, 12],
  [97, 128, 13],
  [129, 192, 14],
  [193, 256, 15],
  [257, 384, 16],
  [385, 512, 17],
  [513, 768, 18],
  [769, 1024, 19],
  [1025, 1536, 20],
  [1537, 2048, 21],
  [2049, 3072, 22],
  [3073, 4096, 23],
];

export function seedTierServer(seed: number): number | null {
  if (!Number.isFinite(seed) || seed <= 0) return null;
  const s = Math.floor(seed);
  for (const [lo, hi, t] of SEED_TIERS_SERVER) {
    if (s >= lo && s <= hi) return t;
  }
  return SEED_TIERS_SERVER[SEED_TIERS_SERVER.length - 1][2];
}

// Signed delta in tier space: positive when the player placed higher than
// their seed projected, negative when they underperformed.
export function computeSeedDeltaServer(
  seed: number,
  placement: number,
): number | null {
  const s = seedTierServer(seed);
  const p = seedTierServer(placement);
  if (s == null || p == null) return null;
  return s - p;
}

export type PhaseGroup = { id: string; name: string; sets: ResultSet[] };

// Linear pass — sets are already sorted by (phaseOrder, startAt) upstream.
export function groupSetsByPhase(sets: ResultSet[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.id === s.phaseId) {
      last.sets.push(s);
    } else {
      groups.push({ id: s.phaseId, name: s.phaseName, sets: [s] });
    }
  }
  return groups;
}

// Shortens start.gg round names the way the community does ("Winners
// Semi-Final" → "WSF"). Mirrors src/utils/results/abbreviateRound.ts.
export const ROUND_STAGES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^grand\s*finals?\s*reset$/, "GFR"],
  [/^grand\s*finals?$/, "GF"],
  [/^quarter-?\s*finals?$/, "QF"],
  [/^semi-?\s*finals?$/, "SF"],
  [/^finals?$/, "F"],
  [/^round\s*(\d+)$/, "R$1"],
];
export function abbreviateRound(fullRoundText: string): string {
  const m = fullRoundText.trim().match(/^(winners?|losers?)?\s*(.*)$/i);
  if (!m) return fullRoundText;
  const side = m[1] ? m[1][0].toUpperCase() : "";
  const rest = m[2].toLowerCase();
  for (const [re, out] of ROUND_STAGES) {
    if (re.test(rest)) return side + rest.replace(re, out);
  }
  return fullRoundText;
}

// Satori has no color-mix(); build translucent accents from the hex.
export function withAlpha(hex: string, alpha: number): string {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return hex;
  let c = m[1];
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Satori calls `.trim()` on string-valued style props, so a key whose value
// is `undefined` crashes it. Strip those before handing a style to `h()`.
export function definedStyle(style: React.CSSProperties): React.CSSProperties {
  return Object.fromEntries(
    Object.entries(style).filter(([, v]) => v !== undefined),
  ) as React.CSSProperties;
}

// Rough advance widths for M PLUS Rounded 1c, per script. No font-metrics
// library is bundled, so this is an estimate; it only decides how wide the
// canvas gets. Anything still too long is ellipsized by the row itself.
export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    if (
      (c >= 0x3000 && c <= 0x9fff) || // CJK punctuation, kana, kanji
      (c >= 0xac00 && c <= 0xd7af) || // Hangul
      (c >= 0xff00 && c <= 0xffef) // fullwidth forms
    ) {
      em += 1;
    } else if (ch === " ") em += 0.3;
    else if (/[0-9]/.test(ch)) em += 0.6;
    else if (/[A-Z]/.test(ch)) em += 0.68;
    else if (/[|.,:;'"!`-]/.test(ch)) em += 0.35;
    else em += 0.56;
  }
  return em * fontSize;
}
