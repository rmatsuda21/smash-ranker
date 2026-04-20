/**
 * Extraction anchors for template palette labels.
 *
 * Lingui requires source-level `msg` calls so that `bun extract` includes
 * these strings in the PO catalogs and `bun compile` ships them to the runtime.
 *
 * Explicit `id` values are set to match the raw strings used in templates,
 * so that `<Trans id={name} />` can look them up at runtime.
 *
 * When adding, removing, or renaming a palette label in a template,
 * update this list to match, then run `bun extract && bun compile`.
 */
import { msg } from "@lingui/core/macro";

export const paletteLabels = [
  // Color palette names
  msg({ id: "Primary", message: "Primary" }),
  msg({ id: "Secondary", message: "Secondary" }),
  msg({ id: "Background", message: "Background" }),
  msg({ id: "Smash Ball", message: "Smash Ball" }),
  msg({ id: "Background Dark", message: "Background Dark" }),
  msg({ id: "Background Red", message: "Background Red" }),
  msg({ id: "Background Gray", message: "Background Gray" }),
  msg({ id: "BG Gradient Start", message: "BG Gradient Start" }),
  msg({ id: "BG Gradient End", message: "BG Gradient End" }),
  msg({ id: "Text", message: "Text" }),
  msg({ id: "Text Shadow", message: "Text Shadow" }),
  msg({ id: "Placement Shadow", message: "Placement Shadow" }),
  msg({ id: "Prefix Text", message: "Prefix Text" }),
  msg({ id: "Placement Stroke", message: "Placement Stroke" }),
  msg({ id: "Player Background", message: "Player Background" }),
  msg({ id: "Player Text", message: "Player Text" }),
  msg({ id: "Character Shadow", message: "Character Shadow" }),
  msg({ id: "Card Background", message: "Card Background" }),
  msg({ id: "Left Border", message: "Left Border" }),
  msg({ id: "Top Bar", message: "Top Bar" }),
  msg({ id: "Player BG", message: "Player BG" }),
  msg({ id: "Character BG", message: "Character BG" }),
  msg({ id: "Character Border", message: "Character Border" }),

  // Color palette groups
  msg({ id: "Theme", message: "Theme" }),
  // "Background" and "Text" already anchored above
  msg({ id: "Player", message: "Player" }),

  // Text palette names
  msg({ id: "Top Left Text", message: "Top Left Text" }),
  msg({ id: "Top Right Text", message: "Top Right Text" }),
  msg({ id: "Bottom Text", message: "Bottom Text" }),
  msg({ id: "Title", message: "Title" }),
  msg({ id: "Date", message: "Date" }),
  msg({ id: "Location", message: "Location" }),
  msg({ id: "Entrants", message: "Entrants" }),
  msg({ id: "URL", message: "URL" }),
  msg({ id: "Tournament Name", message: "Tournament Name" }),
  msg({ id: "Tournament Info", message: "Tournament Info" }),
];
