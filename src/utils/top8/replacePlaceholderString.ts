import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { ElementFactoryContext } from "@/types/top8/ElementFactory";

// One shared formatter: constructing one per call (which is what
// `toLocaleDateString` does) is far slower than formatting.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDate = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return undefined;
  return DATE_FORMAT.format(dateObj);
};

/** The value a single placeholder stands for, or `undefined` when the data
 *  is missing. Only the placeholder asked for is computed. */
const resolvePlaceholder = (
  placeholder: string,
  { player, tournament }: ElementFactoryContext,
): string | undefined => {
  switch (placeholder) {
    case DesignPlaceholder.PLAYER_PLACEMENT:
      return player?.placement?.toString();
    case DesignPlaceholder.PLAYER_COUNTRY:
      return player?.country;
    case DesignPlaceholder.PLAYER_NAME:
      return player?.name;
    case DesignPlaceholder.PLAYER_TAG:
      return player?.gamerTag;
    case DesignPlaceholder.PLAYER_PREFIX:
      return player?.prefix;
    case DesignPlaceholder.PLAYER_TWITTER:
      return player?.twitter;
    case DesignPlaceholder.TOURNAMENT_NAME:
      return tournament?.tournamentName;
    case DesignPlaceholder.EVENT_NAME:
      return tournament?.eventName;
    case DesignPlaceholder.TOURNAMENT_DATE:
      return formatDate(tournament?.date);
    case DesignPlaceholder.TOURNAMENT_LOCATION:
      return [
        tournament?.location.city,
        tournament?.location.state,
        tournament?.location.country,
      ]
        .filter(Boolean)
        .join(", ");
    case DesignPlaceholder.TOURNAMENT_URL:
      return tournament?.url;
    case DesignPlaceholder.TOURNAMENT_CITY:
      return tournament?.location.city;
    case DesignPlaceholder.TOURNAMENT_STATE:
      return tournament?.location.state;
    case DesignPlaceholder.TOURNAMENT_COUNTRY:
      return tournament?.location.country;
    case DesignPlaceholder.ENTRANTS:
      return tournament?.entrants?.toString();
    default:
      return undefined;
  }
};

export const replacePlaceholders = (
  text: string,
  context: ElementFactoryContext,
): string => {
  // Most strings have no placeholder at all.
  if (!text.includes("<")) return text;

  return text.replace(
    /<[^>]+>/g,
    (match) => resolvePlaceholder(match, context) ?? "",
  );
};
