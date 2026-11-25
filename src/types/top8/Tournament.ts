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
  // start.gg's tournament id, when the tournament was loaded from there.
  startggId?: string;
};

export type Tournament = {
  info: TournamentInfo;
  players: PlayerInfo[];
};
