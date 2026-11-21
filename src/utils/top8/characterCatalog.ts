import ultCharacters from "@/consts/top8/ultCharacters.json";
import meleeCharacters from "@/consts/top8/meleeCharacters.json";
import { GAME_IDS } from "@/consts/games";
import { GameId } from "@/types/Game";
import { CharacterEntry } from "@/types/top8/Character";

// Every character the site has art for, by game. Ids are start.gg character
// ids, which never repeat between games, so anything that only draws a
// character can look it up by id alone; only pickers need to know the game.
const CHARACTERS_BY_GAME: Record<GameId, CharacterEntry[]> = {
  ultimate: ultCharacters.characters as CharacterEntry[],
  melee: meleeCharacters.characters as CharacterEntry[],
};

const characterById = new Map<string, CharacterEntry>();
const gameById = new Map<string, GameId>();

for (const game of GAME_IDS) {
  for (const character of CHARACTERS_BY_GAME[game]) {
    characterById.set(character.id, character);
    gameById.set(character.id, game);
  }
}

export const getCharactersForGame = (game: GameId): CharacterEntry[] =>
  CHARACTERS_BY_GAME[game];

export const getAllCharacters = (): CharacterEntry[] =>
  GAME_IDS.flatMap((game) => CHARACTERS_BY_GAME[game]);

export const getCharacter = (characterId: string): CharacterEntry | undefined =>
  characterById.get(characterId);

export const getCharacterGame = (characterId: string): GameId | undefined =>
  gameById.get(characterId);

// Ids from start.gg can belong to a game the site has no art for (or be a
// pick with no art, like Random); those must not reach an image URL.
export const isKnownCharacter = (characterId: string): boolean =>
  characterById.has(characterId);
