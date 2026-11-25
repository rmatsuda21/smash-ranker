import type { GameId } from "@/types/Game";

export type TournamentStatus = "upcoming" | "live" | "finished";

export type TournamentStream = {
  name: string;
  // Where the channel can be watched, when the platform is one we can link.
  url: string | null;
  logoUrl: string | null;
};

export type TournamentEvent = {
  id: string;
  name: string;
  // `tournament/<name>/event/<event>`: what the graphic tools load.
  slug: string;
  // Milliseconds since epoch.
  startAt: number | null;
  status: TournamentStatus;
  numEntrants: number;
  isTeams: boolean;
  videogameName: string | null;
  // The game, when it is one the site has art and tools for.
  game: GameId | null;
};

export type TournamentDetails = {
  id: string;
  name: string;
  // `tournament/<name>`.
  slug: string;
  // Where the tournament's data comes from, and its page there.
  platform: "startgg" | "hivee";
  url: string;
  startAt: number | null;
  endAt: number | null;
  timezone: string | null;
  status: TournamentStatus;
  isOnline: boolean;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  venueName: string | null;
  venueAddress: string | null;
  mapsPlaceId: string | null;
  numAttendees: number;
  hashtag: string | null;
  organizer: string | null;
  discordUrl: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  streams: TournamentStream[];
  events: TournamentEvent[];
};

export type StandingEntry = {
  placement: number;
  // False for someone still playing: the placement is the worst they can
  // finish.
  isFinal: boolean;
  entrantId: string;
  // The entrant's name as start.gg shows it ("Team | Tag", "A / B").
  name: string;
  // Sponsor and tag of a single player; teams have only `name`.
  prefix: string | null;
  tag: string;
  seed: number | null;
  // The entrant's players (two for a team), each with their start.gg
  // profile picture when the standings were asked for with pictures.
  members: { tag: string; avatarUrl: string | null }[];
};

export type SetSide = {
  entrantId: string;
  name: string;
  seed: number | null;
  // "3", "W", or null when start.gg has no score for the set.
  score: string | null;
};

export type EventSet = {
  id: string;
  roundName: string;
  // start.gg's round number: positive in winners, negative in losers.
  round: number | null;
  // Placement the loser leaves with: 8 or better for a set of the top 8.
  loserPlacement: number | null;
  completedAt: number | null;
  isDQ: boolean;
  winner: SetSide;
  loser: SetSide;
  // Which of the set's two slots the winner was in: the order a bracket
  // draws the players in.
  winnerSlot: 0 | 1;
  vodUrl: string | null;
  streamName: string | null;
  phaseId: string | null;
  groupId: string | null;
  // The phase's name ("Top 24"), when the set was asked for with it.
  phaseName: string | null;
};

export type Upset = EventSet & { upsetFactor: number };

export type UserRun = {
  entrantId: string;
  placement: number | null;
  seed: number | null;
  wins: number;
  losses: number;
};

// Everything the Overview tab shows for one event, from one request.
export type EventOverview = {
  standings: StandingEntry[];
  // Sets of the top 8, newest first.
  topSets: EventSet[];
  // Most-picked characters of each entrant seen in `topSets`, most first.
  characters: Record<string, string[]>;
  userRun: UserRun | null;
  // The phase that holds the most seeds: where the seeding is read from.
  seedPhaseId: string | null;
  // Where the newest set of the top 8 (the grand final) was played: the
  // bracket the Bracket tab opens on.
  finalPhaseId: string | null;
  finalGroupId: string | null;
};

// One stage of an event ("Pools", "Top 8"), split into one bracket or more.
export type EventPhase = {
  id: string;
  name: string;
  numSeeds: number;
  // start.gg's bracket type ("DOUBLE_ELIMINATION", "ROUND_ROBIN", ...).
  bracketType: string | null;
  // Its brackets (pools), in the order of their names.
  groups: { id: string; label: string }[];
  // Set on a Swiss stage that start.gg holds as one phase per round: the
  // rounds in order, each with the phase it came from and that phase's pool.
  // `id` and `groups` are then the first round's.
  rounds?: { name: string; phaseId: string; groupId: string }[];
  // With `rounds`: the pool of the standings-only phase that follows them,
  // which holds the stage's final ranking. A round's own pool ranks that
  // round alone.
  standingsGroupId?: string;
};

export type PoolStanding = {
  entrantId: string;
  name: string;
  placement: number;
};

// A seed a player is sent on to: a pool of a later phase of the event, and
// the seed number they take in it.
export type ProgressionSeed = { groupId: string; seedNum: number | null };

// How players move between phases around one pool: where they came in from
// and where its sets send them.
export type PoolProgression = {
  // The pool of an earlier phase each player came from, by entrant id. Empty
  // for a pool of the event's first phase.
  arrivals: Record<string, string>;
  // Where the winner and the loser of a set go on to, by set id, for the
  // sets that send someone out of the pool.
  departures: Record<
    string,
    { winner: ProgressionSeed | null; loser: ProgressionSeed | null }
  >;
  // Of the pools players are sent to that seed some players straight into
  // their losers bracket: how many of the pool's seeds start in winners.
  winnersSeeds: Record<string, number>;
};

// One bracket (pool) of a phase: its finished sets and, when start.gg has
// them, the pool's own placements.
export type Pool = {
  sets: EventSet[];
  standings: PoolStanding[];
  // start.gg only.
  progression?: PoolProgression;
};

export type StandingsPage = {
  standings: StandingEntry[];
  total: number;
  totalPages: number;
};
