import { hiveeTimezone } from "@/utils/hivee/date";
import type {
  HiveeEntrant,
  HiveeEvent,
  HiveeMatch,
  HiveeProgram,
  HiveeStandings,
} from "@/types/hivee/Hivee";
import type {
  EventOverview,
  EventPhase,
  EventSet,
  Pool,
  PoolStanding,
  SetSide,
  StandingEntry,
  StandingsPage,
  TournamentDetails,
  TournamentEvent,
  TournamentStatus,
  Upset,
} from "@/types/tournament/Tournament";
import { getGameForHiveeContent } from "@/utils/games";
import {
  fetchHiveeCompletedMatches,
  fetchHiveeEntrants,
  fetchHiveeEvent,
  fetchHiveeStandings,
  HIVEE_UUID,
} from "@/utils/hivee/api";
import {
  countHiveeCharacters,
  hasBracket,
  hiveeMatchTime,
  hiveeRoundText,
  makeTop8Test,
  orderStandings,
  programChain,
} from "@/utils/hivee/programs";
import { findUpsets } from "@/utils/tournament/sets";

// The tournament page for a Hivee event. Hivee's ids are UUIDs and
// start.gg's are numbers, so the page's fetchers tell the two apart by the
// id alone and hand Hivee's here. The page's ids map like this:
//
//   tournament  the Hivee event
//   event       a program that decides placements: a final bracket (with
//               the qualifiers that fed it as its earlier phases) or a side
//               bracket
//   phase       a program
//   pool        "<program id>_<pool number>"

// Whether an id of the tournament page (tournament, event, phase or pool)
// is a Hivee one.
export const isHiveeId = (id: string): boolean =>
  HIVEE_UUID.test(id.slice(0, 36));

type Loaded = {
  event: HiveeEvent;
  entrants: HiveeEntrant[];
  matches: HiveeMatch[];
};

// Hivee answers per event, not per program, so an event is read once (three
// requests) and every tab is cut out of it. Kept for the page's lifetime,
// like the page's other loads.
const events = new Map<string, Promise<Loaded>>();
// Which event each program belongs to, filled in as events load.
const eventOfProgram = new Map<string, string>();
const standings = new Map<string, Promise<HiveeStandings>>();

const loadEvent = (eventId: string): Promise<Loaded> => {
  const cached = events.get(eventId);
  if (cached) return cached;
  const load = Promise.all([
    fetchHiveeEvent(eventId),
    fetchHiveeEntrants(eventId),
    fetchHiveeCompletedMatches(eventId),
  ]).then(([event, entrants, matches]) => {
    for (const program of event.programs) {
      eventOfProgram.set(program.id, eventId);
    }
    return { event, entrants, matches };
  });
  events.set(eventId, load);
  load.catch(() => events.delete(eventId));
  return load;
};

const loadStandings = (programId: string): Promise<HiveeStandings> => {
  const cached = standings.get(programId);
  if (cached) return cached;
  const load = fetchHiveeStandings(programId);
  standings.set(programId, load);
  load.catch(() => standings.delete(programId));
  return load;
};

// A program and the event it is part of. The page always loads the
// tournament before anything of its events, which is what fills the lookup.
const loadProgram = async (programId: string) => {
  const eventId = eventOfProgram.get(programId);
  if (!eventId) throw new Error("Unknown Hivee program");
  const loaded = await loadEvent(eventId);
  const program = loaded.event.programs.find((p) => p.id === programId);
  if (!program) throw new Error("Unknown Hivee program");
  return { ...loaded, program };
};

const time = (iso: string | null): number | null => {
  const ms = Date.parse(iso ?? "");
  return Number.isNaN(ms) ? null : ms;
};

const PROGRAM_STATUS: Record<HiveeProgram["state"], TournamentStatus> = {
  before: "upcoming",
  running: "live",
  ended: "finished",
  canceled: "finished",
};

const EVENT_STATUS: Record<HiveeEvent["progress"], TournamentStatus> = {
  before: "upcoming",
  live: "live",
  ended: "finished",
};

// Hivee names a program's game by a code; the page shows the game's name.
const CONTENT_NAMES: Record<string, string> = {
  smash_sp: "Super Smash Bros. Ultimate",
};

// The programs that are events of the page: every bracket whose top
// finishers do not move on to another one. Final brackets first, side
// brackets after them.
const eventPrograms = (programs: HiveeProgram[]): HiveeProgram[] => {
  const playable = programs.filter(hasBracket);
  const isSide = (program: HiveeProgram) =>
    program.feeder !== null && program.feeder.rank_from > 1;
  return playable
    .filter(
      (program) =>
        !playable.some(
          (next) =>
            next.feeder?.program_id === program.id &&
            next.feeder.rank_from === 1,
        ),
    )
    .sort((a, b) => Number(isSide(a)) - Number(isSide(b)));
};

