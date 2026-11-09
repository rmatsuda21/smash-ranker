// User-facing display preferences for the /results set list. Persisted in
// resultsStore so a player's choice survives reloads and new tournaments.
export type SetListLayout = "versus" | "bracket" | "compact";
export type SetListStyle =
  "default" | "borderedDots" | "scoreline" | "gradientEdge";

export const SET_LIST_LAYOUTS: readonly SetListLayout[] = [
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

export const DEFAULT_SET_LIST_LAYOUT: SetListLayout = "versus";
export const DEFAULT_SET_LIST_STYLE: SetListStyle = "default";
