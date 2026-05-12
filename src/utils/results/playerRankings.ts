// Classifies start.gg PlayerRank titles into global / country / state buckets
// and sorts by (recency, level, rank value). All data + overrides live in
// `playerRankings.config.ts` — edit that file to tune which rankings count,
// and to pin recency / level / exclusion on specific titles.
//
// PlayerRank.title is shaped like "<League>: <Season>". The league name
// (everything before the first `:`) is what tells us the scope.
import type { PlayerRanking } from "@/types/results/PlayerTournamentResults";
import {
  RANKINGS_CONFIG,
  type RankingLevel,
  type RankingOverride,
} from "./playerRankings.config";

export type { RankingLevel };

const longestFirst = (a: string, b: string) => b.length - a.length;

// Lowercased, longest-prefix-first views of the config lists. Built once at
// module load so the per-classify cost is just linear scans.
const GLOBAL_LEAGUES_LOWER = RANKINGS_CONFIG.globalLeagues.map((s) =>
  s.toLowerCase(),
);
const CONTINENTS_LOWER_SORTED = [...RANKINGS_CONFIG.continents]
  .sort(longestFirst)
  .map((s) => s.toLowerCase());
const STATES_LOWER_SORTED = [...RANKINGS_CONFIG.statesAndProvinces]
  .sort(longestFirst)
  .map((s) => s.toLowerCase());
const COUNTRIES_LOWER_SORTED = [...RANKINGS_CONFIG.countries]
  .sort(longestFirst)
  .map((s) => s.toLowerCase());
const SUB_STATE_MODIFIERS_LOWER = RANKINGS_CONFIG.subStateModifiers.map((s) =>
  s.toLowerCase(),
);
const OVERRIDES_BY_LEAGUE = new Map<string, RankingOverride>(
  RANKINGS_CONFIG.overrides.map((o) => [o.league.toLowerCase(), o]),
);

// Pre-compile shortener substitutions as whole-word regexes, longest key
// first. Word boundaries are slightly extended around hyphens/periods so a
// key like "Smash Bros." still matches "Smash Bros." followed by a space.
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SHORTENER_SUBS: Array<{ rx: RegExp; replacement: string }> =
  Object.entries(RANKINGS_CONFIG.shortener.substitutions)
    .sort(([a], [b]) => b.length - a.length)
    .map(([key, replacement]) => ({
      // (?:^|\b) handles keys that start with non-word chars; lookbehind
      // would be cleaner but breaks older Safari.
      rx: new RegExp(`(?<![\\w-])${escapeRegex(key)}(?![\\w-])`, "gi"),
      replacement,
    }));

const leagueOf = (title: string): string => {
  const i = title.indexOf(":");
  return (i === -1 ? title : title.slice(0, i)).trim();
};

const startsWithWord = (leagueLower: string, name: string): boolean => {
  if (leagueLower === name) return true;
  if (!leagueLower.startsWith(name)) return false;
  const nextChar = leagueLower[name.length];
  if (nextChar !== undefined && nextChar !== " ") return false;
  const rest = leagueLower.slice(name.length + 1);
  const nextWord = rest.split(/[\s/]/)[0] ?? "";
  if (SUB_STATE_MODIFIERS_LOWER.includes(nextWord)) return false;
  return true;
};

export const classifyRanking = (title: string): RankingLevel => {
  if (!title) return "other";
  const league = leagueOf(title);
  if (!league) return "other";
  const leagueLower = league.toLowerCase();

  const override = OVERRIDES_BY_LEAGUE.get(leagueLower);
  if (override?.forceLevel) return override.forceLevel;

  if (GLOBAL_LEAGUES_LOWER.includes(leagueLower)) return "global";

  // Continent check before state so "European Smash Rankings" classifies
  // continental rather than falling through to country/state.
  for (const name of CONTINENTS_LOWER_SORTED) {
    if (startsWithWord(leagueLower, name)) return "continent";
  }
  // State / province check before country so "Georgia" resolves to the US
  // state (more common in smash) rather than the country.
  for (const name of STATES_LOWER_SORTED) {
    if (startsWithWord(leagueLower, name)) return "state";
  }
  for (const name of COUNTRIES_LOWER_SORTED) {
    if (startsWithWord(leagueLower, name)) return "country";
  }
  return "other";
};

// Pulls the latest 4-digit year out of the title. Version-only titles
// ("WWRv6", "PGRv5") return 0 — use a `recencyHint` override to surface
// them above unknown-year entries.
const YEAR_RX = /\b(20\d{2})\b/g;
const extractYearFromTitle = (title: string): number => {
  const matches = title.match(YEAR_RX);
  if (!matches) return 0;
  let max = 0;
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (n > max) max = n;
  }
  return max;
};

/**
 * Effective recency year used for sorting.
 *   year = max(parsed-from-title, override.recencyHint, 0)
 * Override never makes the year smaller than what the title actually
 * says — it can only push it forward.
 */
export const recencyOf = (title: string): number => {
  const fromTitle = extractYearFromTitle(title);
  const override = OVERRIDES_BY_LEAGUE.get(leagueOf(title).toLowerCase());
  const hint = override?.recencyHint ?? 0;
  return Math.max(fromTitle, hint);
};

const LEVEL_PRIORITY: Record<RankingLevel, number> = {
  global: 0,
  continent: 1,
  country: 2,
  state: 3,
  other: 4,
};

/**
 * Returns the per-player overrides registered in
 * `RANKINGS_CONFIG.playerOverrides` for a given start.gg player id. Empty
 * array when no overrides are registered. Callers should pass this through
 * `mergePlayerRankings()` along with the rankings fetched from start.gg.
 */
