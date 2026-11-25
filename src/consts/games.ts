import { msg } from "@lingui/core/macro";

import {
  GameDefinition,
  GameId,
  RenderStyleDefinition,
  RenderStyleId,
} from "@/types/Game";

export const RENDER_STYLES: Record<RenderStyleId, RenderStyleDefinition> = {
  standard: { id: "standard", label: msg`Standard`, assetFolder: "main" },
  mural: { id: "mural", label: msg`Mural`, assetFolder: "mural" },
};

export const DEFAULT_RENDER_STYLE: RenderStyleId = "standard";

// The one place a game is described. Everything that differs by game reads
// it from here (or from the character catalog); nothing else should compare
// against a game id.
export const GAMES: Record<GameId, GameDefinition> = {
  ultimate: {
    id: "ultimate",
    label: msg`Ultimate`,
    startggVideogameId: "1386",
    renderStyles: ["standard", "mural"],
    nameFragments: [
      "smashbros.ultimate",
      "smashbrosultimate",
      "ブラザーズspecial",
      "スマブラsp",
    ],
    hiveeContent: "smash_sp",
    defaultCharacterId: "1293",
    hasPlayerDataset: true,
  },
  melee: {
    id: "melee",
    label: msg`Melee`,
    startggVideogameId: "1",
    renderStyles: ["standard"],
    nameFragments: [
      "smashbros.melee",
      "smashbrosmelee",
      "ブラザーズdx",
      "スマブラdx",
    ],
    defaultCharacterId: "6",
    hasPlayerDataset: false,
  },
};

export const GAME_IDS = Object.keys(GAMES) as GameId[];

// What a tool shows before anything says which game it is working with.
export const DEFAULT_GAME: GameId = "ultimate";
