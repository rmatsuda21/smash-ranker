import ultCharacters from "@/consts/top8/ultCharacters.json";
import meleeCharacters from "@/consts/top8/meleeCharacters.json";
import { CharacterEntry, CharacterGame } from "@/types/top8/Character";

// Every character the site has art for, by game. Ids are start.gg character
// ids, which never repeat between games, so anything that only draws a
// character can look it up by id alone; only pickers need to know the game.
const CHARACTERS_BY_GAME: Record<CharacterGame, CharacterEntry[]> = {
  ultimate: ultCharacters.characters as CharacterEntry[],
  melee: meleeCharacters.characters as CharacterEntry[],
};

export const CHARACTER_GAMES = Object.keys(
  CHARACTERS_BY_GAME,
) as CharacterGame[];

const characterById = new Map<string, CharacterEntry>();
const gameById = new Map<string, CharacterGame>();

for (const game of CHARACTER_GAMES) {
  for (const character of CHARACTERS_BY_GAME[game]) {
    characterById.set(character.id, character);
    gameById.set(character.id, game);
  }
}

export const getCharactersForGame = (game: CharacterGame): CharacterEntry[] =>
  CHARACTERS_BY_GAME[game];

export const getCharacter = (characterId: string): CharacterEntry | undefined =>
  characterById.get(characterId);

export const getCharacterGame = (
  characterId: string,
): CharacterGame | undefined => gameById.get(characterId);

// start.gg videogame id → game, for tournaments loaded from start.gg.
const GAME_BY_STARTGG_VIDEOGAME_ID: Record<string, CharacterGame> = {
  "1": "melee",
  "1386": "ultimate",
};

export const getGameForStartggVideogame = (
  videogameId: string | number | null | undefined,
): CharacterGame | undefined =>
  videogameId == null
    ? undefined
    : GAME_BY_STARTGG_VIDEOGAME_ID[String(videogameId)];
