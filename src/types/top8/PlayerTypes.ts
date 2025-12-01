export type CharacerData = {
  id: string;
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

export type PlayerInfo = {
  id: string;
  name: string;
  characters: CharacerData[];
  country?: string;
  twitter?: string;
  placement: number;
  gamerTag: string;
  prefix?: string;
};
