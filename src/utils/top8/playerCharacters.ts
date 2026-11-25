import { CharacerData } from "@/types/top8/Player";
import {
  EMPTY_CHARACTER_ID,
  EMPTY_CHARACTER_DARK_IMG,
} from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

// The one place that says what "this player has no character" is. A player
// with no character holds a single "no character" entry, which is what the
// character picker's None is; an empty list (older saved data, a caller that
// built a player by hand) means the same and is read as that entry, so the
// canvas and the editor never see two kinds of nothing.

type HasCharacters = { characters?: CharacerData[] };

const NO_CHARACTER: CharacerData = { id: EMPTY_CHARACTER_ID, alt: 0 };
const NO_CHARACTERS: CharacerData[] = [NO_CHARACTER];

/** What a player with no character stores. A new array each time: players
 *  are edited in place while a tournament loads. */
export const noCharacters = (): CharacerData[] => [{ ...NO_CHARACTER }];

export const isNoCharacter = (character: CharacerData): boolean =>
  character.id === EMPTY_CHARACTER_ID;

/** A player's characters as everything should read them: never empty. */
export const getCharacters = (
  member: HasCharacters | undefined,
): CharacerData[] =>
  member?.characters && member.characters.length > 0
    ? member.characters
    : NO_CHARACTERS;

export const hasNoCharacter = (member: HasCharacters | undefined): boolean =>
  getCharacters(member).every(isNoCharacter);

/** The image the canvas draws for a character. "No character" is the grey
 *  mark (the white one of the page's own UI is lost against light cards). */
export const getCanvasCharacterSrc = (
  character: CharacerData,
  type: "main" | "stock",
): string =>
  isNoCharacter(character)
    ? EMPTY_CHARACTER_DARK_IMG
    : getCharImgUrl({
        characterId: character.id,
        alt: character.alt,
        type,
        style: character.style,
      });
