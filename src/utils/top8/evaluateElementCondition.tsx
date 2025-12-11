import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { ElementFactoryContext } from "@/types/top8/ElementFactoryTypes";

const getConditionMap = (context: ElementFactoryContext) => {
  const { player, tournament } = context;
  return {
    [LayoutPlaceholder.PLAYER_TWITTER]: Boolean(player?.twitter),
    [LayoutPlaceholder.PLAYER_PLACEMENT]: Boolean(player?.placement),
    [LayoutPlaceholder.PLAYER_NAME]: Boolean(player?.name),
    [LayoutPlaceholder.PLAYER_TAG]: Boolean(player?.gamerTag),
    [LayoutPlaceholder.PLAYER_PREFIX]: Boolean(player?.prefix),
    [LayoutPlaceholder.TOURNAMENT_NAME]: Boolean(tournament?.tournamentName),
    [LayoutPlaceholder.EVENT_NAME]: Boolean(tournament?.eventName),
    [LayoutPlaceholder.TOURNAMENT_DATE]: Boolean(
      tournament?.date?.toLocaleDateString()
    ),
    [LayoutPlaceholder.TOURNAMENT_LOCATION]:
      Boolean(tournament?.location.city) &&
      Boolean(tournament?.location.state) &&
      Boolean(tournament?.location.country),
    [LayoutPlaceholder.ENTRANTS]: Boolean(tournament?.entrants),
  };
};

export const evaluateElementCondition = (
  condition: LayoutPlaceholder,
  context: ElementFactoryContext
) => {
  return getConditionMap(context)[condition];
};
