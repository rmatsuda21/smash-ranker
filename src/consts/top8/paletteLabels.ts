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
  msg({ id: "Color 1", message: "Color 1" }),
  msg({ id: "Color 2", message: "Color 2" }),
  msg({ id: "Color 3", message: "Color 3" }),
  msg({ id: "Gradient Start", message: "Gradient Start" }),
  msg({ id: "Gradient End", message: "Gradient End" }),
  msg({ id: "Text", message: "Text" }),
  msg({ id: "Text Shadow", message: "Text Shadow" }),
  msg({ id: "Placement Shadow", message: "Placement Shadow" }),
  msg({ id: "Prefix", message: "Prefix" }),
  msg({ id: "Placement Stroke", message: "Placement Stroke" }),
  msg({ id: "Main BG", message: "Main BG" }),
  msg({ id: "Character Shadow", message: "Character Shadow" }),
  msg({ id: "Card Background", message: "Card Background" }),
  msg({ id: "Left Border", message: "Left Border" }),
  msg({ id: "Top Bar", message: "Top Bar" }),
  // "Background", "Text", "Prefix" already anchored above or elsewhere
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
