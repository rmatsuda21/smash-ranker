import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { ElementFactoryContext } from "@/types/top8/ElementFactory";

/** Whether the data behind one condition is present. Only the condition
 *  asked for is computed. */
const isConditionMet = (
  condition: DesignPlaceholder | RenderCondition,
  { player, tournament, design }: ElementFactoryContext,
): boolean => {
  switch (condition) {
    case DesignPlaceholder.PLAYER_TWITTER:
      return Boolean(player?.twitter);
    case DesignPlaceholder.PLAYER_PLACEMENT:
      return Boolean(player?.placement);
    case DesignPlaceholder.PLAYER_COUNTRY:
      return Boolean(player?.customFlagSrc || player?.country);
    case DesignPlaceholder.PLAYER_NAME:
      return Boolean(player?.name);
    case DesignPlaceholder.PLAYER_TAG:
      return Boolean(player?.gamerTag);
    case DesignPlaceholder.PLAYER_PREFIX:
      return Boolean(player?.prefix);
    case DesignPlaceholder.TEAMMATE_TWITTER:
      return Boolean(player?.teammate?.twitter);
    case DesignPlaceholder.TEAMMATE_COUNTRY:
      return Boolean(
        player?.teammate?.customFlagSrc || player?.teammate?.country,
      );
    case DesignPlaceholder.TEAMMATE_NAME:
      return Boolean(player?.teammate?.name);
    case DesignPlaceholder.TEAMMATE_TAG:
      return Boolean(player?.teammate?.gamerTag);
    case DesignPlaceholder.TEAMMATE_PREFIX:
      return Boolean(player?.teammate?.prefix);
    case DesignPlaceholder.TOURNAMENT_NAME:
      return Boolean(tournament?.tournamentName);
    case DesignPlaceholder.EVENT_NAME:
      return Boolean(tournament?.eventName);
    case DesignPlaceholder.TOURNAMENT_DATE:
    case DesignPlaceholder.TOURNAMENT_DATE_NUMERIC:
      return Boolean(tournament?.date);
    case DesignPlaceholder.TOURNAMENT_LOCATION:
      return (
        Boolean(tournament?.location.city) &&
        Boolean(tournament?.location.state) &&
        Boolean(tournament?.location.country)
      );
    case DesignPlaceholder.ENTRANTS:
      return Boolean(tournament?.entrants);
    case DesignPlaceholder.TOURNAMENT_CITY:
      return Boolean(tournament?.location.city);
    case DesignPlaceholder.TOURNAMENT_STATE:
      return Boolean(tournament?.location.state);
    case DesignPlaceholder.TOURNAMENT_COUNTRY:
      return Boolean(tournament?.location.country);
    case DesignPlaceholder.TOURNAMENT_URL:
      return Boolean(tournament?.url);
    case RenderCondition.TOURNAMENT_ICON:
      return Boolean(tournament?.iconSrc);
    case RenderCondition.BACKGROUND_IMG:
      return Boolean(design?.bgAssetId);
    case RenderCondition.HAS_ALT_CHARACTERS:
      return Boolean(player?.characters && player.characters.length > 1);
    default:
      return false;
  }
};

/**
 * Evaluates an element's `conditions` list: every condition has to hold.
 * `RenderCondition.NOT` negates the condition that follows it.
 */
export const evaluateElementCondition = (
  conditions: (DesignPlaceholder | RenderCondition)[] | undefined,
  context: ElementFactoryContext,
) => {
  if (!conditions) return true;

  let negate = false;
  for (const condition of conditions) {
    if (condition === RenderCondition.NOT) {
      negate = true;
      continue;
    }

    const met = isConditionMet(condition, context);
    if (negate ? met : !met) return false;
    negate = false;
  }
  return true;
};
