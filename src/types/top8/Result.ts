export type PlayerInfo = {
  id: string;
  name: string;
  character: string;
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  country?: string;
  twitter?: string;
};

export type Result = PlayerInfo[];
