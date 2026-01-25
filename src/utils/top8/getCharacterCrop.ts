import ultCharacters from "@/consts/top8/ultCharacters.json";

export type CharacterCrop = {
  offset: { x: number; y: number };
  scale: number;
};

type AltOverride = {
  cropOffset?: { x: number; y: number };
  cropScale?: number;
};

type CharacterData = {
  id: string;
  name: string;
  alts: number;
  altNames: string[];
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  altOverrides?: Record<string, AltOverride>;
};

const characterMap = new Map<string, CharacterData>(
  (ultCharacters.characters as CharacterData[]).map((char) => [char.id, char])
);

export const getCharacterCrop = (
  characterId: string,
  alt?: number
): CharacterCrop => {
  const character = characterMap.get(characterId);

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
