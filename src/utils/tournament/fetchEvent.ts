import { graphql } from "@/gql";
import type {
  EventOverview,
  EventPhase,
  Pool,
  PoolStanding,
  EventSet,
  StandingEntry,
  StandingsPage,
  Upset,
} from "@/types/tournament/Tournament";
import { parseDisplayScore } from "@/utils/results/parseStartggResults";
import { startggClient } from "@/utils/startgg/client";
import {
  countCharacters,
  findUpsets,
  toEventSet,
} from "@/utils/tournament/sets";

// The newest sets of an event are its top 8 (ten or eleven sets). A set with
// per-game picks is about 30 objects in singles and about 50 in doubles, and
// a request may return 1000, so fewer are asked for in a team event.
const TOP_SETS_SINGLES = 20;
const TOP_SETS_TEAMS = 12;

const EventOverviewQueryDoc = graphql(`
  query TournamentEventOverview(
    $id: ID!
    $setCount: Int!
    $userId: ID
    $withUser: Boolean!
  ) {
    event(id: $id) {
      id
      phases {
        id
        phaseOrder
        numSeeds
      }
      standings(query: { page: 1, perPage: 8 }) {
        nodes {
          placement
          entrant {
            id
            name
            initialSeedNum
            participants {
              gamerTag
              prefix
              user {
                images(type: "profile") {
                  url
                }
              }
            }
          }
        }
      }
      sets(page: 1, perPage: $setCount, sortType: RECENT) {
        nodes {
          id
          fullRoundText
          round
          lPlacement
          winnerId
          displayScore
          completedAt
          vodUrl
          stream {
            streamName
          }
          phaseGroup {
            id
            phase {
              id
            }
          }
          slots {
            entrant {
              id
              name
              initialSeedNum
            }
          }
          games {
            selections {
              entrant {
                id
              }
              selectionValue
            }
          }
        }
      }
      userEntrant(userId: $userId) @include(if: $withUser) {
        id
        initialSeedNum
        standing {
          placement
        }
        paginatedSets(page: 1, perPage: 40) {
          nodes {
            winnerId
            displayScore
          }
        }
      }
    }
  }
`);

type RawStanding = {
  placement?: number | null;
  entrant?: {
    id?: string | number | null;
    name?: string | null;
    initialSeedNum?: number | null;
    participants?:
      | ({
          gamerTag?: string | null;
          prefix?: string | null;
          // Asked for by the overview only: a picture is two more objects
          // a player, which the full standings cannot afford.
          user?: {
            images?: ({ url?: string | null } | null)[] | null;
          } | null;
        } | null)[]
      | null;
  } | null;
} | null;

const toStanding = (raw: RawStanding): StandingEntry | null => {
  if (!raw?.placement || !raw.entrant?.id) return null;
  const members = raw.entrant.participants ?? [];
  // Only a single player has a sponsor to set apart from the tag.
  const solo = members.length === 1 ? members[0] : null;
  return {
    placement: raw.placement,
    entrantId: String(raw.entrant.id),
    name: raw.entrant.name || "",
    prefix: solo?.prefix || null,
    tag: solo?.gamerTag || raw.entrant.name || "",
    seed: raw.entrant.initialSeedNum ?? null,
    members: members.flatMap((member) =>
      member
        ? [
            {
              tag: member.gamerTag || "",
              avatarUrl:
                member.user?.images?.[0]?.url?.replace("http://", "https://") ||
                null,
            },
          ]
        : [],
    ),
  };
};

const present = <T>(value: T | null): value is T => value !== null;

