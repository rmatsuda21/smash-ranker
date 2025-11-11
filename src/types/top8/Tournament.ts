import { PlayerInfo } from "@/types/top8/Player";

export type Tournament = {
  name: string;
  date: string;
  location: string;
  result: PlayerInfo[];
};
