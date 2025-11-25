import {
  TextElementConfig,
  ElementConfig,
  PlayerLayoutConfig,
} from "@/types/top8/Layout";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

type TournamentInfo = {
  tournamentName: string;
  eventName: string;
  date: Date;
  location: string;
  entrants: number;
};

type PlayerData = {
  name: string;
  tag?: string;
};

const replacePlaceholders = (text: string, info: TournamentInfo): string => {
  const replacements: Record<string, string> = {
    [LayoutPlaceholder.TOURNAMENT_NAME]: info.tournamentName,
    [LayoutPlaceholder.EVENT_NAME]: info.eventName,
    [LayoutPlaceholder.TOURNAMENT_DATE]: info.date.toLocaleDateString(),
    [LayoutPlaceholder.TOURNAMENT_LOCATION]: info.location,
    [LayoutPlaceholder.ENTRANTS]: `${info.entrants} Entrants`,
  };

  return Object.entries(replacements).reduce(
    (result, [placeholder, value]) => result.split(placeholder).join(value),
    text
  );
};

export const processTournamentElements = (
  elements: ElementConfig[],
  info: TournamentInfo
): ElementConfig[] => {
  return elements.map((element) => {
    if (element && "type" in element && element.type === "text") {
      return {
        ...element,
        text: replacePlaceholders(element.text, info),
      };
    }
    return element;
  });
};

export const getTournamentElements = (
  config: { elements: ElementConfig[] } | undefined,
  info: TournamentInfo
): ElementConfig[] => {
  const defaultElements: ElementConfig[] = [
    {
      type: "text",
      x: 0,
      y: 0,
      text: LayoutPlaceholder.TOURNAMENT_NAME,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      x: 0,
      y: 50,
      text: LayoutPlaceholder.EVENT_NAME,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      x: 0,
      y: 100,
      text: LayoutPlaceholder.TOURNAMENT_DATE,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
  ];

  const elements = config?.elements || defaultElements;
  return processTournamentElements(elements, info);
};

const replacePlayerPlaceholders = (
  text: string,
  player: PlayerData
): string => {
  const replacements: Record<string, string> = {
    [LayoutPlaceholder.PLAYER_NAME]: player.name,
    [LayoutPlaceholder.PLAYER_TAG]: player.tag || "",
  };

  return Object.entries(replacements).reduce(
    (result, [placeholder, value]) => result.split(placeholder).join(value),
    text
  );
};

export const getPlayerElements = (
  layoutConfig: PlayerLayoutConfig,
  player: PlayerData
): ElementConfig[] => {
  const elements: ElementConfig[] = [];

  if (layoutConfig.character) {
    elements.push(layoutConfig.character);
  }

  if (layoutConfig.alternateCharacters) {
    elements.push(layoutConfig.alternateCharacters);
  }

  if (layoutConfig.name) {
    const processedName: TextElementConfig = {
      ...layoutConfig.name,
      text: replacePlayerPlaceholders(layoutConfig.name.text, player),
    };
    elements.push(processedName);
  }

  return elements;
};

export const getAllPlayerElements = (
  layoutConfigs: PlayerLayoutConfig[],
  players: PlayerData[]
): Array<{
  layoutConfig: PlayerLayoutConfig;
  player: PlayerData;
  elements: ElementConfig[];
}> => {
  return layoutConfigs.map((layoutConfig, index) => {
    const player = players[index];
    if (!player) {
      return {
        layoutConfig,
        player: { name: "" },
        elements: [],
      };
    }

    return {
      layoutConfig,
      player,
      elements: getPlayerElements(layoutConfig, player),
    };
  });
};
