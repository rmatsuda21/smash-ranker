import { create } from "zustand";
import { Stage } from "konva/lib/Stage";

import {
  ElementConfig,
  LayoutConfig,
  PlayerLayoutConfig,
} from "@/types/top8/LayoutTypes";
import { simpleLayout } from "@/layouts/simple";
import { FontStatus } from "@/types/top8/CanvasTypes";

interface CanvasState {
  layout: LayoutConfig;
  fonts: Record<string, FontStatus>;
  selectedFont: string;
  fetchingFont: boolean;
  stageRef: Stage | null;
}

type CanvasAction =
  | { type: "LOAD_FONT"; payload: string }
  | { type: "FONT_LOADED"; payload: string }
  | { type: "FONT_FAILED"; payload: string }
  | { type: "SET_SELECTED_FONT"; payload: string }
  | { type: "SET_FETCHING_FONT"; payload: boolean }
  | { type: "SET_LAYOUT"; payload: LayoutConfig }
  | { type: "SET_STAGE_REF"; payload: Stage | null }
  | { type: "ADD_TOURNAMENT_ELEMENT"; payload: ElementConfig }
  | {
      type: "EDIT_TOURNAMENT_ELEMENT";
      payload: { index: number; element: ElementConfig };
    }
  | {
      type: "UPDATE_PLAYER_CONFIG";
      payload: { index: number; config: PlayerLayoutConfig };
    };

const initialState: CanvasState = {
  fonts: {},
  selectedFont: "Arial",
  fetchingFont: false,
  layout: simpleLayout,
  stageRef: null,
};

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction
): Partial<CanvasState> => {
  switch (action.type) {
    case "LOAD_FONT":
      return {
        fetchingFont: true,
        fonts: { ...state.fonts, [action.payload]: "loading" },
      };
    case "FONT_LOADED":
      return {
        fonts: { ...state.fonts, [action.payload]: "loaded" },
        fetchingFont: false,
      };
    case "FONT_FAILED":
      return {
        fonts: { ...state.fonts, [action.payload]: "failed" },
        fetchingFont: false,
      };
    case "SET_FETCHING_FONT":
      return { fetchingFont: action.payload };
    case "SET_SELECTED_FONT":
      return { selectedFont: action.payload };
    case "SET_LAYOUT":
      return { layout: action.payload };
    case "SET_STAGE_REF":
      return { stageRef: action.payload };
    case "ADD_TOURNAMENT_ELEMENT":
      return {
        layout: {
          ...state.layout,
          tournament: {
            ...state.layout.tournament,
            elements: [
              ...(state.layout.tournament?.elements ?? []),
              action.payload,
            ],
          },
        },
      };
    case "EDIT_TOURNAMENT_ELEMENT":
      return {
        layout: {
          ...state.layout,
          tournament: {
            ...state.layout.tournament,
            elements:
              state.layout.tournament?.elements?.map((element, index) =>
                index === action.payload.index
                  ? action.payload.element
                  : element
              ) ?? [],
          },
        },
      };
    case "UPDATE_PLAYER_CONFIG":
      return {
        layout: {
          ...state.layout,
          players: state.layout.players.map((player, index) =>
            index === action.payload.index ? action.payload.config : player
          ),
        },
      };
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