export const fetchEventOverview = async (
  eventId: string,
  { isTeams, userId }: { isTeams: boolean; userId: string | null },
): Promise<EventOverview> => {
  const result = await startggClient
    .query(EventOverviewQueryDoc, {
      id: eventId,
      setCount: isTeams ? TOP_SETS_TEAMS : TOP_SETS_SINGLES,
      userId,
      withUser: userId !== null,
    })
    .toPromise();

  const event = result.data?.event;
  if (result.error || !event) {
    throw new Error(result.error?.message || "Could not load the event");
  }

  const rawSets = (event.sets?.nodes ?? []).filter(present);
  const topSets = rawSets
    .map(toEventSet)
    .filter(present)
    .filter((set) => set.loserPlacement !== null && set.loserPlacement <= 8)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const entrant = "userEntrant" in event ? event.userEntrant : null;
  let userRun: EventOverview["userRun"] = null;
  if (entrant?.id) {
    let wins = 0;
    let losses = 0;
    for (const set of entrant.paginatedSets?.nodes ?? []) {
      if (!set?.winnerId || parseDisplayScore(set.displayScore).isDQ) continue;
      if (String(set.winnerId) === String(entrant.id)) wins++;
      else losses++;
    }
    userRun = {
      entrantId: String(entrant.id),
      placement: entrant.standing?.placement ?? null,
      seed: entrant.initialSeedNum ?? null,
      wins,
      losses,
    };
  }

  // start.gg numbers phases in no useful order (a major's first phase had
  // `phaseOrder` 2 and its second 7): the one holding everyone has the most
  // seeds.
  const seedPhase = [...(event.phases ?? [])]
    .filter(present)
    .sort((a, b) => (b.numSeeds ?? 0) - (a.numSeeds ?? 0))[0];

  return {
    standings: (event.standings?.nodes ?? []).map(toStanding).filter(present),
    topSets,
    characters: countCharacters(rawSets.flatMap((set) => set.games ?? [])),
    userRun,
    seedPhaseId: seedPhase?.id ? String(seedPhase.id) : null,
    finalPhaseId: topSets[0]?.phaseId ?? null,
    finalGroupId: topSets[0]?.groupId ?? null,
  };
};

// A standing with its entrant and one participant is 4 objects.
export const STANDINGS_PER_PAGE = 96;

const EventStandingsQueryDoc = graphql(`
  query TournamentEventStandings($id: ID!, $page: Int!, $perPage: Int!) {
    event(id: $id) {
      id
      standings(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          placement
          entrant {
            id
            name
            initialSeedNum
            participants {
              gamerTag
              prefix
            }
          }
        }
      }
    }
  }
`);

export const fetchEventStandings = async (
  eventId: string,
  page: number,
): Promise<StandingsPage> => {
  const result = await startggClient
    .query(EventStandingsQueryDoc, {
      id: eventId,
      page,
      perPage: STANDINGS_PER_PAGE,
    })
    .toPromise();

  const connection = result.data?.event?.standings;
  if (result.error || !connection) {
    throw new Error(result.error?.message || "Could not load the standings");
  }
  return {
    standings: (connection.nodes ?? []).map(toStanding).filter(present),
    total: connection.pageInfo?.total ?? 0,
    totalPages: connection.pageInfo?.totalPages ?? 1,
  };
};

// Upsets are looked for among the sets of the top seeds only. Reading every
// set of a major is 25 requests (3,161 sets at 130 a request); the sets of
// its top 64 seeds are 5, and an upset needs a well seeded loser anyway.
export const UPSET_SEED_COUNT = 64;
// A set with two slots, their entrants, its pool and its phase is 10
// objects.
const UPSET_SETS_PER_PAGE = 80;
const UPSET_MAX_PAGES = 10;

const TopSeedsQueryDoc = graphql(`
  query TournamentTopSeeds($phaseId: ID!, $perPage: Int!) {
    phase(id: $phaseId) {
      id
      seeds(query: { page: 1, perPage: $perPage }) {
        nodes {
          seedNum
          entrant {
            id
          }
        }
      }
    }
  }
`);

