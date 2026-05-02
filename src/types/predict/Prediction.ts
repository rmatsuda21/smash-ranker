export type PredictionPlayer = {
  id: string;
  name: string;
  prefix?: string;
  seed: number;
  characterId: string;
  country?: string;
};

export type PredictionCount = 8 | 16 | "custom";
