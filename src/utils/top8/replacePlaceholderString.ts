import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { ElementFactoryContext } from "@/types/top8/ElementFactoryTypes";

const getPlaceholderMap = (
  context: ElementFactoryContext
): Record<LayoutPlaceholder, string | undefined> => {
  const { player, tournament } = context;
  return {
    [LayoutPlaceholder.PLAYER_PLACEMENT]: player?.placement?.toString(),
    [LayoutPlaceholder.PLAYER_NAME]: player?.name,
    [LayoutPlaceholder.PLAYER_TAG]: player?.gamerTag,
    [LayoutPlaceholder.PLAYER_PREFIX]: player?.prefix,
    [LayoutPlaceholder.TOURNAMENT_NAME]: tournament?.tournamentName,
    [LayoutPlaceholder.EVENT_NAME]: tournament?.eventName,
    [LayoutPlaceholder.TOURNAMENT_DATE]: tournament?.date?.toLocaleDateString(),
    [LayoutPlaceholder.TOURNAMENT_LOCATION]: `${tournament?.location.city}, ${
      tournament?.location.state
    }${
      tournament?.location.country ? `, ${tournament?.location.country}` : ""
    }`,
    [LayoutPlaceholder.ENTRANTS]: tournament?.entrants?.toString(),
  };
};

export const replacePlaceholders = (
  text: string,
  context: ElementFactoryContext
): string => {
  const map = getPlaceholderMap(context);
  return text.replace(
    /<[^>]+>/g,
    (match) => map[match as LayoutPlaceholder] ?? match
  );
};
