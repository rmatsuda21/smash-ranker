// One event the player entered in the recap's year.
export type RecapEvent = {
  id: string;
  name: string;
  // Milliseconds since epoch.
  startAt: number;
  numEntrants: number;
  isOnline: boolean;
  // Redemption, amateur and team brackets: they count as showing up, not
  // towards placements or upsets.
  isSide: boolean;
  placement: number | null;
  seed: number | null;
  tournament: {
    id: string;
    name: string;
    city: string | null;
    countryCode: string | null;
    lat: number | null;
    lng: number | null;
    iconUrl: string | null;
  };
};

// One completed set in the recap's year, from the player's side.
export type RecapSet = {
  id: string;
  eventId: string;
  won: boolean;
  // Milliseconds since epoch; the event's start when start.gg has no time.
  completedAt: number;
  score: { mine: number; theirs: number } | null;
  // start.gg's `fullRoundText`, e.g. "Winners Semi-Final".
  round: string;
  seed: number | null;
  opponent: {
    playerId: string | null;
    tag: string;
    avatarUrl: string | null;
    seed: number | null;
  };
  // Character ids the player picked, one per game with a recorded pick.
  characterIds: string[];
};

export type RecapPlayer = {
  userId: string;
  playerId: string;
  slug: string;
  tag: string;
  avatarUrl: string | null;
};

export type RecapOpponent = {
  tag: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
};

export type RecapRunSet = {
  round: string;
  opponent: string;
  avatarUrl: string | null;
  score: { mine: number; theirs: number } | null;
  won: boolean;
};

export type RecapUpset = {
  factor: number;
  seed: number;
  opponentSeed: number;
  opponent: string;
  avatarUrl: string | null;
  score: { mine: number; theirs: number } | null;
  tournament: string;
};

export type RecapCity = {
  name: string;
  countryCode: string;
  lon: number;
  lat: number;
  count: number;
  best: number | null;
  isHome: boolean;
  // Far enough from home to be a trip.
  isFar: boolean;
  // One labelled city per region while the whole globe is in view.
  showLabel: boolean;
};

export type RecapCharacter = {
  id: string;
  games: number;
  wins: number;
  losses: number;
};

export type RecapTypeId =
  | "closer"
  | "slayer"
  | "road"
  | "local"
  | "iron"
  | "loyal"
  | "lab"
  | "gate"
  | "rookie";

export type Recap = {
  year: number;
  player: RecapPlayer;

  tournaments: number;
  // One entry per week of the year: whether the player entered anything.
  weeks: boolean[];
  streak: { start: number; length: number };
  // `month` is 0–11.
  busiestMonth: { month: number; count: number } | null;
  series: { name: string; count: number; iconUrl: string | null } | null;
  icons: { label: string; url: string | null }[];

  setCount: number;
  wins: number;
  losses: number;
  winPercent: number;
  games: number;
  entrantsFaced: number;
  deciders: { wins: number; losses: number };
  winStreak: number;
  // Set win rate per month, null for a month with no sets.
  monthRates: (number | null)[];
  bestMonth: { month: number; wins: number; losses: number } | null;

  characters: RecapCharacter[];
  // Games with a recorded pick: fewer than `games`.
  recordedGames: number;
  // Characters with at least 5% of the recorded games.
  characterCount: number;
  // Per month: each top character's share of picks (0–100) and the total.
  mix: { shares: number[]; total: number }[];

  bestRun: {
    placement: number;
    entrants: number;
    seed: number | null;
    name: string;
    sets: RecapRunSet[];
  } | null;
  bracketWins: number;
  top3: number;
  top8: number;

  upsets: RecapUpset[];
  upsetCount: number;
  aboveSeed: { beaten: number; seeded: number };

  rival: RecapOpponent | null;
  rivalSets: { won: boolean; score: RecapRunSet["score"] }[];
  nemesis: RecapOpponent | null;
  favorite: RecapOpponent | null;

  cities: RecapCity[];
  countryCount: number;
  distanceKm: number;
  // Globe rotation that shows as many cities as possible at once.
  restView: [number, number];
  // 0 = Sunday.
  weekday: { day: number; count: number } | null;
  offlinePercent: number;

  type: RecapTypeId;
};
