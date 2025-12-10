import { create } from "zustand";
import { EditorTab, EditorTabs } from "@/types/top8/EditorTypes";

interface EditorState {
  activeTab: EditorTab;
}

type EditorAction = { type: "SET_ACTIVE_TAB"; payload: EditorTab };

const editorReducer = (
  state: EditorState,
  action: EditorAction
): Partial<EditorState> => {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return {
        activeTab: action.payload,
      };
    default:
      return state;
  }
};

const initialState: EditorState = {
  activeTab: EditorTabs.TOURNAMENT_CONFIG,
};

interface EditorStore extends EditorState {
  dispatch: (action: EditorAction) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,
  dispatch: (action: EditorAction) =>
    set((state) => editorReducer(state, action)),
}));
