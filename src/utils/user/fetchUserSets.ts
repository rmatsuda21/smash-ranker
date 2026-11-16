import { graphql } from "@/gql";
import type { UserSetsQuery } from "@/gql/graphql";
import type { UserSet } from "@/types/user/UserSet";
import { startggClient } from "@/utils/startgg/client";

const UserSetsQueryDoc = graphql(`
  query UserSets($playerId: ID!, $page: Int!, $perPage: Int!) {
    player(id: $playerId) {
      id
      sets(page: $page, perPage: $perPage) {
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

// Sets with per-game picks are expensive on start.gg's side (about 650
// complexity per 40), so pages stay under 50.
export const USER_SETS_PER_PAGE = 45;

export const fetchUserSetsPage = async (
  playerId: string,
  page: number,
): Promise<{ sets: UserSet[]; totalPages: number }> => {
  const result = await startggClient
    .query(UserSetsQueryDoc, { playerId, page, perPage: USER_SETS_PER_PAGE })
    .toPromise();

  const connection = result.data?.player?.sets;
  if (result.error || !connection) {
    throw new Error(result.error?.message || "Could not load sets");
  }

  return {
    sets: (connection.nodes ?? [])
      .map((node) => (node ? toUserSet(node, playerId) : null))
      .filter((set): set is UserSet => set !== null),
    totalPages: connection.pageInfo?.totalPages ?? 1,
  };
};
