import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

// Designs name their editable texts in English (`textPalette[id].name`), and
// that name is saved with the design. The Texts tab looks the name up here to
// show it in the user's language; a name that is not listed (an older saved
// template) is shown as it is. A new name in a design needs an entry here.
export const TEXT_LABELS: Record<string, MessageDescriptor> = {
  Badge: msg`Badge`,
  "Bottom Text": msg`Bottom Text`,
  "Card Heading": msg`Card Heading`,
  "Champion Label": msg`Champion Label`,
  "Champion Note": msg`Champion Note`,
  City: msg`City`,
  "Country Header": msg`Country Header`,
  Date: msg`Date`,
  "Details (Bottom)": msg`Details (Bottom)`,
  "Details (Top)": msg`Details (Top)`,
  Entrants: msg`Entrants`,
  Event: msg`Event`,
  "Fighters Header": msg`Fighters Header`,
  Footer: msg`Footer`,
  "Header Info": msg`Header Info`,
  Label: msg`Label`,
  Location: msg`Location`,
  "Name Header": msg`Name Header`,
  "Rank Header": msg`Rank Header`,
  "Sound Effect": msg`Sound Effect`,
  "Team Header": msg`Team Header`,
  Title: msg`Title`,
  "Top Center": msg`Top Center`,
  "Top Center Label": msg`Top Center Label`,
  "Top Left": msg`Top Left`,
  "Top Left Label": msg`Top Left Label`,
  "Top Left Text": msg`Top Left Text`,
  "Top Right": msg`Top Right`,
  "Top Right Label": msg`Top Right Label`,
  "Top Right Text": msg`Top Right Text`,
  "Tournament Info": msg`Tournament Info`,
  "Tournament Name": msg`Tournament Name`,
  URL: msg`URL`,
};
