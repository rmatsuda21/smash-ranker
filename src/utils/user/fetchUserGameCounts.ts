import { GAME_IDS, GAMES } from "@/consts/games";
import type { GameId } from "@/types/Game";
import { startggClient } from "@/utils/startgg/client";
import { startggLoadError } from "@/utils/startgg/describeError";

export type UserGameCounts = Record<GameId, number>;

// How many events the user has entered in each game the site covers, in one
// request. The query is built from the game registry (one aliased field per
// game), so it is a plain string rather than a generated document.
export const fetchUserGameCounts = async (
  slug: string,
): Promise<UserGameCounts> => {
  const fields = GAME_IDS.map(
    (game) =>
      `${game}: events(query: { page: 1, perPage: 1, filter: { videogameId: [${Number(GAMES[game].startggVideogameId)}] } }) { pageInfo { total } }`,
  ).join("\n");

  const result = await startggClient
    .query<{
      user: Record<
        GameId,
        { pageInfo: { total: number | null } | null }
      > | null;
    }>(
      `query UserGameCounts($slug: String!) { user(slug: $slug) { id ${fields} } }`,
      {
        slug,
      },
    )
    .toPromise();

  const user = result.data?.user;
  if (result.error || !user) {
    throw startggLoadError(result.error, "Could not load game counts");
  }

  return Object.fromEntries(
    GAME_IDS.map((game) => [game, user[game]?.pageInfo?.total ?? 0]),
  ) as UserGameCounts;
};
