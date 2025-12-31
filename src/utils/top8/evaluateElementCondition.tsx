import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { ElementFactoryContext } from "@/types/top8/ElementFactory";

const getConditionMap = (
  context: ElementFactoryContext
): Record<DesignPlaceholder | RenderCondition, boolean> => {
  const { player, tournament, canvas } = context;
  return {
    [DesignPlaceholder.PLAYER_TWITTER]: Boolean(player?.twitter),
    [DesignPlaceholder.PLAYER_PLACEMENT]: Boolean(player?.placement),
    [DesignPlaceholder.PLAYER_NAME]: Boolean(player?.name),
    [DesignPlaceholder.PLAYER_TAG]: Boolean(player?.gamerTag),
    [DesignPlaceholder.PLAYER_PREFIX]: Boolean(player?.prefix),
    [DesignPlaceholder.TOURNAMENT_NAME]: Boolean(tournament?.tournamentName),
    [DesignPlaceholder.EVENT_NAME]: Boolean(tournament?.eventName),
    [DesignPlaceholder.TOURNAMENT_DATE]: Boolean(tournament?.date),
    [DesignPlaceholder.TOURNAMENT_LOCATION]:
      Boolean(tournament?.location.city) &&
      Boolean(tournament?.location.state) &&
      Boolean(tournament?.location.country),
    [DesignPlaceholder.ENTRANTS]: Boolean(tournament?.entrants),
    [DesignPlaceholder.TOURNAMENT_CITY]: Boolean(tournament?.location.city),
    [DesignPlaceholder.TOURNAMENT_STATE]: Boolean(tournament?.location.state),
    [DesignPlaceholder.TOURNAMENT_COUNTRY]: Boolean(
      tournament?.location.country
    ),
    [RenderCondition.TOURNAMENT_ICON]: Boolean(tournament?.iconSrc),
    [RenderCondition.BACKGROUND_IMG]: Boolean(canvas?.bgAssetId),
    [RenderCondition.NOT]: true,
  };
};

export const evaluateElementCondition = (
  conditions: (DesignPlaceholder | RenderCondition)[] | undefined,
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
