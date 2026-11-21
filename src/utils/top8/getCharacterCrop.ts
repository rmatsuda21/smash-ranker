import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getCharacter } from "@/utils/top8/characterCatalog";

export type CharacterCrop = {
  offset: { x: number; y: number };
  scale: number;
};

export const getCharacterCrop = (
  characterId: string,
  alt?: number,
): CharacterCrop => {
  const character = getCharacter(characterId);

  if (characterId === EMPTY_CHARACTER_ID) {
    return { offset: { x: 0, y: 0 }, scale: 0.8 };
  }

  if (!character) {
    return { offset: { x: 0, y: 0 }, scale: 1 };
  }

  // Check for alt-specific overrides
  const altOverride =
    alt !== undefined ? character.altOverrides?.[alt] : undefined;

  return {
    offset: altOverride?.cropOffset ?? character.cropOffset ?? { x: 0, y: 0 },
    scale: altOverride?.cropScale ?? character.cropScale ?? 1,
  };
};
