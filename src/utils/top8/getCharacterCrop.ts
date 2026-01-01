import ultCharacters from "@/consts/top8/ultCharacters.json";

export type CharacterCrop = {
  offset: { x: number; y: number };
  scale: number;
};

type CharacterData = {
  id: string;
  name: string;
  alts: number;
  altNames: string[];
  cropOffset?: { x: number; y: number };
  cropScale?: number;
};

const characterMap = new Map<string, CharacterData>(
  (ultCharacters.characters as CharacterData[]).map((char) => [char.id, char])
);

export const getCharacterCrop = (characterId: string): CharacterCrop => {
  const character = characterMap.get(characterId);

  if (!character) {
    return { offset: { x: 0, y: 0 }, scale: 1 };
  }

  return {
    offset: character.cropOffset ?? { x: 0, y: 0 },
    scale: character.cropScale ?? 1,
  };
};
