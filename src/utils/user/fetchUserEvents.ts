import { graphql } from "@/gql";
import type { UserEventsQuery } from "@/gql/graphql";
import type { UserEvent } from "@/types/user/UserEvent";
import { startggClient } from "@/utils/startgg/client";

// Looked up by slug rather than `currentUser` so the result is the same
// whichever token the request ends up going out with.
const UserEventsQueryDoc = graphql(`
  query UserEvents($slug: String!, $userId: ID!, $page: Int!, $perPage: Int!) {
    user(slug: $slug) {
      id
      events(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          name
          slug
          startAt
          numEntrants
          isOnline
          state
          videogame {
            id
            name
          }
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
            addrState
            countryCode
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
    NonNullable<NonNullable<UserEventsQuery["user"]>["events"]>["nodes"]
  >[number]
>;

const toUserEvent = (node: EventNode): UserEvent | null => {
  if (!node.id || !node.slug || !node.tournament?.id) return null;
  return {
    id: String(node.id),
    name: node.name || "",
    slug: node.slug,
    startAt: node.startAt ? node.startAt * 1000 : null,
    numEntrants: node.numEntrants ?? 0,
    isOnline: Boolean(node.isOnline),
    isCompleted: node.state === "COMPLETED",
    videogameName: node.videogame?.name || null,
    entrantId: node.userEntrant?.id ? String(node.userEntrant.id) : null,
    seed: node.userEntrant?.initialSeedNum ?? null,
    placement: node.userEntrant?.standing?.placement ?? null,
    tournament: {
      id: String(node.tournament.id),
      name: node.tournament.name || "",
      city: node.tournament.city || null,
      state: node.tournament.addrState || null,
      countryCode: node.tournament.countryCode || null,
      iconUrl:
        node.tournament.images?.[0]?.url?.replace("http://", "https://") ||
        null,
    },
  };
};

export type UserEventsPage = {
  events: UserEvent[];
  total: number;
  totalPages: number;
};

// Newest first (start.gg's order), upcoming registrations included.
export const fetchUserEventsPage = async (
  user: { slug: string; id: string },
  page: number,
  perPage: number,
): Promise<UserEventsPage> => {
  const result = await startggClient
    .query(UserEventsQueryDoc, {
      slug: user.slug,
      userId: user.id,
      page,
      perPage,
    })
    .toPromise();

  const connection = result.data?.user?.events;
  if (result.error || !connection) {
    throw new Error(result.error?.message || "Could not load tournaments");
  }

  return {
    events: (connection.nodes ?? [])
      .map((node) => (node ? toUserEvent(node) : null))
      .filter((event): event is UserEvent => event !== null),
    total: connection.pageInfo?.total ?? 0,
    totalPages: connection.pageInfo?.totalPages ?? 1,
  };
};