export const fetchHiveeTournament = async (
  eventId: string,
): Promise<TournamentDetails | null> => {
  let loaded: Loaded;
  try {
    loaded = await loadEvent(eventId);
  } catch {
    // A missing or private event: the page says there is no such tournament.
    return null;
  }
  const { event, entrants } = loaded;

  const pageEvents = eventPrograms(event.programs).map(
    (program): TournamentEvent => {
      const first = programChain(event.programs, program)[0];
      const game = getGameForHiveeContent(program.content)?.id ?? null;
      return {
        id: program.id,
        name: program.title,
        // The slug the tools load a Hivee program by.
        slug: `${event.id}/${program.id}`,
        startAt: time(event.starts_at),
        status: PROGRAM_STATUS[program.state],
        numEntrants: entrants.filter((entrant) =>
          entrant.programs.some((entry) => entry.program_id === first.id),
        ).length,
        isTeams: false,
        videogameName: CONTENT_NAMES[program.content ?? ""] ?? null,
        game,
      };
    },
  );

  return {
    id: event.id,
    name: event.title,
    slug: event.id,
    platform: "hivee",
    url: event.url,
    startAt: time(event.starts_at),
    endAt: time(event.ends_at),
    timezone: hiveeTimezone(event),
    status: EVENT_STATUS[event.progress] ?? "finished",
    isOnline: event.venue_type === "online",
    city: null,
    state: event.prefecture_name,
    countryCode: event.country?.toUpperCase() ?? null,
    venueName: event.venue,
    venueAddress: event.venue_address,
    mapsPlaceId: null,
    numAttendees: entrants.length,
    hashtag: null,
    organizer: event.community.name,
    discordUrl: null,
    iconUrl: event.community.icon_url,
    bannerUrl: event.cover_image_url,
    streams: [],
    events: pageEvents,
  };
};

// participant → program → seed
const seedTable = (entrants: HiveeEntrant[]) => {
  const table = new Map<string, Map<string, number>>();
  for (const entrant of entrants) {
    const seeds = new Map<string, number>();
    for (const entry of entrant.programs) {
      if (entry.seed !== null) seeds.set(entry.program_id, entry.seed);
    }
    table.set(entrant.id, seeds);
  }
  return table;
};

const poolId = (programId: string, pool: number) => `${programId}_${pool}`;

// A finished match between two known players as the page's set, or null
// for anything else (a bye, a draw, a hidden name). `winnersRounds` is how
// many rounds the program's winners side has: Hivee numbers a grand final
// from 1 again, and the bracket needs it after the winners final.
const toSet = (
  match: HiveeMatch,
  program: HiveeProgram,
  seeds: Map<string, Map<string, number>>,
  winnersRounds: number,
  loserPlacement: number | null,
): EventSet | null => {
  const [a, b] = match.slots;
  if (!match.winner_id || !a?.participant_id || !b?.participant_id) return null;

  const isDQ = match.dq.both || match.dq.participant_id !== null;
  const sides = [a, b].map((slot): SetSide => ({
    entrantId: slot.participant_id ?? "",
    name: slot.display_name ?? "",
    seed: seeds.get(slot.participant_id ?? "")?.get(program.id) ?? null,
    score: isDQ || slot.score === null ? null : String(slot.score),
  }));
  const winnerIndex = sides.findIndex(
    (side) => side.entrantId === match.winner_id,
  );
  if (winnerIndex === -1) return null;

  const round =
    match.bracket === "losers"
      ? -match.round
      : match.bracket === "grand_final"
        ? winnersRounds + match.round
        : match.round;
  return {
    id: match.id,
    roundName: hiveeRoundText(match, program),
    round,
    loserPlacement,
    completedAt: hiveeMatchTime(match) || null,
    isDQ,
    winner: sides[winnerIndex],
    loser: sides[1 - winnerIndex],
    winnerSlot: winnerIndex === 0 ? 0 : 1,
    vodUrl: null,
    streamName: null,
    phaseId: program.id,
    groupId: poolId(program.id, match.pool),
    phaseName: program.title,
  };
};

const winnersRoundsOf = (matches: HiveeMatch[], programId: string): number =>
  Math.max(
    0,
    ...matches
      .filter(
        (match) =>
          match.program_id === programId && match.bracket === "winners",
      )
      .map((match) => match.round),
  );

// Every finished set of the given programs.
const setsOf = (
  loaded: Loaded,
  programs: HiveeProgram[],
  loserPlacement: (match: HiveeMatch) => number | null = () => null,
): EventSet[] => {
  const seeds = seedTable(loaded.entrants);
  return programs.flatMap((program) => {
    const winnersRounds = winnersRoundsOf(loaded.matches, program.id);
    return loaded.matches
      .filter((match) => match.program_id === program.id)
      .map((match) =>
        toSet(match, program, seeds, winnersRounds, loserPlacement(match)),
      )
      .filter((set): set is EventSet => set !== null);
  });
};

