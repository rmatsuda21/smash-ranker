export type TierCharacter = {
  instanceId: string;
  characterId: string;
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

export type Tier = {
  id: string;
  name: string;
  color: string;
  characterIds: string[];
};

export type ImageDisplayMode = "stock" | "main";

export type TierListLayout = "side" | "top" | "fancy";

export type LabelFont = {
  family: string;
  size: number;
  weight: number;
};
