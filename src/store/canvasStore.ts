import { create } from "zustand";

type FontStatus = "loading" | "loaded" | "failed";

// TODO: Add layout to config
interface CanvasState {
  size: { width: number; height: number };
  displayScale: number;
  fonts: Record<string, FontStatus>;
  selectedFont: string;
}

type CanvasAction =
  | { type: "SET_SIZE"; payload: { width: number; height: number } }
  | { type: "SET_DISPLAY_SCALE"; payload: number }
  | { type: "LOAD_FONT"; payload: string }
  | { type: "FONT_LOADED"; payload: string }
  | { type: "FONT_FAILED"; payload: string }
  | { type: "SET_SELECTED_FONT"; payload: string };

const initialState: CanvasState = {
  size: { width: 1920, height: 1080 },
  displayScale: 0.5,
  fonts: {},
  selectedFont: "Roboto",
};

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction
): CanvasState => {
  switch (action.type) {
    case "SET_SIZE":
      return { ...state, size: action.payload };
    case "SET_DISPLAY_SCALE":
      return { ...state, displayScale: action.payload };
    case "LOAD_FONT":
      return {
        ...state,
        fonts: { ...state.fonts, [action.payload]: "loading" },
      };
    case "FONT_LOADED":
      return {
        ...state,
        fonts: { ...state.fonts, [action.payload]: "loaded" },
      };
    case "FONT_FAILED":
      return {
        ...state,
        fonts: { ...state.fonts, [action.payload]: "failed" },
      };
    case "SET_SELECTED_FONT":
      return { ...state, selectedFont: action.payload };
    default:
      return state;
  }
};

interface CanvasStore extends CanvasState {
  dispatch: (action: CanvasAction) => void;
}

export const useCanvasStore = create<CanvasStore>()((set) => ({
  ...initialState,
  dispatch: (action: CanvasAction) =>
    set((state) => canvasReducer(state, action)),
}));