const toStandings = (
  loaded: Loaded,
  chain: HiveeProgram[],
  rows: HiveeStandings["rows"],
): StandingEntry[] => {
  const seeds = seedTable(loaded.entrants);
  const first = chain[0];
  const last = chain[chain.length - 1];
  return orderStandings(rows).flatMap((row): StandingEntry[] => {
    if (row.placement === null || !row.display_name) return [];
    const own = seeds.get(row.participant_id);
    return [
      {
        placement: row.placement,
        entrantId: row.participant_id,
        name: row.display_name,
        prefix: null,
        tag: row.display_name,
        // The seed they entered with, or the one they took into the
        // bracket when the qualifier was not seeded.
        seed: own?.get(first.id) ?? own?.get(last.id) ?? null,
        members: [{ tag: row.display_name, avatarUrl: null }],
      },
    ];
  });
};

export const fetchHiveeEventOverview = async (
  programId: string,
): Promise<EventOverview> => {
  const loaded = await loadProgram(programId);
  const { program, event, matches } = loaded;
  const chain = programChain(event.programs, program);
  const { rows } = await loadStandings(programId);

  const isTop8 = makeTop8Test(program, matches, rows);
  const placements = new Map(
    rows.map((row) => [row.participant_id, row.placement]),
  );
  const topSets = setsOf(loaded, [program], (match) => {
    if (!isTop8(match)) return null;
    // Whoever loses a grand final is the runner-up at that point, even if
    // they go on to win the reset.
    if (match.bracket === "grand_final") return 2;
    const loser = match.slots.find(
      (slot) => slot.participant_id !== match.winner_id,
    );
    return placements.get(loser?.participant_id ?? "") ?? null;
  })
    .filter((set) => set.loserPlacement !== null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const chainIds = new Set(chain.map((entry) => entry.id));
  const characters: Record<string, string[]> = {};
  for (const [participantId, played] of countHiveeCharacters(
    matches.filter((match) => chainIds.has(match.program_id ?? "")),
  )) {
    characters[participantId] = played.map((character) => character.id);
  }

  return {
    standings: toStandings(loaded, chain, rows).slice(0, 8),
    topSets,
    characters,
    // Hivee has no login here to find the viewer's own run with.
    userRun: null,
    seedPhaseId: program.id,
    finalPhaseId: program.id,
    finalGroupId: topSets[0]?.groupId ?? poolId(program.id, 1),
  };
};

// Hivee returns a program's standings whole: there is one page.
export const fetchHiveeEventStandings = async (
  programId: string,
): Promise<StandingsPage> => {
  const loaded = await loadProgram(programId);
  const chain = programChain(loaded.event.programs, loaded.program);
  const { rows } = await loadStandings(programId);
  const entries = toStandings(loaded, chain, rows);
  return { standings: entries, total: entries.length, totalPages: 1 };
};

// Every set of the event's programs is already loaded, so all of them are
// looked through, not only the top seeds'. A set is judged by the seeds of
// the program it was played in.
export const fetchHiveeEventUpsets = async (
  programId: string,
): Promise<Upset[]> => {
  const loaded = await loadProgram(programId);
  const chain = programChain(loaded.event.programs, loaded.program);
  return findUpsets(setsOf(loaded, chain));
};

const BRACKET_TYPES: Record<string, string> = {
  single_elim: "SINGLE_ELIMINATION",
  double_elim: "DOUBLE_ELIMINATION",
  round_robin: "ROUND_ROBIN",
  swiss: "SWISS",
};

export const fetchHiveeEventPhases = async (
  programId: string,
): Promise<EventPhase[]> => {
  const { program, event, entrants } = await loadProgram(programId);
  return programChain(event.programs, program).map((phase) => ({
    id: phase.id,
    name: phase.title,
    numSeeds: entrants.filter((entrant) =>
      entrant.programs.some((entry) => entry.program_id === phase.id),
    ).length,
    bracketType: BRACKET_TYPES[phase.format ?? ""] ?? null,
    groups: Array.from({ length: Math.max(phase.pool_count, 1) }, (_, i) => ({
      id: poolId(phase.id, i + 1),
      label: String(i + 1),
    })),
  }));
};

export const fetchHiveePool = async (groupId: string): Promise<Pool> => {
  const programId = groupId.slice(0, 36);
  const pool = Number(groupId.slice(37)) || 1;
  const loaded = await loadProgram(programId);
  const { rows } = await loadStandings(programId);

  // The rows earned in this program and pool, ranked among themselves: a
  // league's standings rank everyone together (four pool winners share
  // 1st, then the placement jumps to 5th).
  const own = orderStandings(rows).filter(
    (row) =>
      row.placement !== null &&
      row.display_name &&
      row.source_program_id === programId &&
      (row.pool === null || row.pool === pool),
  );
  const poolStandings: PoolStanding[] = [];
  own.forEach((row, index) => {
    const previous = own[index - 1];
    poolStandings.push({
      entrantId: row.participant_id,
      name: row.display_name ?? "",
      placement:
        previous && previous.placement === row.placement
          ? poolStandings[index - 1].placement
          : index + 1,
    });
  });

  return {
    sets: setsOf(loaded, [loaded.program]).filter(
      (set) => set.groupId === groupId,
    ),
    standings: poolStandings,
  };
};
