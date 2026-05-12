export type CharacterRef = {
  id: string;
  name: string;
};

// A player's currently-active ranking, sourced primarily from
// `Player.rankings(videogameId)` on start.gg. Manual overrides in
// `playerRankings.config.ts` can inject additional rankings (e.g. PGstats
// or Liquipedia-tracked PRs that aren't synced to start.gg).
export type PlayerRanking = {
  title: string;
  rank: number;
  // Optional short label for display (e.g. "EU" instead of
  // "Europe 2025 Full Year"). When unset, callers show `title` verbatim.
  displayTitle?: string;
};

export type PlayerSetOpponent = {
  id: string;
  // start.gg numeric player id (stable across tournaments). Optional — some
  // entrants don't have a linked user / player record.
  playerId?: string;
  name: string;
  prefix?: string;
  country?: string;
  // Top filtered ranking for this opponent (after the same global/country/
  // state + recency sort applied to the main player). Optional.
  topRanking?: PlayerRanking;
  seed: number;
  placement: number;
  characters: CharacterRef[];
};

export type PlayerSet = {
  id: string;
  fullRoundText: string;
  round: number;
  scoreSelf: number;
  scoreOpponent: number;
  didWin: boolean;
  isDQ: boolean;
  startAtMs?: number;
  upsetFactor?: number;
  // Phase context for grouping the set list. "unknown" when the set has no
  // phaseGroup/phase (rare — DQs before bracket assignment).
  phaseId: string;
  phaseName: string;
  phaseOrder: number;
  selfCharacters: CharacterRef[];
  opponent: PlayerSetOpponent;
};

export type PlayerTournamentResults = {
  entrantId: string;
  // start.gg numeric player id. Used to key the better-gg fallback-character
  // lookup. Optional because entrants without a linked user fall back to
  // start.gg-only behavior.
  playerId?: string;
  name: string;
  prefix?: string;
  country?: string;
  // Player avatar (start.gg profile image, upgraded to https). Optional —
  // not every player has one uploaded.
  iconUrl?: string;
  // Active rankings for this player + videogame, sorted by best rank first.
  rankings: PlayerRanking[];
  seed: number;
  placement: number;
  wins: number;
  losses: number;
  sets: PlayerSet[];
};
