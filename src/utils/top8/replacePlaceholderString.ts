import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { ElementFactoryContext } from "@/types/top8/ElementFactory";

const formatDate = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return undefined;
  return dateObj.toLocaleDateString();
};

const getPlaceholderMap = (
  context: ElementFactoryContext
): Record<DesignPlaceholder, string | undefined> => {
  const { player, tournament } = context;
  return {
    [DesignPlaceholder.PLAYER_PLACEMENT]: player?.placement?.toString(),
    [DesignPlaceholder.PLAYER_COUNTRY]: player?.country,
    [DesignPlaceholder.PLAYER_NAME]: player?.name,
    [DesignPlaceholder.PLAYER_TAG]: player?.gamerTag,
    [DesignPlaceholder.PLAYER_PREFIX]: player?.prefix,
    [DesignPlaceholder.TOURNAMENT_NAME]: tournament?.tournamentName,
    [DesignPlaceholder.EVENT_NAME]: tournament?.eventName,
    [DesignPlaceholder.TOURNAMENT_DATE]: formatDate(tournament?.date),
    [DesignPlaceholder.TOURNAMENT_LOCATION]: `${tournament?.location.city}, ${
      tournament?.location.state
    }${
      tournament?.location.country ? `, ${tournament?.location.country}` : ""
    }`,
    [DesignPlaceholder.TOURNAMENT_URL]: tournament?.url,
    [DesignPlaceholder.TOURNAMENT_CITY]: tournament?.location.city,
    [DesignPlaceholder.TOURNAMENT_STATE]: tournament?.location.state,
    [DesignPlaceholder.TOURNAMENT_COUNTRY]: tournament?.location.country,
    [DesignPlaceholder.ENTRANTS]: tournament?.entrants?.toString(),
    [DesignPlaceholder.PLAYER_TWITTER]: player?.twitter,
  };
};

export const replacePlaceholders = (
  text: string,
  context: ElementFactoryContext
): string => {
  const map = getPlaceholderMap(context);
  return text.replace(
    /<[^>]+>/g,
    (match) => map[match as DesignPlaceholder] ?? ""
  );
};
