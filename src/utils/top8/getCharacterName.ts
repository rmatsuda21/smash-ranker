import { getCharacter } from "@/utils/top8/characterCatalog";

export const getCharacterDisplayName = (
  characterId: string,
  locale: string,
): string => {
  const char = getCharacter(characterId);
  if (!char) return characterId;
  return locale === "ja" && char.nameJa ? char.nameJa : char.name;
};

export const getCharacterSearchTerms = (characterId: string): string[] => {
  const char = getCharacter(characterId);
  if (!char) return [];
  const terms = [char.name];
  if (char.nameJa) terms.push(char.nameJa);
  return terms;
};
