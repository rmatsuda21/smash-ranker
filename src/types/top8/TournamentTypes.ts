import { PlayerInfo } from "@/types/top8/PlayerTypes";

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
  iconAssetId?: string;
};

export type Tournament = {
  info: TournamentInfo;
  players: PlayerInfo[];
};
