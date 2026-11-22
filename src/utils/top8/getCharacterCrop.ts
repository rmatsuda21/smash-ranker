import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import {
  getCharacter,
  getRenderSet,
  resolveRenderAlt,
} from "@/utils/top8/characterCatalog";
import { RenderStyleId } from "@/types/Game";

export type CharacterCrop = {
  offset: { x: number; y: number };
  scale: number;
};

export const getCharacterCrop = (
  characterId: string,
  alt?: number,
  // The render style being drawn; its art has its own crop.
  style?: RenderStyleId,
): CharacterCrop => {
  const character = getCharacter(characterId);

  if (characterId === EMPTY_CHARACTER_ID) {
    return { offset: { x: 0, y: 0 }, scale: 0.8 };
  }

  if (!character) {
    return { offset: { x: 0, y: 0 }, scale: 1 };
  }

  const renderSet = getRenderSet(characterId, style);
  if (renderSet) {
    const override =
      alt !== undefined
        ? renderSet.altOverrides?.[resolveRenderAlt(characterId, alt, style)]
        : undefined;
    return {
      offset: override?.cropOffset ?? renderSet.cropOffset ?? { x: 0, y: 0 },
      scale: override?.cropScale ?? renderSet.cropScale ?? 1,
    };
  }

  // Check for alt-specific overrides
  const altOverride =
    alt !== undefined ? character.altOverrides?.[alt] : undefined;

  return {
    offset: altOverride?.cropOffset ?? character.cropOffset ?? { x: 0, y: 0 },
    scale: altOverride?.cropScale ?? character.cropScale ?? 1,
  };
};