export const getPlayerRankingOverrides = (
  playerId: string | null | undefined,
): PlayerRanking[] => {
  if (!playerId) return [];
  return RANKINGS_CONFIG.playerOverrides[String(playerId)] ?? [];
};

/**
 * Merges the start.gg-fetched rankings with any per-player config overrides.
 * Duplicates (same league name, case-insensitive) are de-duped — the OVERRIDE
 * wins, so a config entry can replace a stale start.gg row by sharing its
 * league prefix.
 */
export const mergePlayerRankings = (
  fromStartGg: PlayerRanking[],
  overrides: PlayerRanking[],
): PlayerRanking[] => {
  if (overrides.length === 0) return fromStartGg;
  const overrideLeagues = new Set(
    overrides.map((r) => leagueOf(r.title).toLowerCase()),
  );
  const merged: PlayerRanking[] = [];
  for (const r of fromStartGg) {
    if (overrideLeagues.has(leagueOf(r.title).toLowerCase())) continue;
    merged.push(r);
  }
  for (const r of overrides) merged.push(r);
  return merged;
};

// Only surface rankings whose effective year is within this many years of
// the current calendar year. A ranking released "for 2025" is still
// relevant in early 2026, so 1 covers a ~12-month rolling window.
const MAX_RANKING_AGE_YEARS = 1;

const collapseWs = (s: string) => s.replace(/\s+/g, " ").trim();

const applyShortenerSubs = (s: string): string => {
  let out = s;
  for (const { rx, replacement } of SHORTENER_SUBS) {
    out = out.replace(rx, replacement);
  }
  return collapseWs(out);
};

const applySeasonPatterns = (s: string): string => {
  let out = s;
  for (const { pattern, replacement } of RANKINGS_CONFIG.shortener
    .seasonPatterns) {
    out = out.replace(pattern, replacement);
  }
  return collapseWs(out);
};

// If the season half repeats the league's opening words, drop them. E.g.
// after stripping "Power Ranking" / "Smash Bros. Ultimate Powerranking",
// "German Power Ranking 2024/2" becomes "German 2024/2" — and the league
// is also just "German" — so we strip the duplicate prefix to land on a
// clean "German 2024/2".
const dedupAgainstLeague = (season: string, league: string): string => {
  if (!season || !league) return season;
  const leagueWords = league.toLowerCase().split(/\s+/);
  const seasonWords = season.split(/\s+/);
  let i = 0;
  while (
    i < seasonWords.length &&
    i < leagueWords.length &&
    seasonWords[i].toLowerCase() === leagueWords[i]
  ) {
    i++;
  }
  return seasonWords.slice(i).join(" ");
};

/**
 * Collapses a long start.gg ranking title down to a pill-sized label.
 *
 * Splits on the first colon, strips boilerplate from both halves, swaps in
 * regional acronyms, normalizes season phrasing, and dedupes any tokens
 * the title echoed on both sides. If every meaningful word is stripped
 * (rare — happens only for non-standard titles), falls back to the
 * collapsed original.
 *
 * Examples:
 *   "German Smash Bros. Ultimate Powerranking: German Power Ranking 2024/2"
 *     → "German 2024/2"
 *   "Ultimate North-Rhine Westphalia: Winter 2023"
 *     → "NRW Winter 2023"
 *   "NRW Power Ranking: 2nd Half of 2022"
 *     → "NRW 2022/2"
 */
export const shortenRankingTitle = (title: string): string => {
  if (!title) return "";
  const colonIdx = title.indexOf(":");
  const rawLeague = colonIdx === -1 ? title : title.slice(0, colonIdx);
  const rawSeason = colonIdx === -1 ? "" : title.slice(colonIdx + 1);

  const league = applyShortenerSubs(rawLeague);
  let season = applyShortenerSubs(rawSeason);
  season = applySeasonPatterns(season);
  season = dedupAgainstLeague(season, league);

  // If the league fully evaporated (e.g. title was just "Power Ranking:
  // 2024"), don't lose the league text entirely — keep the original.
  const finalLeague = league || collapseWs(rawLeague);
  const parts = [finalLeague, season].filter(Boolean);
  const shortened = parts.join(" ").trim();
  return shortened || collapseWs(title);
};

/**
 * Keeps only global/continent/country/state rankings whose effective year
 * is within `MAX_RANKING_AGE_YEARS` of the current year (after honoring
 * `exclude` overrides), sorted by:
 *   1. recency (latest effective year, desc)
 *   2. level priority (global → continent → country → state)
 *   3. rank value (lower is better)
 *
 * Each surviving entry has its `displayTitle` populated when not already
 * set, so downstream consumers can render `displayTitle ?? title`
 * unconditionally and get the shortened pill text by default.
 */
export const filterAndSortRankings = (
  rankings: PlayerRanking[],
): PlayerRanking[] => {
  const minYear = new Date().getFullYear() - MAX_RANKING_AGE_YEARS;
  return rankings
    .map((r) => {
      const override = OVERRIDES_BY_LEAGUE.get(leagueOf(r.title).toLowerCase());
      return {
        r,
        excluded: override?.exclude === true,
        level: classifyRanking(r.title),
        year: recencyOf(r.title),
      };
    })
    .filter(
      ({ excluded, level, year }) =>
        !excluded && level !== "other" && year >= minYear,
    )
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const lvl = LEVEL_PRIORITY[a.level] - LEVEL_PRIORITY[b.level];
      if (lvl !== 0) return lvl;
      return a.r.rank - b.r.rank;
    })
    .map(({ r }) => ({
      ...r,
      displayTitle: r.displayTitle ?? shortenRankingTitle(r.title),
    }));
};
