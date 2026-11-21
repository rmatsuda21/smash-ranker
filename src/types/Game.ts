import { type MessageDescriptor } from "@lingui/core";

// Every game the site has character art for. Adding an id here makes the
// compiler ask for its entry in `GAMES` (src/consts/games.ts) and its
// character list in the catalog (src/utils/top8/characterCatalog.ts).
export type GameId = "ultimate" | "melee";

export type GameDefinition = {
  id: GameId;
  // Short name shown in game switches.
  label: MessageDescriptor;
  // start.gg `videogame.id`.
  startggVideogameId: string;
  // Lowercase fragments of the game's name as Challonge and Tonamel write
  // it; those platforms have no game id.
  nameFragments: string[];
  // Character a newly added slot starts with.
  defaultCharacterId: string;
  // Whether the better-gg player dataset (each player's main) covers this
  // game. It holds one game's characters, so it must not be read for others.
  hasPlayerDataset: boolean;
};
