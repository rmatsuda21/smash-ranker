import { PlayerInfo } from "@/types/top8/PlayerTypes";

export type TournamentInfo = {
  tournamentName: string;
  eventName: string;
  date: Date;
  location: string;
  entrants: number;
};

export type Tournament = {
  info: TournamentInfo;
  players: PlayerInfo[];
};
