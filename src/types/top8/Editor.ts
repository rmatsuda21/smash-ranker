export enum EditorTab {
  PLAYERS = "players",
  DESIGN = "design",
  TEXTS = "texts",
  TOURNAMENT = "tournament",
  // PLAYER_EDITOR = "player-editor",
  // ELEMENT_EDITOR = "element-editor",
}

export const EditorTabLabels = {
  [EditorTab.PLAYERS]: "Players",
  [EditorTab.DESIGN]: "Design",
  [EditorTab.TEXTS]: "Texts",
  [EditorTab.TOURNAMENT]: "Tournament",
  // [EditorTab.PLAYER_EDITOR]: "Player Editor",
  // [EditorTab.ELEMENT_EDITOR]: "Element Editor",
} as const;
