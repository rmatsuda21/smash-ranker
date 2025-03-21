export type Player = {
  id: string;
  name: string;
  placement: number;
  character: string;
  country?: string;
  twitter?: string;
};

export type Result = Player[];
