import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { Stage } from "konva/lib/Stage";

import { ElementConfig, Design, PlayerDesign } from "@/types/top8/Design";
import { simpleDesign } from "@/designs/simple";

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
      payload: { index: number; config: Partial<PlayerDesign> };
    }
  | { type: "UPDATE_BASE_PLAYER_CONFIG"; payload: Partial<PlayerDesign> }
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
    }
  | {
      type: "UPDATE_TEXT_CONTENT";
      payload: { id: string; value: { text: string; name: string } };
    };

const initialState: CanvasState = {
  design: simpleDesign,
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
          bgAssetId: undefined,
        },
      };
    case "SET_BACKGROUND_IMG":
      return {
        design: {
          ...state.design,
          bgAssetId: action.payload,
        },
      };
    case "UPDATE_COLOR_PALETTE":
      return {
        design: {
          ...state.design,
          colorPalette: {
            ...state.design.colorPalette,
            [action.payload.id]: action.payload.value,
          },
        },
      };
    case "UPDATE_TEXT_CONTENT":
      return {
        design: {
          ...state.design,
          textPalette: {
            ...state.design.textPalette,
            [action.payload.id]: action.payload.value,
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
        version: 2,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          design: state.design,
        }),
        migrate: (persisted, version) => {
          if (version < 2) {
            return { design: simpleDesign };
          }

          if (!persisted || typeof persisted !== "object") {
            return { design: simpleDesign };
          }

          const persistedAny = persisted as { design?: unknown };
          const design: any = persistedAny.design ?? {};

          if (
            !design?.canvasSize?.width ||
            !design?.canvasSize?.height ||
            typeof design?.canvasDisplayScale !== "number"
          ) {
            return { design: simpleDesign };
          }

          return persisted as { design: Design };
        },
      }
    )
  )
);
