import { GAMES } from "@/consts/games";
import { graphql } from "@/gql";
import type { RecapEventsQuery } from "@/gql/graphql";
import type { GameId } from "@/types/Game";
import type { RecapEvent, RecapPlayer } from "@/types/recap/Recap";
import { startggClient } from "@/utils/startgg/client";

const RecapEventsQueryDoc = graphql(`
  query RecapEvents(
    $slug: String!
    $userId: ID!
    $page: Int!
    $perPage: Int!
    $videogameIds: [ID]
  ) {
    user(slug: $slug) {
      id
      events(
        query: {
          page: $page
          perPage: $perPage
          filter: { videogameId: $videogameIds }
        }
      ) {
        pageInfo {
          totalPages
        }
        nodes {
          id
          name
          type
          startAt
          numEntrants
          isOnline
          userEntrant(userId: $userId) {
            id
            initialSeedNum
            standing {
              placement
            }
          }
          tournament {
            id
            name
            city
            countryCode
            lat
            lng
            images(type: "profile") {
              url
            }
          }
        }
      }
    }
  }
`);

type EventNode = NonNullable<
  NonNullable<
    NonNullable<NonNullable<RecapEventsQuery["user"]>["events"]>["nodes"]
  >[number]
>;

// Brackets beside the main one. start.gg has no flag for them, so this goes
// by the name; team events are also told by `type`.
const SIDE_EVENT = /redemption|amateur|doubles|squad|ladder|teams|crew/i;
const TEAM_EVENT_TYPE = 5;

const toRecapEvent = (node: EventNode): RecapEvent | null => {
  if (!node.id || !node.startAt || !node.tournament?.id) return null;
  return {
    id: String(node.id),
    name: node.name || "",
    startAt: node.startAt * 1000,
    numEntrants: node.numEntrants ?? 0,
    isOnline: Boolean(node.isOnline),
    isSide: SIDE_EVENT.test(node.name || "") || node.type === TEAM_EVENT_TYPE,
    placement: node.userEntrant?.standing?.placement ?? null,
    seed: node.userEntrant?.initialSeedNum ?? null,
    tournament: {
      id: String(node.tournament.id),
      name: node.tournament.name || "",
      city: node.tournament.city || null,
      countryCode: node.tournament.countryCode || null,
      lat: node.tournament.lat ?? null,
      lng: node.tournament.lng ?? null,
      iconUrl:
        node.tournament.images?.[0]?.url?.replace("http://", "https://") ||
        null,
    },
  };
};

// 40 events is under 300 of start.gg's 1000-object budget.
const PER_PAGE = 40;
// 800 events in a year is more than anyone enters.
const MAX_PAGES = 20;

// Every event the player entered in `year` in one game, up to now. start.gg
// returns events newest first with no date filter, so pages are read until
// one holds nothing from the year.
export const fetchRecapEvents = async (
  player: Pick<RecapPlayer, "slug" | "userId">,
  game: GameId,
  year: number,
  now: number = Date.now(),
): Promise<RecapEvent[]> => {
  const from = new Date(year, 0, 1).getTime();
  const until = Math.min(new Date(year + 1, 0, 1).getTime(), now);
  const events: RecapEvent[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await startggClient
      .query(RecapEventsQueryDoc, {
        slug: player.slug,
        userId: player.userId,
        page,
        perPage: PER_PAGE,
        videogameIds: [GAMES[game].startggVideogameId],
      })
      .toPromise();
    const connection = result.data?.user?.events;
    if (result.error || !connection) {
      throw new Error(result.error?.message || "Could not load tournaments");
    }

    const all = (connection.nodes ?? [])
      .map((node) => (node ? toRecapEvent(node) : null))
      .filter((event): event is RecapEvent => event !== null);
    events.push(
      ...all.filter((event) => event.startAt >= from && event.startAt < until),
    );

    // The order is roughly newest first, so only a page entirely before the
    // year ends the walk.
    const reachedEarlier =
      all.length > 0 && all.every((event) => event.startAt < from);
    if (reachedEarlier || page >= (connection.pageInfo?.totalPages ?? 1)) break;
  }

  return events.sort((a, b) => a.startAt - b.startAt);
};
