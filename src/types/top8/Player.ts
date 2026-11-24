import { RenderStyleId } from "@/types/Game";

export type CharacerData = {
  id: string;
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // Which art the full render uses; unset means the standard render. Set by
  // the player store from the graphic's render style, only on characters
  // that have art in that style.
  style?: RenderStyleId;
};

// The second player of a doubles team. The team's entrant, placement and
// slot belong to the `PlayerInfo` that holds it.
export type TeammateInfo = {
  name: string;
  gamerTag: string;
  prefix?: string;
  characters: CharacerData[];
  country?: string;
  customFlagSrc?: string;
  twitter?: string;
  avatarImgSrc?: string;
};

// Which player of a team an element draws; the first one when unset.
export type TeamMember = "player" | "teammate";

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
  // Doubles: the other player of the team.
  teammate?: TeammateInfo;
};
