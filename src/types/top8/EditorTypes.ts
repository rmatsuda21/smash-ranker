export const EditorTabs = {
  TOURNAMENT_CONFIG: "tournament-config",
  PLAYER_FORM: "player-form",
  ELEMENT_EDITOR: "element-editor",
  CANVAS_CONFIG: "canvas-config",
} as const;

export type EditorTab = (typeof EditorTabs)[keyof typeof EditorTabs];
