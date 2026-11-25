import type { TournamentDetails } from "@/types/tournament/Tournament";

// "Aug 6 – 9, 2026", in the tournament's own timezone so the days are the
// ones the organizer set.
export const formatTournamentDates = (
  tournament: Pick<TournamentDetails, "startAt" | "endAt" | "timezone">,
  locale: string,
): string => {
  if (tournament.startAt === null) return "";
  const format = (timeZone: string | undefined) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone,
    });
    return tournament.endAt === null
      ? formatter.format(tournament.startAt!)
      : formatter.formatRange(tournament.startAt!, tournament.endAt);
  };
  try {
    return format(tournament.timezone ?? undefined);
  } catch {
    // A timezone name the browser does not know.
    return format(undefined);
  }
};

// "Dulles Expo Center, Baltimore, MD", or null for an online tournament.
export const formatTournamentPlace = (
  tournament: Pick<
    TournamentDetails,
    "isOnline" | "venueName" | "city" | "state" | "countryCode"
  >,
): string | null => {
  const parts = [
    tournament.venueName,
    tournament.city,
    tournament.state ?? (tournament.city ? null : tournament.countryCode),
  ].filter(Boolean);
  if (parts.length === 0 || (tournament.isOnline && !tournament.venueName)) {
    return null;
  }
  return parts.join(", ");
};

// A Google Maps search for the venue, pinned to its place when start.gg
// knows it.
export const mapsLink = (
  tournament: Pick<
    TournamentDetails,
    "venueName" | "venueAddress" | "mapsPlaceId"
  >,
): string | null => {
  const query = tournament.venueAddress || tournament.venueName;
  if (!query) return null;
  const params = new URLSearchParams({ api: "1", query });
  if (tournament.mapsPlaceId) {
    params.set("query_place_id", tournament.mapsPlaceId);
  }
  return `https://www.google.com/maps/search/?${params}`;
};
