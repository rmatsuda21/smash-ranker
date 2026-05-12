// Configuration knobs for the PlayerRank classifier + sort. Edit anything
// in here — the runtime in `playerRankings.ts` reads everything from this
// object and re-runs on next session. No code changes required to:
//
//   • add a new global ranking series  → append to `globalLeagues`
//   • add a country / adjective form   → append to `countries`
//   • add a state or province          → append to `statesAndProvinces`
//   • disqualify a sub-region word     → append to `subStateModifiers`
//   • pin a specific ranking's level   → add `{ league, forceLevel }` to overrides
//   • inject an implicit recency year  → add `{ league, recencyHint }` to overrides
//   • hide a specific ranking          → add `{ league, exclude: true }` to overrides
//
// Sort order at runtime is:
//   1. Recency  (= MAX(year-parsed-from-title, override.recencyHint), desc)
//   2. Level    (global > country > state)
//   3. Rank     (lower numeric value first)
//
// Use `recencyHint` when the title can't be parsed for a year — e.g.
// "UltRank: 2025.2" should beat "LumiRank: 2025.1" because UltRank is the
// post-Nov-2025 rebrand of LumiRank, but title text alone can't tell you
// that. Pin `recencyHint: 2026` on UltRank and it sorts first.
import type { PlayerRanking } from "@/types/results/PlayerTournamentResults";

export type RankingLevel =
  | "global"
  | "continent"
  | "country"
  | "state"
  | "other";

export type RankingOverride = {
  /**
   * Match the league portion of a PlayerRank title (everything before the
   * first ":"), case-insensitive, exact. Pick the *league* not the season
   * — e.g. "UltRank", not "UltRank: 2025.2".
   */
  league: string;
  /** Force the level — skips auto-classification. */
  forceLevel?: RankingLevel;
  /**
   * Effective recency year used for the sort. Overrides anything parsed
   * from the title when greater than it (so adding a hint never makes a
   * ranking *less* recent than its title says).
   */
  recencyHint?: number;
  /** Drop the ranking entirely, even if classification would keep it. */
  exclude?: boolean;
};

export type RankingsConfig = {
  globalLeagues: string[];
  continents: string[];
  statesAndProvinces: string[];
  countries: string[];
  subStateModifiers: string[];
  overrides: RankingOverride[];
  // Per-player ranking overrides keyed by start.gg numeric player id
  // (`Player.id`). Each entry gets MERGED into that player's rankings list
  // BEFORE filter+sort, so it competes with their on-start.gg rankings on
  // recency / level / rank. Use this when a ranking exists on PGstats or
  // Liquipedia but isn't synced to start.gg.
  playerOverrides: Record<string, PlayerRanking[]>;
  // Title shortener — drives `shortenRankingTitle()`. The function is run on
  // every ranking after filter+sort (to populate `displayTitle` when one
  // isn't already set), so editing these tables instantly reshapes the
  // pills both on-screen and in the rendered graphic.
  //
  //   substitutions  — whole-word find/replace applied to the LEAGUE and
  //                    SEASON halves independently. Longest-first match so
  //                    a longer phrase ("Smash Bros. Ultimate Powerranking")
  //                    consumes its tokens before shorter ones ("Ultimate")
  //                    can fire. Replacements may be "" (strip) or a short
  //                    acronym ("NRW", "BC").
  //   seasonPatterns — regex passes applied to the SEASON half after
  //                    substitutions. Used to normalize half-year and
  //                    quarter phrasing into compact suffixes.
  shortener: {
    substitutions: Record<string, string>;
    seasonPatterns: Array<{ pattern: RegExp; replacement: string }>;
  };
};

