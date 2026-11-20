import { createTextElement, createSmartTextElement } from "./text";
import {
  createImageElement,
  createCustomImageElement,
  createSvgElement,
  createTournamentIconElement,
  createBackgroundImageElement,
} from "./image";
import {
  createCharacterImageElement,
  createAltCharacterImageElement,
  createCustomAltCharacterImageElement,
  createPlayerFlagElement,
} from "./player";
import {
  createGroupElement,
  createFlexGroupElement,
  createFlexGridElement,
} from "./layout";
import {
  createPatternElement,
  createPolygonElement,
  createRectElement,
} from "./shape";

/** The creator for each element type: a function from one element config
 *  to the Konva node that draws it. */
export const elementCreators = {
  text: createTextElement,
  smartText: createSmartTextElement,
  image: createImageElement,
  group: createGroupElement,
  flexGroup: createFlexGroupElement,
  flexGrid: createFlexGridElement,
  characterImage: createCharacterImageElement,
  altCharacterImage: createAltCharacterImageElement,
  customAltCharacterImage: createCustomAltCharacterImageElement,
  rect: createRectElement,
  polygon: createPolygonElement,
  pattern: createPatternElement,
  customImage: createCustomImageElement,
  svg: createSvgElement,
  tournamentIcon: createTournamentIconElement,
  backgroundImage: createBackgroundImageElement,
  playerFlag: createPlayerFlagElement,
};
