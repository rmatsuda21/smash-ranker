import { PlayerInfo } from "@/types/top8/Player";

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
