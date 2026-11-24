import { graphql } from "@/gql";
import type { ThumbnailEventSetsQuery } from "@/gql/graphql";
import { SETS_PER_PAGE } from "@/consts/thumbnail/thumbnail";
import type { GameId } from "@/types/Game";
import type { ThumbnailSet } from "@/types/thumbnail/Thumbnail";
import { getGameForStartggVideogame } from "@/utils/games";
import { startggClient } from "@/utils/startgg/client";
import { makeSide } from "@/utils/thumbnail/match";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

const ThumbnailEventMetaQueryDoc = graphql(`
  query ThumbnailEventMeta($slug: String!) {
    event(slug: $slug) {
      id
      name
      startAt
      videogame {
        id
      }
      tournament {
        name
        images {
          url
          type
        }
      }
    }
  }
`);

// Newest sets first, so the first pages hold the finals and the streamed
// sets before them. A set with players and per-game picks is about 30
// objects (measured: 24 sets = 724), hence the small page.
const ThumbnailEventSetsQueryDoc = graphql(`
  query ThumbnailEventSets($slug: String!, $page: Int!, $perPage: Int!) {
    event(slug: $slug) {
      id
      sets(
        page: $page
        perPage: $perPage
        sortType: RECENT
        filters: { hideEmpty: true }
      ) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          fullRoundText
          lPlacement
          stream {
            streamName
          }
          slots {
            entrant {
              id
              name
              participants {
                gamerTag
                prefix
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
    NonNullable<NonNullable<ThumbnailEventSetsQuery["event"]>["sets"]>["nodes"]
  >[number]
>;

// The character each entrant picked most in the set. Picks the site has no
// art for (another game, Random) are left out.
const mostPicked = (games: SetNode["games"]): Map<string, string> => {
  const counts = new Map<string, Map<string, number>>();
  for (const game of games ?? []) {
    for (const selection of game?.selections ?? []) {
      if (selection?.selectionType !== "CHARACTER") continue;
      const entrantId = selection.entrant?.id;
      const characterId = String(selection.selectionValue ?? "");
      if (entrantId == null || !isKnownCharacter(characterId)) continue;
      const byCharacter = counts.get(String(entrantId)) ?? new Map();
      byCharacter.set(characterId, (byCharacter.get(characterId) ?? 0) + 1);
      counts.set(String(entrantId), byCharacter);
    }
  }
  const picks = new Map<string, string>();
  for (const [entrantId, byCharacter] of counts) {
    const [top] = [...byCharacter].sort((a, b) => b[1] - a[1]);
    if (top) picks.set(entrantId, top[0]);
  }
  return picks;
};

const toSet = (node: SetNode): ThumbnailSet | null => {
  const entrants = (node.slots ?? []).map((slot) => slot?.entrant);
  const [first, second] = entrants;
  if (!node.id || !first?.id || !second?.id) return null;

  const picks = mostPicked(node.games);
  const side = (entrant: NonNullable<typeof first>) => {
    const players = entrant.participants ?? [];
    // A team keeps its entrant name; a single player splits into sponsor
    // and tag.
    const solo = players.length === 1 ? players[0] : null;
    return makeSide({
      name: solo?.gamerTag || entrant.name || "",
      sponsor: solo?.prefix || "",
      characterId: picks.get(String(entrant.id)) ?? "",
    });
  };

  const onStream = !!node.stream;
  // The loser of a top 8 set places 8th or better.
  const top8 = node.lPlacement != null && node.lPlacement <= 8;
  return {
    id: String(node.id),
    sides: [side(first), side(second)],
    round: node.fullRoundText ?? "",
    onStream,
    top8,
    included: onStream || top8,
  };
};

export type ThumbnailEventMeta = {
  tournamentName: string;
  eventName: string;
  date: string;
  iconUrl: string;
  game: GameId | null;
};

export const fetchThumbnailEventMeta = async (
  slug: string,
): Promise<ThumbnailEventMeta | null> => {
  const result = await startggClient
    .query(ThumbnailEventMetaQueryDoc, { slug })
    .toPromise();
  if (result.error) throw new Error(result.error.message);
  const event = result.data?.event;
  if (!event) return null;
  return {
    tournamentName: event.tournament?.name ?? "",
    eventName: event.name ?? "",
    date: event.startAt ? new Date(event.startAt * 1000).toISOString() : "",
    iconUrl:
      event.tournament?.images
        ?.find((image) => image?.type === "profile")
        ?.url?.replace("http://", "https://") ?? "",
    game: getGameForStartggVideogame(event.videogame?.id)?.id ?? null,
  };
};

// Pages `from` to `from + count - 1` of the event's sets, requested
// together. Pages past the end come back empty.
export const fetchThumbnailSetPages = async (
  slug: string,
  from: number,
  count: number,
): Promise<{ sets: ThumbnailSet[]; total: number }> => {
  const pages = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      startggClient
        .query(ThumbnailEventSetsQueryDoc, {
          slug,
          page: from + i,
          perPage: SETS_PER_PAGE,
        })
        .toPromise(),
    ),
  );

  const sets: ThumbnailSet[] = [];
  let total = 0;
  for (const page of pages) {
    if (page.error) throw new Error(page.error.message);
    const connection = page.data?.event?.sets;
    total = Math.max(total, connection?.pageInfo?.total ?? 0);
    for (const node of connection?.nodes ?? []) {
      const set = node ? toSet(node) : null;
      if (set) sets.push(set);
    }
  }
  return { sets, total };
};
