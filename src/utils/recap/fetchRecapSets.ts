import { graphql } from "@/gql";
import type { RecapSetsQuery } from "@/gql/graphql";
import type { RecapEvent, RecapSet } from "@/types/recap/Recap";
import { startggClient } from "@/utils/startgg/client";

const RecapSetsQueryDoc = graphql(`
  query RecapSets(
    $playerId: ID!
    $page: Int!
    $perPage: Int!
    $eventIds: [ID]
  ) {
    player(id: $playerId) {
      id
      sets(page: $page, perPage: $perPage, filters: { eventIds: $eventIds }) {
        pageInfo {
          totalPages
        }
        nodes {
          id
          winnerId
          displayScore
          completedAt
          fullRoundText
          event {
            id
          }
          slots {
            entrant {
              id
              name
              initialSeedNum
              participants {
                player {
                  id
                  gamerTag
                }
                user {
                  images(type: "profile") {
                    url
                  }
                }
              }
            }
          }
          games {
            selections {
              selectionType
              selectionValue
              entrant {
                id
              }
            }
          }
        }
      }
    }
  }
`);

type SetNode = NonNullable<
  NonNullable<
    NonNullable<NonNullable<RecapSetsQuery["player"]>["sets"]>["nodes"]
  >[number]
>;

const SCORE_RE = /^(.*) (\d+) - (.*) (\d+)$/;

const toRecapSet = (
  node: SetNode,
  playerId: string,
  eventStart: Map<string, number>,
): RecapSet | null => {
  if (!node.id || !node.winnerId || node.displayScore === "DQ") return null;
  const eventId = node.event?.id ? String(node.event.id) : null;
  if (!eventId) return null;

  const entrants = (node.slots ?? []).map((slot) => slot?.entrant);
  const mine = entrants.find((entrant) =>
    entrant?.participants?.some((p) => String(p?.player?.id) === playerId),
  );
  const theirs = entrants.find((entrant) => entrant && entrant !== mine);
  // Team sets have no single opponent to attribute them to.
  if (
    !mine?.id ||
    !theirs?.id ||
    mine.participants?.length !== 1 ||
    theirs.participants?.length !== 1
  ) {
    return null;
  }

  const match = node.displayScore?.match(SCORE_RE);
  const first = match ? Number(match[2]) : 0;
  const second = match ? Number(match[4]) : 0;
  const opponent = theirs.participants[0];
  const myEntrantId = String(mine.id);

  return {
    id: String(node.id),
    eventId,
    won: String(node.winnerId) === myEntrantId,
    completedAt: node.completedAt
      ? node.completedAt * 1000
      : (eventStart.get(eventId) ?? 0),
    score: match
      ? match[1] === mine.name
        ? { mine: first, theirs: second }
        : { mine: second, theirs: first }
      : null,
    round: node.fullRoundText || "",
    seed: mine.initialSeedNum ?? null,
    opponent: {
      playerId: opponent?.player?.id ? String(opponent.player.id) : null,
      tag: opponent?.player?.gamerTag || theirs.name || "",
      avatarUrl:
        opponent?.user?.images?.[0]?.url?.replace("http://", "https://") ||
        null,
      seed: theirs.initialSeedNum ?? null,
    },
    characterIds: (node.games ?? []).flatMap((game) =>
      (game?.selections ?? [])
        .filter(
          (selection) =>
            selection?.selectionType === "CHARACTER" &&
            String(selection.entrant?.id) === myEntrantId &&
            selection.selectionValue != null,
        )
        .map((selection) => String(selection!.selectionValue)),
    ),
  };
};

// A set with avatars and per-game picks is about 50 of start.gg's objects,
// and the limit of 1000 counts what comes back.
const PER_PAGE = 18;
// start.gg allows 80 requests a minute; a busy year is 40 pages.
const CONCURRENCY = 4;
const MAX_PAGES = 80;

// start.gg allows 80 requests a minute and answers 429 past that; a page
// that fails is asked for again after a pause.
const RETRY_DELAYS_MS = [1500, 4000];

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const fetchPage = async (
  playerId: string,
  eventIds: string[],
  page: number,
) => {
  for (let attempt = 0; ; attempt++) {
    const result = await startggClient
      .query(
        RecapSetsQueryDoc,
        { playerId, page, perPage: PER_PAGE, eventIds },
        // A retry must not be answered from the failed attempt.
        { requestPolicy: attempt ? "network-only" : "cache-first" },
      )
      .toPromise();
    const connection = result.data?.player?.sets;
    if (!result.error && connection) return connection;
    if (attempt >= RETRY_DELAYS_MS.length) {
      throw new Error(result.error?.message || "Could not load sets");
    }
    await wait(RETRY_DELAYS_MS[attempt]);
  }
};

// Every set the player finished in the given events, oldest first.
// `onProgress` is called with the share of pages that are in (0–1).
export const fetchRecapSets = async (
  playerId: string,
  events: RecapEvent[],
  onProgress?: (done: number) => void,
): Promise<RecapSet[]> => {
  // start.gg reads an empty `eventIds` as no filter at all.
  if (events.length === 0) return [];
  const eventIds = events.map((event) => event.id);
  const eventStart = new Map(events.map((event) => [event.id, event.startAt]));

  const first = await fetchPage(playerId, eventIds, 1);
  const totalPages = Math.min(first.pageInfo?.totalPages ?? 1, MAX_PAGES);
  const nodes = [...(first.nodes ?? [])];
  let done = 1;
  onProgress?.(done / totalPages);

  let next = 2;
  const worker = async () => {
    while (next <= totalPages) {
      const page = next++;
      const connection = await fetchPage(playerId, eventIds, page);
      nodes.push(...(connection.nodes ?? []));
      onProgress?.(++done / totalPages);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return nodes
    .map((node) => (node ? toRecapSet(node, playerId, eventStart) : null))
    .filter((set): set is RecapSet => set !== null)
    .sort((a, b) => a.completedAt - b.completedAt);
};
