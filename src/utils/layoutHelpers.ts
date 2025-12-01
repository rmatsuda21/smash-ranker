import { ElementConfig } from "@/types/top8/LayoutTypes";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { TournamentInfo } from "@/types/top8/TournamentTypes";
import { PlayerInfo } from "@/types/top8/PlayerTypes";

const getPlaceholderMap = ({
  tournament,
  player,
}: {
  tournament?: TournamentInfo;
  player?: PlayerInfo;
}): Record<LayoutPlaceholder, string | undefined> => {
  return {
    [LayoutPlaceholder.PLAYER_PLACEMENT]: player?.placement?.toString(),
    [LayoutPlaceholder.PLAYER_NAME]: player?.name,
    [LayoutPlaceholder.PLAYER_TAG]: player?.gamerTag,
    [LayoutPlaceholder.TOURNAMENT_NAME]: tournament?.tournamentName,
    [LayoutPlaceholder.EVENT_NAME]: tournament?.eventName,
    [LayoutPlaceholder.TOURNAMENT_DATE]: tournament?.date.toLocaleDateString(),
    [LayoutPlaceholder.TOURNAMENT_LOCATION]: tournament?.location,
    [LayoutPlaceholder.ENTRANTS]: `${tournament?.entrants} Entrants`,
  };
};

const replacePlaceholders = ({
  text,
  tournament,
  player,
}: {
  text: string;
  tournament?: TournamentInfo;
  player?: PlayerInfo;
}): string => {
  const map = getPlaceholderMap({ tournament, player });
  return text.replace(
    /<[^>]+>/g,
    (match) => map[match as LayoutPlaceholder] || match
  );
};

export const processElements = (
  elements: ElementConfig[],
  context: { tournament?: TournamentInfo; player?: PlayerInfo }
): ElementConfig[] => {
  return elements.map((element) => {
    if (element && "type" in element && element.type === "text") {
      return {
        ...element,
        text: replacePlaceholders({
          text: element.text,
          tournament: context.tournament,
          player: context.player,
        }),
      };
    }
    return element;
  });
};

export const processTournamentElements = (
  elements: ElementConfig[],
  tournament: TournamentInfo
): ElementConfig[] => {
  return processElements(elements, { tournament });
};

export const processPlayerElements = (
  elements: ElementConfig[],
  player: PlayerInfo
): ElementConfig[] => {
  return processElements(elements, { player });
};

export const getTournamentElements = (
  config: { elements: ElementConfig[] } | undefined,
  info: TournamentInfo
): ElementConfig[] => {
  const defaultElements: ElementConfig[] = [
    {
      type: "text",
      position: { x: 0, y: 0 },
      text: LayoutPlaceholder.TOURNAMENT_NAME,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      position: { x: 0, y: 50 },
      text: LayoutPlaceholder.EVENT_NAME,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
    {
      type: "text",
      position: { x: 0, y: 100 },
      text: LayoutPlaceholder.TOURNAMENT_DATE,
      fontSize: 50,
      fontWeight: "bold",
      fill: "white",
    },
  ];

  const elements = config?.elements || defaultElements;
  return processTournamentElements(elements, info);
};
