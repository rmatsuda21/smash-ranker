import { PlayerInfo } from "@/types/top8/Player";

export type TournamentInfo = {
  tournamentName: string;
  eventName: string;
  date: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  entrants: number;
  iconSrc?: string;
  url?: string;
  // The id the site's tournament page goes by: start.gg's tournament id, or
  // a Hivee event's id. Missing for a platform with no page.
  startggId?: string;
};

export type Tournament = {
  info: TournamentInfo;
  players: PlayerInfo[];
};
