// The seed of an entrant the platform has not seeded: after every real one.
export const MISSING_SEED_FALLBACK = 9999;

export const hasSeed = (seed: number): boolean =>
  seed > 0 && seed < MISSING_SEED_FALLBACK;
