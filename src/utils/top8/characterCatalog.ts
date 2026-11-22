import ultCharacters from "@/consts/top8/ultCharacters.json";
import meleeCharacters from "@/consts/top8/meleeCharacters.json";
import { GAME_IDS } from "@/consts/games";
import ultMuralRenders from "@/consts/top8/ultMuralRenders.json";
import { GameId, RenderStyleId } from "@/types/Game";
import { CharacterEntry, CharacterRenderSet } from "@/types/top8/Character";

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

// Art in the non-standard render styles, by character id.
const RENDER_SETS: Partial<
  Record<RenderStyleId, Record<string, CharacterRenderSet>>
> = {
  mural: ultMuralRenders.renders as Record<string, CharacterRenderSet>,
};

// The character's art in a style, or undefined when it has none there (and
// always for "standard", which is described by the character entry itself).
export const getRenderSet = (
  characterId: string,
  style: RenderStyleId | undefined,
): CharacterRenderSet | undefined =>
  style ? RENDER_SETS[style]?.[characterId] : undefined;

// The costumes a character can be drawn in for a style, as alt numbers. A
// style the character has no art in gives the standard list.
export const getRenderAlts = (
  characterId: string,
  style: RenderStyleId | undefined,
): number[] => {
  const set = getRenderSet(characterId, style);
  if (set) return set.alts;
  const alts = characterById.get(characterId)?.alts ?? 0;
  return Array.from({ length: alts }, (_, alt) => alt);
};

// The costume to draw when `alt` is asked for: `alt` itself when the style
// has it, otherwise the style's first costume.
export const resolveRenderAlt = (
  characterId: string,
  alt: number,
  style: RenderStyleId | undefined,
): number => {
  const set = getRenderSet(characterId, style);
  if (!set || set.alts.includes(alt)) return alt;
  return set.alts[0] ?? alt;
};