const SeedSetsQueryDoc = graphql(`
  query TournamentSeedSets(
    $id: ID!
    $entrantIds: [ID]
    $page: Int!
    $perPage: Int!
  ) {
    event(id: $id) {
      id
      sets(
        page: $page
        perPage: $perPage
        filters: { entrantIds: $entrantIds, hideEmpty: true }
      ) {
        pageInfo {
          totalPages
        }
        nodes {
          id
          fullRoundText
          round
          lPlacement
          winnerId
          displayScore
          completedAt
          phaseGroup {
            id
            phase {
              id
              name
            }
          }
          slots {
            entrant {
              id
              name
              initialSeedNum
            }
          }
        }
      }
    }
  }
`);

export const fetchEventUpsets = async (
  eventId: string,
  seedPhaseId: string,
): Promise<Upset[]> => {
  const seeds = await startggClient
    .query(TopSeedsQueryDoc, {
      phaseId: seedPhaseId,
      perPage: UPSET_SEED_COUNT,
    })
    .toPromise();
  if (seeds.error) throw new Error(seeds.error.message);

  const entrantIds = (seeds.data?.phase?.seeds?.nodes ?? [])
    .map((seed) => seed?.entrant?.id)
    .filter((id): id is string => Boolean(id))
    .map(String);
  // An empty filter is no filter: start.gg would return every set.
  if (entrantIds.length === 0) return [];

  const loadPage = async (page: number) => {
    const result = await startggClient
      .query(SeedSetsQueryDoc, {
        id: eventId,
        entrantIds,
        page,
        perPage: UPSET_SETS_PER_PAGE,
      })
      .toPromise();
    const connection = result.data?.event?.sets;
    if (result.error || !connection) {
      throw new Error(result.error?.message || "Could not load the sets");
    }
    return connection;
  };

  const first = await loadPage(1);
  const lastPage = Math.min(first.pageInfo?.totalPages ?? 1, UPSET_MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) =>
      loadPage(index + 2),
    ),
  );

  const sets = [first, ...rest]
    .flatMap((connection) => connection.nodes ?? [])
    .filter(present)
    .map(toEventSet)
    .filter((set): set is EventSet => set !== null);
  return findUpsets(sets);
};

// Organizers often run Swiss on start.gg as one phase per round ("Swiss
// Round 1" to "Swiss Round 5", each a single pool of that round's sets),
// followed by a phase with no sets that only holds the final standings.
// Shown as they are, that is five brackets of one round each and an empty
// one. Consecutive single-pool Swiss phases become one stage with a round
// per phase, and a schedule-only phase is left out when there is anything
// else to show.
export const mergeSwissRounds = (phases: EventPhase[]): EventPhase[] => {
  const merged: EventPhase[] = [];
  for (const phase of phases) {
    const previous = merged[merged.length - 1];
    const isRound = phase.bracketType === "SWISS" && phase.groups.length === 1;
    const round = {
      name: phase.name,
      phaseId: phase.id,
      groupId: phase.groups[0]?.id ?? "",
    };
    if (isRound && previous?.rounds) {
      previous.rounds.push(round);
    } else if (isRound) {
      merged.push({ ...phase, name: "", rounds: [round] });
    } else {
      if (
        phase.bracketType === "CUSTOM_SCHEDULE" &&
        phase.groups.length === 1 &&
        previous?.rounds
      ) {
        previous.standingsGroupId = phase.groups[0].id;
      }
      merged.push(phase);
    }
  }
  const stages = merged.map((phase) =>
    // A lone Swiss phase is an ordinary phase with its own name.
    phase.rounds?.length === 1
      ? { ...phase, name: phase.rounds[0].name, rounds: undefined }
      : phase,
  );
  const withSets = stages.filter(
    (phase) => phase.bracketType !== "CUSTOM_SCHEDULE",
  );
  return withSets.length > 0 ? withSets : stages;
};

// A phase with its pools costs one object per pool: 64 for the first phase
// of a 1,581-entrant event.
const MAX_POOLS = 256;

