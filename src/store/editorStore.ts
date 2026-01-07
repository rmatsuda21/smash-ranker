import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { EditorTab } from "@/types/top8/Editor";

interface EditorState {
  activeTab: EditorTab | null;
  isSidePanelOpen: boolean;
}

type EditorAction =
  | { type: "SET_ACTIVE_TAB"; payload: EditorTab | null }
  | { type: "SET_IS_SIDE_PANEL_OPEN"; payload: boolean }
  | { type: "CLOSE_SIDE_PANEL" };

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
    default:
      return state;
  }
};

const initialState: EditorState = {
  activeTab: EditorTab.PLAYERS,
  isSidePanelOpen: true,
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
