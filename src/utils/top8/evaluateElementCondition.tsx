import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { ElementFactoryContext } from "@/types/top8/ElementFactory";

const getConditionMap = (
  context: ElementFactoryContext
): Record<LayoutPlaceholder | RenderCondition, boolean> => {
  const { player, tournament, canvas } = context;
  return {
    [LayoutPlaceholder.PLAYER_TWITTER]: Boolean(player?.twitter),
    [LayoutPlaceholder.PLAYER_PLACEMENT]: Boolean(player?.placement),
    [LayoutPlaceholder.PLAYER_NAME]: Boolean(player?.name),
    [LayoutPlaceholder.PLAYER_TAG]: Boolean(player?.gamerTag),
    [LayoutPlaceholder.PLAYER_PREFIX]: Boolean(player?.prefix),
    [LayoutPlaceholder.TOURNAMENT_NAME]: Boolean(tournament?.tournamentName),
    [LayoutPlaceholder.EVENT_NAME]: Boolean(tournament?.eventName),
    [LayoutPlaceholder.TOURNAMENT_DATE]: Boolean(tournament?.date),
    [LayoutPlaceholder.TOURNAMENT_LOCATION]:
      Boolean(tournament?.location.city) &&
      Boolean(tournament?.location.state) &&
      Boolean(tournament?.location.country),
    [LayoutPlaceholder.ENTRANTS]: Boolean(tournament?.entrants),
    [LayoutPlaceholder.TOURNAMENT_CITY]: Boolean(tournament?.location.city),
    [LayoutPlaceholder.TOURNAMENT_STATE]: Boolean(tournament?.location.state),
    [LayoutPlaceholder.TOURNAMENT_COUNTRY]: Boolean(
      tournament?.location.country
    ),
    [RenderCondition.TOURNAMENT_ICON]: Boolean(tournament?.iconSrc),
    [RenderCondition.BACKGROUND_IMG]: Boolean(canvas?.bgAssetId),
    [RenderCondition.NOT]: true,
  };
};

export const evaluateElementCondition = (
  conditions: (LayoutPlaceholder | RenderCondition)[] | undefined,
  context: ElementFactoryContext
) => {
  if (!conditions) return true;

  let shouldRender = true;
  let negate = false;
  for (const condition of conditions) {
    if (condition === RenderCondition.NOT) {
      negate = true;
      continue;
    }

    const conditionValue = getConditionMap(context)[condition];
    if (negate) {
      shouldRender = !conditionValue;
    } else {
      shouldRender = conditionValue;
    }
    negate = false;
  }
  return shouldRender;
};
