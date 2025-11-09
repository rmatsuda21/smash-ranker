import { create } from "zustand";

interface CanvasState {
  size: { width: number; height: number };
  displayScale: number;
}

type CanvasAction =
  | { type: "SET_SIZE"; payload: { width: number; height: number } }
  | { type: "SET_DISPLAY_SCALE"; payload: number };

const initialState: CanvasState = {
  size: { width: 1920, height: 1080 },
  displayScale: 0.5,
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
