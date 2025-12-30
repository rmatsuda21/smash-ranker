export enum EditorTab {
  TOURNAMENT = "tournament",
  PLAYERS = "players",
  DESIGN = "design",
  TEXTS = "texts",
  // PLAYER_EDITOR = "player-editor",
  // ELEMENT_EDITOR = "element-editor",
}

export const EditorTabLabels = {
  [EditorTab.TOURNAMENT]: "Tournament",
  [EditorTab.DESIGN]: "Design",
  [EditorTab.PLAYERS]: "Players",
  [EditorTab.TEXTS]: "Texts",
  // [EditorTab.PLAYER_EDITOR]: "Player Editor",
  // [EditorTab.ELEMENT_EDITOR]: "Element Editor",
} as const;
