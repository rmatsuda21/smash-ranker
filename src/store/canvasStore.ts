import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { Stage } from "konva/lib/Stage";

import { ElementConfig, Design, PlayerConfig } from "@/types/top8/Design";
import { simpleLayout } from "@/layouts/simple";

interface CanvasState {
  design: Design;
  stageRef: Stage | null;
  editable: boolean;
}

type CanvasAction =
  | { type: "SET_DESIGN"; payload: Design }
  | { type: "SET_STAGE_REF"; payload: Stage | null }
  | { type: "ADD_TOURNAMENT_ELEMENT"; payload: ElementConfig }
  | {
      type: "EDIT_TOURNAMENT_ELEMENT";
      payload: { index: number; element: ElementConfig };
    }
  | {
      type: "UPDATE_PLAYER_CONFIG";
      payload: { index: number; config: Partial<PlayerConfig> };
    }
  | { type: "UPDATE_BASE_PLAYER_CONFIG"; payload: Partial<PlayerConfig> }
  | {
      type: "UPDATE_BASE_ELEMENT_CONFIG";
      payload: { index: number; element: ElementConfig };
    }
  | { type: "SET_EDITABLE"; payload: boolean }
  | { type: "CLEAR_BACKGROUND_IMG" }
  | { type: "SET_BACKGROUND_IMG"; payload: string }
  | {
      type: "UPDATE_COLOR_PALETTE";
      payload: { id: string; value: { color: string; name: string } };
    };

const initialState: CanvasState = {
  design: simpleLayout,
  stageRef: null,
  editable: false,
};

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction
): Partial<CanvasState> => {
  switch (action.type) {
    case "SET_DESIGN":
      return { design: action.payload };
    case "SET_STAGE_REF":
      return { stageRef: action.payload };
    case "ADD_TOURNAMENT_ELEMENT":
      return {
        design: {
          ...state.design,
          tournament: {
            ...state.design.tournament,
            elements: [
              ...(state.design.tournament?.elements ?? []),
              action.payload,
            ],
          },
        },
      };
    case "EDIT_TOURNAMENT_ELEMENT":
      return {
        design: {
          ...state.design,
          tournament: {
            ...state.design.tournament,
            elements:
              state.design.tournament?.elements?.map((element, index) =>
                index === action.payload.index
                  ? action.payload.element
                  : element
              ) ?? [],
          },
        },
      };
    case "UPDATE_PLAYER_CONFIG":
      return {
        design: {
          ...state.design,
          players: state.design.players.map((player, index) =>
            index === action.payload.index ? action.payload.config : player
          ),
        },
      };
    case "UPDATE_BASE_PLAYER_CONFIG":
      return {
        design: {
          ...state.design,
          basePlayer: { ...state.design.basePlayer, ...action.payload },
        },
      };
    case "UPDATE_BASE_ELEMENT_CONFIG":
      return {
        design: {
          ...state.design,
          basePlayer: {
            ...state.design.basePlayer,
            elements: state.design.basePlayer.elements.map((element, index) =>
              index === action.payload.index ? action.payload.element : element
            ),
          },
        },
      };
    case "SET_EDITABLE":
      return { editable: action.payload };
    case "CLEAR_BACKGROUND_IMG":
      return {
        design: {
          ...state.design,
          canvas: { ...state.design.canvas, bgAssetId: undefined },
        },
      };
    case "SET_BACKGROUND_IMG":
      return {
        design: {
          ...state.design,
          canvas: { ...state.design.canvas, bgAssetId: action.payload },
        },
      };
    case "UPDATE_COLOR_PALETTE":
      return {
        design: {
          ...state.design,
          canvas: {
            ...state.design.canvas,
            colorPalette: {
              ...state.design.canvas.colorPalette,
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
          layout: state.design,
        }),
      }
    )
  )
);
