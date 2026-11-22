import { DEFAULT_GAME, GAME_IDS } from "@/consts/games";
import { PREF_KEYS } from "@/consts/prefKeys";
import type { GameId } from "@/types/Game";
import { isGameId } from "@/utils/games";
import { getPref, setPref } from "@/utils/prefs";
import type { UserGameCounts } from "@/utils/user/fetchUserGameCounts";

// The games the user has entered at least one event in, in registry order.
export const getPlayedGames = (counts: UserGameCounts | null): GameId[] =>
  counts ? GAME_IDS.filter((game) => counts[game] > 0) : [];

// Which game the profile opens on: the one picked last time, unless the
// user has no events in it and does in another, in which case the game they
// play most. Until the counts are known it is the last pick.
export const pickProfileGame = (counts: UserGameCounts | null): GameId => {
  const stored = getPref(PREF_KEYS.PROFILE_GAME);
  const remembered = isGameId(stored) ? stored : DEFAULT_GAME;
  if (!counts || counts[remembered] > 0) return remembered;

  const played = getPlayedGames(counts);
  if (played.length === 0) return remembered;
  return played.reduce((best, game) =>
    counts[game] > counts[best] ? game : best,
  );
};

export const rememberProfileGame = (game: GameId) =>
  setPref(PREF_KEYS.PROFILE_GAME, game);
