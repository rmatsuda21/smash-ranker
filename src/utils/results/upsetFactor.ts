// "Upset Factor" formula, taken directly from upsets.gg's upset-factor
// calculator (page-002305f7c6ce7caa.js, found via:
//   curl https://upsets.gg/tools/upset-factor → JS bundle → tier lookup).
//
//   UF = max(tier(winner_seed) - tier(loser_seed), 0)
//
// The tier mapping matches the double-elimination bracket placement groupings
// (top 1, top 2, top 4, top 8, top 16, top 32, top 64, ...). Each seed bucket
// is one integer tier; UF measures how many tiers the underdog crossed when
// they won. Returns 0 when the favorite (lower-tier) wins, when seeds are
// equal/missing, or when seeds exceed the highest known tier — in which case
// the last tier is used as a cap.
const SEED_TIERS: ReadonlyArray<readonly [number, number, number]> = [
  // [rangeStart, rangeEnd, tier]
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

export const seedTier = (seed: number): number | null => {
  if (!Number.isFinite(seed) || seed <= 0) return null;
  const s = Math.floor(seed);
  for (const [lo, hi, t] of SEED_TIERS) {
    if (s >= lo && s <= hi) return t;
  }
  return SEED_TIERS[SEED_TIERS.length - 1][2];
};

// Signed seed-vs-placement delta in placement-tier space. Positive means the
// player placed higher than their seed (tier(seed) > tier(placement)),
// negative means they underperformed, 0 means same tier. Returns null when
// either input is missing/invalid so the caller can hide the badge.
export const computeSeedDelta = (
  seed: number,
  placement: number,
): number | null => {
  const s = seedTier(seed);
  const p = seedTier(placement);
  if (s == null || p == null) return null;
  return s - p;
};

export const computeUpsetFactor = (
  winnerSeed: number,
  loserSeed: number,
): number => {
  const w = seedTier(winnerSeed);
  const l = seedTier(loserSeed);
  if (w == null || l == null) return 0;
  return Math.max(w - l, 0);
};

// Visual tier for the UF badge. Higher tiers get more dramatic styling on
// both the client (CSS modules) and server (satori inline styles). Keep the
// names in lock-step with `upsetTierStyle` in api/results-image.ts.
export type UpsetTier = "minor" | "notable" | "major" | "legendary";

export const upsetTier = (uf: number): UpsetTier => {
  if (uf >= 9) return "legendary";
  if (uf >= 6) return "major";
  if (uf >= 3) return "notable";
  return "minor";
};
