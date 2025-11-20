import {
  TextElementConfig,
  ElementConfig,
  PlayerLayoutConfig,
} from "@/types/top8/Layout";

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
  return text
    .replace(/<tournamentName>/g, info.tournamentName)
    .replace(/<eventName>/g, info.eventName)
    .replace(/<date>/g, info.date.toLocaleDateString())
    .replace(/<location>/g, info.location)
    .replace(/<entrants>/g, `${info.entrants} Entrants`);
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
      text: "<tournamentName>",
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      x: 0,
      y: 50,
      text: "<eventName>",
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      x: 0,
      y: 100,
      text: "<date>",
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
  return text
    .replace(/<name>/g, player.name)
    .replace(/<tag>/g, player.tag || "");
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
