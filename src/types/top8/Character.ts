export type CharacterAltOverride = {
  cropOffset?: { x: number; y: number };
  cropScale?: number;
};

// A character's art in a render style other than the standard one. Only
// some costumes may exist, and the poses differ, so it has its own crop.
export type CharacterRenderSet = {
  // The costumes that have art, as standard alt numbers, ascending.
  alts: number[];
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  altOverrides?: Record<string, CharacterAltOverride>;
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
