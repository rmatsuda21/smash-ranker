import { msg } from "@lingui/core/macro";

import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import { minimalDarkDesign, minimalLightDesign } from "@/designs/minimal";
import { standingsLightDesign, standingsDarkDesign } from "@/designs/standings";
import { comicBookDesign } from "@/designs/comicBook";
import { neonSignDesign } from "@/designs/neonSign";
import { highScoreDesign } from "@/designs/highScore";
import {
  colourBarsDesign,
  colourBarsMonoDesign,
  colourBarsPastelDesign,
  colourBarsSignalDesign,
} from "@/designs/colourBars";
import { sleeveDesign } from "@/designs/sleeve";
import {
  tapeDesign,
  tapeMintDesign,
  tapeNightDesign,
  tapePinkDesign,
  tapeSkyDesign,
} from "@/designs/tape";
import { kagaribiDesign } from "@/designs/kagaribi";
import { kagaribi16Design } from "@/designs/kagaribi16";
import { kagaribiDoublesDesign } from "@/designs/kagaribiDoubles";
import { tagTeamDesign } from "@/designs/tagTeam";
import { duetDesign } from "@/designs/duet";
import type { Design } from "@/types/top8/Design";
import type { TemplateFamily } from "@/types/top8/TemplateCatalog";

// A colourway's swatch, read from the design so it follows the palette.
const swatch = (
  design: Design,
  ground: string,
  mark: string,
): [string, string] => [
  design.colorPalette?.[ground]?.color ?? "#000",
  design.colorPalette?.[mark]?.color ?? "#fff",
];

// Every built-in template, one entry per card in the picker. A new template
// is a new family; a new colourway or layout of one is a variant of it.
// Variant ids are what favourites and preview images are stored under, so
// they never change.
export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  {
    id: "kagaribi",
    name: msg`Kagaribi`,
    variants: [
      {
        id: "kagaribi",
        name: msg`Original`,
        short: "8",
        design: kagaribiDesign,
        font: "Dela Gothic One",
        mode: "singles",
      },
      {
        id: "kagaribi-16",
        name: msg`16 Player Variant`,
        short: "16",
        design: kagaribi16Design,
        font: "Dela Gothic One",
        mode: "singles",
      },
      {
        id: "kagaribi-doubles",
        name: msg`Doubles`,
        design: kagaribiDoublesDesign,
        font: "Dela Gothic One",
        mode: "doubles",
      },
    ],
  },
  {
    id: "top8er",
    name: msg`Top8er`,
    variants: [
      {
        id: "top8er",
        name: msg`Original`,
        design: top8erDesign,
        font: "Noto Sans JP",
        mode: "singles",
      },
      {
        id: "top8er-squares",
        name: msg`Square Variant`,
        short: msg`Square`,
        design: squaresDesign,
        font: "Noto Sans JP",
        mode: "singles",
      },
    ],
  },
  {
    id: "standings",
    name: msg`Standings`,
    variants: [
      {
        id: "standings-dark",
        name: msg`Dark`,
        design: standingsDarkDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(24, 24, 28)", "rgb(255, 198, 53)"],
      },
      {
        id: "standings-light",
        name: msg`Light`,
        design: standingsLightDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(244, 244, 242)", "rgb(226, 54, 54)"],
      },
    ],
  },
  {
    id: "minimal",
    name: msg`Minimal`,
    variants: [
      {
        id: "minimal-dark",
        name: msg`Dark`,
        design: minimalDarkDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(24, 24, 27)", "rgb(245, 245, 245)"],
      },
      {
        id: "minimal-light",
        name: msg`Light`,
        design: minimalLightDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(245, 245, 245)", "rgb(24, 24, 27)"],
      },
    ],
  },
  {
    id: "tape",
    name: msg`Tape`,
    variants: [
      {
        id: "tape",
        name: msg`Original`,
        design: tapeDesign,
        font: "Dela Gothic One",
        mode: "singles",
        swatch: swatch(tapeDesign, "ground", "ink"),
      },
      {
        id: "tape-mint",
        name: msg`Mint`,
        design: tapeMintDesign,
        font: "Dela Gothic One",
        mode: "singles",
        swatch: swatch(tapeMintDesign, "ground", "ink"),
      },
      {
        id: "tape-sky",
        name: msg`Sky`,
        design: tapeSkyDesign,
        font: "Dela Gothic One",
        mode: "singles",
        swatch: swatch(tapeSkyDesign, "ground", "ink"),
      },
      {
        id: "tape-pink",
        name: msg`Pink`,
        design: tapePinkDesign,
        font: "Dela Gothic One",
        mode: "singles",
        swatch: swatch(tapePinkDesign, "ground", "ink"),
      },
      {
        id: "tape-night",
        name: msg`Night`,
        design: tapeNightDesign,
        font: "Dela Gothic One",
        mode: "singles",
        swatch: swatch(tapeNightDesign, "ground", "ink"),
      },
    ],
  },
  {
    id: "colour-bars",
    name: msg`Colour Bars`,
    variants: [
      {
        id: "colour-bars",
        name: msg`Original`,
        design: colourBarsDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(179, 38, 30)", "rgb(31, 79, 181)"],
      },
      {
        id: "colour-bars-signal",
        name: msg`Signal`,
        design: colourBarsSignalDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(238, 214, 30)", "rgb(44, 208, 222)"],
      },
      {
        id: "colour-bars-pastel",
        name: msg`Pastel`,
        design: colourBarsPastelDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(255, 176, 190)", "rgb(170, 208, 250)"],
      },
      {
        id: "colour-bars-mono",
        name: msg`Mono`,
        design: colourBarsMonoDesign,
        font: "Noto Sans JP",
        mode: "singles",
        swatch: ["rgb(200, 40, 34)", "rgb(96, 96, 100)"],
      },
    ],
  },
  {
    id: "comic-book",
    name: msg`Comic Book`,
    variants: [
      {
        id: "comic-book",
        name: msg`Original`,
        design: comicBookDesign,
        font: "Dela Gothic One",
        mode: "singles",
      },
    ],
  },
  {
    id: "neon-sign",
    name: msg`Neon Sign`,
    variants: [
      {
        id: "neon-sign",
        name: msg`Original`,
        design: neonSignDesign,
        font: "M PLUS Rounded 1c",
        mode: "singles",
      },
    ],
  },
  {
    id: "high-score",
    name: msg`High Score`,
    variants: [
      {
        id: "high-score",
        name: msg`Original`,
        design: highScoreDesign,
        font: "DotGothic16",
        mode: "singles",
      },
    ],
  },
  {
    id: "sleeve",
    name: msg`Sleeve`,
    variants: [
      {
        id: "sleeve",
        name: msg`Original`,
        design: sleeveDesign,
        font: "Noto Sans JP",
        mode: "singles",
      },
    ],
  },
  {
    id: "tag-team",
    name: msg`Tag Team`,
    variants: [
      {
        id: "tag-team",
        name: msg`Doubles`,
        design: tagTeamDesign,
        font: "RocknRoll One",
        mode: "doubles",
      },
    ],
  },
  {
    id: "duet",
    name: msg`Duet`,
    variants: [
      {
        id: "duet",
        name: msg`Doubles`,
        design: duetDesign,
        font: "Shippori Mincho",
        mode: "doubles",
      },
    ],
  },
];
