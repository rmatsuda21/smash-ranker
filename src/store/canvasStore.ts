import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { Stage } from "konva/lib/Stage";

import {
  ElementConfig,
  LayoutConfig,
  PlayerLayoutConfig,
} from "@/types/top8/LayoutTypes";
import { simpleLayout } from "@/layouts/simple";

// TODO: Integrate editable state
interface CanvasState {
  layout: LayoutConfig;
  stageRef: Stage | null;
  editable: boolean;
}

type CanvasAction =
  | { type: "SET_LAYOUT"; payload: LayoutConfig }
  | { type: "SET_STAGE_REF"; payload: Stage | null }
  | { type: "ADD_TOURNAMENT_ELEMENT"; payload: ElementConfig }
  | {
      type: "EDIT_TOURNAMENT_ELEMENT";
      payload: { index: number; element: ElementConfig };
    }
  | {
      type: "UPDATE_PLAYER_CONFIG";
      payload: { index: number; config: Partial<PlayerLayoutConfig> };
    }
  | { type: "UPDATE_BASE_PLAYER_CONFIG"; payload: Partial<PlayerLayoutConfig> }
  | {
      type: "UPDATE_BASE_ELEMENT_CONFIG";
      payload: { index: number; element: ElementConfig };
    }
  | { type: "SET_EDITABLE"; payload: boolean }
  | { type: "CLEAR_BACKGROUND_IMG_SRC" }
  | { type: "SET_BACKGROUND_IMG_SRC"; payload: string }
  | {
      type: "UPDATE_COLOR_PALETTE";
      payload: { id: string; value: { color: string; name: string } };
    };

const initialState: CanvasState = {
  layout: simpleLayout,
  stageRef: null,
  editable: false,
};

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction
): Partial<CanvasState> => {
  switch (action.type) {
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
    case "UPDATE_BASE_PLAYER_CONFIG":
      return {
        layout: {
          ...state.layout,
          basePlayer: { ...state.layout.basePlayer, ...action.payload },
        },
      };
    case "UPDATE_BASE_ELEMENT_CONFIG":
      return {
        layout: {
          ...state.layout,
          basePlayer: {
            ...state.layout.basePlayer,
            elements: state.layout.basePlayer.elements.map((element, index) =>
              index === action.payload.index ? action.payload.element : element
            ),
          },
        },
      };
    case "SET_EDITABLE":
      return { editable: action.payload };
    case "CLEAR_BACKGROUND_IMG_SRC":
      return {
        layout: {
          ...state.layout,
          canvas: { ...state.layout.canvas, backgroundImgSrc: undefined },
        },
      };
    case "SET_BACKGROUND_IMG_SRC":
      return {
        layout: {
          ...state.layout,
          canvas: { ...state.layout.canvas, backgroundImgSrc: action.payload },
        },
      };
    case "UPDATE_COLOR_PALETTE":
      return {
        layout: {
          ...state.layout,
          canvas: {
            ...state.layout.canvas,
            colorPalette: {
              ...state.layout.canvas.colorPalette,
              [action.payload.id]: action.payload.value,
            },
          },
        },
      };
    default:
      return state;
  }
};

interface CanvasStore extends CanvasState {
  dispatch: (action: CanvasAction) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: CanvasAction) =>
          set((state) => canvasReducer(state, action), false, action),
      }),
      {
        name: "canvas-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          layout: state.layout,
        }),
      }
    )
  )
);
