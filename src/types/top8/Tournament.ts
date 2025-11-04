import { PlayerInfo } from "@/types/top8/Result";

export type Tournament = {
  name: string;
  date: string;
  location: string;
  result: PlayerInfo[];
};
