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
  createPlayerFlagElement,
} from "./player";
import { createGroupElement, createFlexGroupElement } from "./layout";
import { createRectElement } from "./shape";

export const elementCreators = {
  text: createTextElement,
  smartText: createSmartTextElement,
  image: createImageElement,
  group: createGroupElement,
  flexGroup: createFlexGroupElement,
  characterImage: createCharacterImageElement,
  altCharacterImage: createAltCharacterImageElement,
  rect: createRectElement,
  customImage: createCustomImageElement,
  svg: createSvgElement,
  tournamentIcon: createTournamentIconElement,
  backgroundImage: createBackgroundImageElement,
  playerFlag: createPlayerFlagElement,
};

export {
  createTextElement,
  createSmartTextElement,
  createImageElement,
  createCustomImageElement,
  createSvgElement,
  createTournamentIconElement,
  createBackgroundImageElement,
  createCharacterImageElement,
  createAltCharacterImageElement,
  createPlayerFlagElement,
  createGroupElement,
  createFlexGroupElement,
  createRectElement,
};
