import { RenderStyleId } from "@/types/Game";

export type CharacerData = {
  id: string;
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // Which art the full render uses; unset means the standard render. Set by
  // the player store from the graphic's render style, only on characters
  // that have art in that style.
  style?: RenderStyleId;
};

export type PlayerInfo = {
  id: string;
  entrantId: string;
  name: string;
  characters: CharacerData[];
  country?: string;
  customFlagSrc?: string;
  twitter?: string;
  placement: number;
  gamerTag: string;
  prefix?: string;
  avatarImgSrc?: string;
};
