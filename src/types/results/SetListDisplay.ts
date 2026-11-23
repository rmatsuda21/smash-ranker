// User-facing display preferences for the /results set list. Persisted in
// resultsStore so a player's choice survives reloads and new tournaments.
// "path" is a whole graphic of its own in the exported image (the run drawn as
// a line through the bracket). On the page it uses the compact rows, and the
// card style does not apply to it.
export type SetListLayout = "path" | "versus" | "bracket" | "compact";
export type SetListStyle =
  "default" | "borderedDots" | "scoreline" | "gradientEdge";

export const SET_LIST_LAYOUTS: readonly SetListLayout[] = [
  "path",
  "versus",
  "bracket",
  "compact",
];
export const SET_LIST_STYLES: readonly SetListStyle[] = [
  "default",
  "borderedDots",
  "scoreline",
  "gradientEdge",
];

export const DEFAULT_SET_LIST_LAYOUT: SetListLayout = "path";
export const DEFAULT_SET_LIST_STYLE: SetListStyle = "default";
