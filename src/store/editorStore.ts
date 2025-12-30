import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { EditorTab } from "@/types/top8/Editor";

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
  activeTab: EditorTab.TOURNAMENT,
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
