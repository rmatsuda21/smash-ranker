export type CharacterAltOverride = {
  cropOffset?: { x: number; y: number };
  cropScale?: number;
};

export type CharacterEntry = {
  // start.gg character id; unique across games.
  id: string;
  name: string;
  nameJa?: string;
  alts: number;
  altNames?: string[];
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  altOverrides?: Record<string, CharacterAltOverride>;
};
