import { TournamentInfo } from "@/types/top8/Tournament";

/** The made-up tournament shown before one is loaded, and in template
 *  previews and goldens. */
export const SAMPLE_TOURNAMENT: TournamentInfo = {
  tournamentName: "Harbor Clash 12",
  eventName: "Ultimate Singles",
  date: new Date(2026, 10, 21).toISOString(),
  location: {
    city: "Yokohama",
    state: "Kanagawa",
    country: "JP",
  },
  entrants: 128,
  url: "https://start.gg/harbor-clash-12",
};
