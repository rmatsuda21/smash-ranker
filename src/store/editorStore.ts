import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { EditorTab } from "@/types/top8/Editor";

interface EditorState {
  activeTab: EditorTab | null;
  isSidePanelOpen: boolean;
  isCanvasExpanded: boolean;
  previewCacheVersion: number;
}

type EditorAction =
  | { type: "SET_ACTIVE_TAB"; payload: EditorTab | null }
  | { type: "SET_IS_SIDE_PANEL_OPEN"; payload: boolean }
  | { type: "CLOSE_SIDE_PANEL" }
  | { type: "TOGGLE_CANVAS_EXPANDED" }
  | { type: "INVALIDATE_PREVIEW_CACHE" };

const editorReducer = (
  state: EditorState,
  action: EditorAction
): Partial<EditorState> => {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return {
        activeTab: action.payload,
        isSidePanelOpen: true,
      };
    case "SET_IS_SIDE_PANEL_OPEN":
      return {
        isSidePanelOpen: action.payload,
      };
    case "CLOSE_SIDE_PANEL":
      return {
        isSidePanelOpen: false,
        activeTab: null,
      };
    case "TOGGLE_CANVAS_EXPANDED":
      return { isCanvasExpanded: !state.isCanvasExpanded };
    case "INVALIDATE_PREVIEW_CACHE":
      return { previewCacheVersion: state.previewCacheVersion + 1 };
    default:
      return state;
  }
};

const initialState: EditorState = {
  activeTab: EditorTab.PLAYERS,
  isSidePanelOpen: true,
  isCanvasExpanded: false,
  previewCacheVersion: 0,
};

interface EditorStore extends EditorState {
  dispatch: (action: EditorAction) => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      ...initialState,
      dispatch: (action: EditorAction) =>
        set((state) => editorReducer(state, action), false, action),
    }),
    { name: "EditorStore" }
  )
);
