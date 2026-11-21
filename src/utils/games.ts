import { GAME_IDS, GAMES } from "@/consts/games";
import { GameDefinition, GameId } from "@/types/Game";

export const isGameId = (value: unknown): value is GameId =>
  typeof value === "string" && value in GAMES;

// The game of a start.gg event, or undefined for one the site has no art for.
export const getGameForStartggVideogame = (
  videogameId: string | number | null | undefined,
): GameDefinition | undefined => {
  if (videogameId == null) return undefined;
  const id = String(videogameId);
  return GAME_IDS.map((game) => GAMES[game]).find(
    (game) => game.startggVideogameId === id,
  );
};

// The game behind a free-text name ("Super Smash Bros. Melee",
// "大乱闘スマッシュブラザーズ SPECIAL"), for platforms without game ids.
export const getGameForName = (
  name: string | null | undefined,
): GameDefinition | undefined => {
  if (!name) return undefined;
  const normalized = name.toLowerCase().replace(/\s+/g, "");
  return GAME_IDS.map((game) => GAMES[game]).find((game) =>
    game.nameFragments.some((fragment) => normalized.includes(fragment)),
  );
};
