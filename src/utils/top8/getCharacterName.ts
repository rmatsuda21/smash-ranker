import { characters } from "@/consts/top8/ultCharacters.json";

type CharacterEntry = (typeof characters)[number];

const characterById = new Map<string, CharacterEntry>(
  characters.map((c) => [c.id, c])
);

export const getCharacterDisplayName = (
  characterId: string,
  locale: string
): string => {
  const char = characterById.get(characterId);
  if (!char) return characterId;
  return locale === "ja" && char.nameJa ? char.nameJa : char.name;
};

export const getCharacterSearchTerms = (
  characterId: string
): string[] => {
  const char = characterById.get(characterId);
  if (!char) return [];
  const terms = [char.name];
  if (char.nameJa) terms.push(char.nameJa);
  return terms;
};
