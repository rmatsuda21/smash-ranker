import { graphql } from "@/gql";
import type { UserSetsQuery } from "@/gql/graphql";
import type { UserSet } from "@/types/user/UserSet";
import { startggClient } from "@/utils/startgg/client";
import { startggLoadError } from "@/utils/startgg/describeError";

const UserSetsQueryDoc = graphql(`
  query UserSets($playerId: ID!, $page: Int!, $perPage: Int!, $eventIds: [ID]) {
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
          slots {
            entrant {
              id
              name
              participants {
                player {
                  id
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
    NonNullable<NonNullable<UserSetsQuery["player"]>["sets"]>["nodes"]
  >[number]
>;

const SCORE_RE = /^(.*) (\d+) - (.*) (\d+)$/;

// `displayScore` reads "<name> <games> - <name> <games>"; DQs and sets
// reported as plain W/L have no game counts.
const parseScore = (
  displayScore: string | null | undefined,
  myName: string,
): UserSet["score"] => {
  const match = displayScore?.match(SCORE_RE);
  if (!match) return null;
  const first = Number(match[2]);
  const second = Number(match[4]);
  return match[1] === myName
    ? { mine: first, theirs: second }
    : { mine: second, theirs: first };
};

const toUserSet = (node: SetNode, playerId: string): UserSet | null => {
  if (!node.id || !node.winnerId || node.displayScore === "DQ") return null;

  const entrants = (node.slots ?? []).map((slot) => slot?.entrant);
  const mine = entrants.find((entrant) =>
    entrant?.participants?.some((p) => String(p?.player?.id) === playerId),
  );
  const theirs = entrants.find((entrant) => entrant && entrant !== mine);
  if (!mine?.id || !theirs?.id) return null;

  const opponentPlayers = theirs.participants ?? [];
  const myEntrantId = String(mine.id);

  return {
    id: String(node.id),
    won: String(node.winnerId) === myEntrantId,
    completedAt: node.completedAt ? node.completedAt * 1000 : null,
    score: parseScore(node.displayScore, mine.name || ""),
    opponent: {
      // A team has no single player to attribute the set to.
      playerId:
        opponentPlayers.length === 1 && opponentPlayers[0]?.player?.id
          ? String(opponentPlayers[0].player.id)
          : null,
      name: theirs.name || "",
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

// A set with its slots and per-game picks is up to about 26 of start.gg's
// 1000 objects per request for singles (more for teams), and start.gg takes
// longer over a page the bigger it is. So pages are small and all requested
// at once.
const SETS_PER_PAGE = 28;
// A page that is still too heavy is asked for again in halves, down to this.
const MIN_SETS_PER_PAGE = 7;

const isTooComplex = (message: string | undefined): boolean =>
  /complexity/i.test(message ?? "");

// One page of sets. If start.gg refuses it for returning too many objects,
// the same sets are fetched as two pages of half the size.
const fetchSetsPage = async (
  playerId: string,
  eventIds: string[],
  page: number,
  perPage: number,
): Promise<UserSet[]> => {
  const result = await startggClient
    .query(UserSetsQueryDoc, { playerId, page, perPage, eventIds })
    .toPromise();

  const connection = result.data?.player?.sets;
  if (result.error || !connection) {
    if (
      isTooComplex(result.error?.message) &&
      perPage % 2 === 0 &&
      perPage / 2 >= MIN_SETS_PER_PAGE
    ) {
      const halves = await Promise.all([
        fetchSetsPage(playerId, eventIds, page * 2 - 1, perPage / 2),
        fetchSetsPage(playerId, eventIds, page * 2, perPage / 2),
      ]);
      return halves.flat();
    }
    throw startggLoadError(result.error, "Could not load sets");
  }

  return (connection.nodes ?? [])
    .map((node) => (node ? toUserSet(node, playerId) : null))
    .filter((set): set is UserSet => set !== null);
};

// The player's most recent sets in the given events, newest first: `pages`
// pages of them, requested together. Sets have no game filter of their own,
// so they are narrowed to a game by its events. `eventIds` must not be empty:
// start.gg reads an empty list as no filter at all.
export const fetchUserSets = async (
  playerId: string,
  eventIds: string[],
  pages: number,
): Promise<UserSet[]> => {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, index) =>
      fetchSetsPage(playerId, eventIds, index + 1, SETS_PER_PAGE),
    ),
  );
  return results.flat();
};
