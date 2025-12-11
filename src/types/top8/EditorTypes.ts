export const EditorTabs = {
  TOURNAMENT_CONFIG: "tournament-config",
  PLAYER_FORM: "player-form",
  PLAYER_EDITOR: "player-editor",
  ELEMENT_EDITOR: "element-editor",
  CANVAS_CONFIG: "canvas-config",
} as const;

export const EditorTabLabels = {
  [EditorTabs.TOURNAMENT_CONFIG]: "Tournament Config",
  [EditorTabs.PLAYER_FORM]: "Player Form",
  [EditorTabs.PLAYER_EDITOR]: "Player Editor",
  [EditorTabs.ELEMENT_EDITOR]: "Element Editor",
  [EditorTabs.CANVAS_CONFIG]: "Canvas Config",
} as const;

export type EditorTab = (typeof EditorTabs)[keyof typeof EditorTabs];