const EventPhasesQueryDoc = graphql(`
  query TournamentEventPhases($id: ID!, $maxPools: Int!) {
    event(id: $id) {
      id
      phases {
        id
        name
        numSeeds
        bracketType
        phaseGroups(query: { page: 1, perPage: $maxPools }) {
          nodes {
            id
            displayIdentifier
          }
        }
      }
    }
  }
`);

// An event's phases in the order start.gg lists them. That is the order
// they are played in for a simple event; a big one branches (Kagaribi's
// B to E classes sit between its main phases), and neither `phaseOrder` nor
// the number of seeds puts those in a better order.
export const fetchEventPhases = async (
  eventId: string,
): Promise<EventPhase[]> => {
  const result = await startggClient
    .query(EventPhasesQueryDoc, { id: eventId, maxPools: MAX_POOLS })
    .toPromise();
  const event = result.data?.event;
  if (result.error || !event) {
    throw new Error(result.error?.message || "Could not load the phases");
  }

  const phases = (event.phases ?? [])
    .filter(present)
    .flatMap((phase): EventPhase[] => {
      const groups = (phase.phaseGroups?.nodes ?? [])
        .flatMap((group) =>
          group?.id
            ? [{ id: String(group.id), label: group.displayIdentifier || "" }]
            : [],
        )
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true }),
        );
      if (!phase.id || groups.length === 0) return [];
      return [
        {
          id: String(phase.id),
          name: phase.name || "",
          numSeeds: phase.numSeeds ?? 0,
          bracketType: phase.bracketType ?? null,
          groups,
        },
      ];
    });
  return mergeSwissRounds(phases);
};

// A set with two slots and their entrants is 8 objects. A 64-player double
// elimination pool is about 126 sets: two pages.
const POOL_SETS_PER_PAGE = 100;
const POOL_MAX_PAGES = 8;

const PoolSetsQueryDoc = graphql(`
  query TournamentPoolSets(
    $id: ID!
    $page: Int!
    $perPage: Int!
    $withStandings: Boolean!
  ) {
    phaseGroup(id: $id) {
      id
      standings(query: { page: 1, perPage: 64 }) @include(if: $withStandings) {
        nodes {
          placement
          entrant {
            id
            name
          }
        }
      }
      sets(page: $page, perPage: $perPage, sortType: ROUND) {
        pageInfo {
          totalPages
        }
        nodes {
          id
          fullRoundText
          round
          lPlacement
          winnerId
          displayScore
          completedAt
          vodUrl
          slots {
            entrant {
              id
              name
              initialSeedNum
            }
          }
        }
      }
    }
  }
`);

// One bracket (pool): every finished set of it, and its placements. Sets
// still to be played and byes are left out.
export const fetchPool = async (groupId: string): Promise<Pool> => {
  const loadPage = async (page: number) => {
    const result = await startggClient
      .query(PoolSetsQueryDoc, {
        id: groupId,
        page,
        perPage: POOL_SETS_PER_PAGE,
        withStandings: page === 1,
      })
      .toPromise();
    const group = result.data?.phaseGroup;
    if (result.error || !group?.sets) {
      throw new Error(result.error?.message || "Could not load the bracket");
    }
    return group;
  };

  const first = await loadPage(1);
  const lastPage = Math.min(
    first.sets?.pageInfo?.totalPages ?? 1,
    POOL_MAX_PAGES,
  );
  const rest = await Promise.all(
    Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) =>
      loadPage(index + 2),
    ),
  );

  const standings = "standings" in first ? (first.standings?.nodes ?? []) : [];
  return {
    sets: [first, ...rest]
      .flatMap((group) => group.sets?.nodes ?? [])
      .filter(present)
      .map(toEventSet)
      .filter((set): set is EventSet => set !== null),
    standings: standings.flatMap((standing): PoolStanding[] =>
      standing?.placement && standing.entrant?.id
        ? [
            {
              entrantId: String(standing.entrant.id),
              name: standing.entrant.name || "",
              placement: standing.placement,
            },
          ]
        : [],
    ),
  };
};
