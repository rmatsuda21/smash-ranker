export enum EditorTab {
  TOURNAMENT_CONFIG = "tournament-config",
  PLAYER_FORM = "player-form",
  PLAYER_EDITOR = "player-editor",
  ELEMENT_EDITOR = "element-editor",
  CANVAS_CONFIG = "canvas-config",
}

export const EditorTabLabels = {
  [EditorTab.TOURNAMENT_CONFIG]: "Tournament Config",
  [EditorTab.CANVAS_CONFIG]: "Canvas Config",
  [EditorTab.PLAYER_FORM]: "Player Form",
  [EditorTab.PLAYER_EDITOR]: "Player Editor",
  [EditorTab.ELEMENT_EDITOR]: "Element Editor",
} as const;