export const RANKINGS_CONFIG: RankingsConfig = {
  // ──────────────────────────────────────────────────────────────────────
  //  Global Ultimate ranking series. Exact (case-insensitive) match on the
  //  league portion of the title. Sibling series with region suffixes
  //  ("Panda Global Rankings Ultimate North America") have an extra word
  //  and won't match — those classify as `other` (continental, excluded).
  // ──────────────────────────────────────────────────────────────────────
  globalLeagues: [
    "LumiRank",
    "UltRank", // LumiRank rebrand, Nov 2025+
    "OrionRank",
    "Wi-fi Warrior Rank",
    "Wi-Fi Warrior Ranking",
    "Panda Global Rankings", // legacy PGRv*
  ],

  // ──────────────────────────────────────────────────────────────────────
  //  Continent / supra-national region prefixes. Sit BETWEEN global and
  //  country in the sort priority (so a Europe PR beats a Germany PR but
  //  loses to LumiRank). Include noun + adjective forms.
  // ──────────────────────────────────────────────────────────────────────
  continents: [
    "North America",
    "South America",
    "Latin America",
    "Central America",
    "Europe",
    "European",
    "Asia",
    "Asian",
    "Africa",
    "African",
    "Oceania",
    "Australasia",
    // 2-letter shorthand sometimes used directly as a league name.
    "EU",
    "NA",
    "SA",
  ],

  // ──────────────────────────────────────────────────────────────────────
  //  State / province prefixes. League must START with one of these as a
  //  whole word, AND the next word must not be in `subStateModifiers`
  //  (catches "New York City", "Washington Metro", "Bay Area" etc.).
  //  Multi-word entries are matched longest-first automatically.
  // ──────────────────────────────────────────────────────────────────────
  statesAndProvinces: [
    // US states
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
    // Canadian provinces + territories
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],

  // ──────────────────────────────────────────────────────────────────────
  //  Country names + adjective forms. League must START with one of these
  //  as a whole word ("Mexican Ranking" matches via "Mexican"). Multi-word
  //  entries are matched longest-first automatically. The classifier
  //  checks `statesAndProvinces` before `countries`, so "Georgia"
  //  resolves to the US state, not the country.
  // ──────────────────────────────────────────────────────────────────────
  countries: [
    // Compound names (must be listed before single-word forms)
    "Dominican Republic",
    "United States",
    "United Kingdom",
    "South Korea",
    "Czech Republic",
    "New Zealand",
    "Costa Rica",
    "El Salvador",
    "Saudi Arabia",
    "Hong Kong",
    // Single-word noun forms
    "Argentina",
    "Australia",
    "Austria",
    "Belgium",
    "Brazil",
    "Bulgaria",
    "Canada",
    "Chile",
    "China",
    "Colombia",
    "Croatia",
    "Denmark",
    "Ecuador",
    "Egypt",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Ireland",
    "Israel",
    "Italy",
    "Japan",
    "Korea",
    "Latvia",
    "Lithuania",
    "Malaysia",
    "Mexico",
    "Morocco",
    "Netherlands",
    "Norway",
    "Pakistan",
    "Panama",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Romania",
    "Russia",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
    "Taiwan",
    "Thailand",
    "Turkey",
    "Ukraine",
    "Uruguay",
    "Venezuela",
    "Vietnam",
    // Adjective forms (so "Mexican Ranking", "Japanese Player Rankings"
    // match cleanly). Add new ones here as new country rankings appear.
    "Mexican",
    "Japanese",
    "Canadian",
    "French",
    "German",
    "Italian",
    "Spanish",
    "British",
    "Australian",
    "Brazilian",
    "Argentinian",
    "Dutch",
    "Belgian",
    "Swedish",
    "Norwegian",
    "Polish",
    "Russian",
    "Korean",
    "Chinese",
    "Indian",
    "American",
    "Portuguese",
    "Greek",
    "Turkish",
    "Vietnamese",
    "Thai",
    "Indonesian",
    "Filipino",
  ],

  // Words that disqualify a state/country prefix when they appear as the
  // next token after the geographic name. Keeps "New York City" / "Bay
  // Area" / "Washington Metro" out of the state bucket.
  subStateModifiers: ["city", "metro", "metropolitan", "area", "county"],

  // ──────────────────────────────────────────────────────────────────────
  //  Manual per-league overrides. Apply after auto-classification.
  // ──────────────────────────────────────────────────────────────────────
  //  Examples:
  //    • Pin UltRank's recency to 2026 so the (rebranded post-Nov 2025)
  //      ranking surfaces above LumiRank: 2025.1 even when both seasons
  //      look the same year-wise.
  //    • Bump Wi-fi Warrior Rank to 2024 so it doesn't get sorted last
  //      among year-less global rankings.
  //    • Force-classify a one-off ranking that the auto-classifier mishandles.
  //    • Hide a specific ranking series entirely.
  overrides: [
    { league: "UltRank", recencyHint: 2026 },
    { league: "LumiRank", recencyHint: 2025 },
    // Year-less version-based global rankings — pin them to roughly the
    // year they were last active so they sort behind explicitly-recent
    // entries instead of falling to 0.
    { league: "Wi-fi Warrior Rank", recencyHint: 2022 },
    { league: "Wi-Fi Warrior Ranking", recencyHint: 2019 },
    { league: "Panda Global Rankings", recencyHint: 2019 },
    { league: "OrionRank", recencyHint: 2022 },
    // Example of a force-exclude (commented out):
    // { league: "Some Sketchy PR", exclude: true },
  ],

  // ──────────────────────────────────────────────────────────────────────
  //  Per-player overrides — start.gg numeric player id (string) → list of
  //  rankings to MERGE into that player's data. Use this for rankings
  //  tracked off-platform (PGstats / Liquipedia) that don't show up via
  //  the start.gg `Player.rankings` query.
  //
  //  Use `displayTitle` for a shorthand label when the full title is
  //  unwieldy in the pill (e.g. "EU" instead of "Europe 2025 Full Year").
  // ──────────────────────────────────────────────────────────────────────
  playerOverrides: {
    // drybie — Europe Power Ranking is on Liquipedia/PGstats but not on
    // start.gg, so pre-populate it here.
    "988249": [
      { title: "Europe 2025 Full Year", displayTitle: "EU", rank: 30 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  //  Title shortener.
  //
  //  Real start.gg titles can run to 70+ characters because each region
  //  appends its own boilerplate ("German Smash Bros. Ultimate
  //  Powerranking: German Power Ranking 2024/2"). The shortener strips
  //  boilerplate, swaps long region names for acronyms, normalizes
  //  half-year phrasing, and de-duplicates tokens that the title repeats
  //  on both sides of the colon.
  //
  //  Two-pass — first `substitutions` (longest key first, applied as
  //  whole-word regex on both halves), then `seasonPatterns` (compact
  //  rewriting of half/quarter phrasing on the season half only).
  //
  //  Add a new entry whenever a long title slips through — the runtime
  //  picks up the change with no code edits. Test with the sanity script
  //  in `_check_shortener.ts` (or just paste a title into the
  //  `shortenRankingTitle` REPL).
  // ──────────────────────────────────────────────────────────────────────
  shortener: {
    substitutions: {
      // ── Boilerplate phrases. Longest matches first so a full phrase
      //    consumes its tokens before standalone words can fire.
      "Smash Bros. Ultimate Powerranking": "",
      "Smash Bros Ultimate Powerranking": "",
      "Smash Bros. Ultimate Power Ranking": "",
      "Smash Bros Ultimate Power Ranking": "",
      "Smash Bros. Ultimate": "",
      "Smash Bros Ultimate": "",
      "Smash Ultimate": "",
      "Player Rankings": "",
      "Player Ranking": "",
      "Power Ranking": "",
      Powerrankings: "",
      Powerranking: "",
      "Smash Bros.": "",
      "Smash Bros": "",
      "Full Year": "",
      Ultimate: "",
      // ── Regional acronyms. Apply on both halves so they fold the league
      //    name (and any echoed mention in the season) the same way.
      "North-Rhine Westphalia": "NRW",
      "Nordrhein-Westfalen": "NRW",
      "British Columbia": "BC",
      "New South Wales": "NSW",
      "New York City": "NYC",
      "Long Island": "LI",
      "Bay Area": "Bay",
    },
    seasonPatterns: [
      // Half-year phrasing → "YYYY/N" suffix (matches the "/1", "/2" format
      // already used by the German PR series).
      { pattern: /\b1st Half of (\d{4})\b/gi, replacement: "$1/1" },
      { pattern: /\b2nd Half of (\d{4})\b/gi, replacement: "$1/2" },
      { pattern: /\bFirst Half of (\d{4})\b/gi, replacement: "$1/1" },
      { pattern: /\bSecond Half of (\d{4})\b/gi, replacement: "$1/2" },
      // Quarter phrasing → "YYYY Q#".
      { pattern: /\bQuarter (\d) (\d{4})\b/gi, replacement: "$2 Q$1" },
      { pattern: /\bQuarter (\d), (\d{4})\b/gi, replacement: "$2 Q$1" },
    ],
  },
};

// Re-export for callers that only need the runtime type.
export type { PlayerRanking };
