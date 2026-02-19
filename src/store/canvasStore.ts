import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { Stage } from "konva/lib/Stage";

import { ElementConfig, Design, PlayerDesign } from "@/types/top8/Design";
import { top8erDesign } from "@/designs/top8er";
import {
  useHistoryStore,
  HistoryActionType,
  HistoryEntry,
} from "@/store/historyStore";
import { useFontStore } from "@/store/fontStore";

interface CanvasState {
  design: Design;
  stageRef: Stage | null;
  editable: boolean;
}

export type CanvasAction =
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
  | { type: "SET_BACKGROUND_IMAGE_DARKNESS"; payload: number }
  | {
      type: "UPDATE_COLOR_PALETTE";
      payload: { id: string; value: { color: string; name: string } };
    }
  | {
      type: "UPDATE_TEXT_CONTENT";
      payload: { id: string; value: { text: string; name: string } };
    };

const HISTORY_ACTION_TYPES: Set<string> = new Set([
  "SET_BACKGROUND_IMG",
  "CLEAR_BACKGROUND_IMG",
  "SET_BACKGROUND_IMAGE_DARKNESS",
  "UPDATE_COLOR_PALETTE",
]);

const HISTORY_CLEARING_ACTIONS: Set<string> = new Set(["SET_DESIGN"]);

const initialState: CanvasState = {
  design: top8erDesign,
  stageRef: null,
  editable: false,
};

function captureUndoData(state: CanvasState, action: CanvasAction): unknown {
  switch (action.type) {
    case "SET_BACKGROUND_IMG":
    case "CLEAR_BACKGROUND_IMG":
      return state.design.bgAssetId;
    case "SET_BACKGROUND_IMAGE_DARKNESS":
      return state.design.bgImageDarkness;
    case "UPDATE_COLOR_PALETTE":
      return {
        id: action.payload.id,
        value: state.design.colorPalette?.[action.payload.id],
      };
    default:
      return null;
  }
}

function captureRedoData(action: CanvasAction): unknown {
  switch (action.type) {
    case "CLEAR_BACKGROUND_IMG":
      return undefined;
    case "SET_BACKGROUND_IMG":
    case "SET_BACKGROUND_IMAGE_DARKNESS":
    case "UPDATE_COLOR_PALETTE":
      return action.payload;
    default:
      return null;
  }
}

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction,
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
                  : element,
              ) ?? [],
          },
        },
      };
    case "UPDATE_PLAYER_CONFIG":
      return {
        design: {
          ...state.design,
          players: state.design.players.map((player, index) =>
            index === action.payload.index ? action.payload.config : player,
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
              index === action.payload.index ? action.payload.element : element,
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
    case "SET_BACKGROUND_IMAGE_DARKNESS":
      return {
        design: {
          ...state.design,
          bgImageDarkness: Math.max(0, Math.min(1, action.payload)),
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
  dispatch: (action: CanvasAction, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
}

function applyHistoryEntry(
  state: CanvasState,
  entry: HistoryEntry,
  isUndo: boolean,
): Partial<CanvasState> {
  const data = isUndo ? entry.undoData : entry.redoData;

  switch (entry.type) {
    case "SET_BACKGROUND_IMG":
      return {
        design: {
          ...state.design,
          bgAssetId: data as string | undefined,
        },
      };

    case "CLEAR_BACKGROUND_IMG":
      return {
        design: {
          ...state.design,
          bgAssetId: data as string | undefined,
        },
      };

    case "SET_BACKGROUND_IMAGE_DARKNESS":
      return {
        design: {
          ...state.design,
          bgImageDarkness: Math.max(0, Math.min(1, data as number)),
        },
      };

    case "UPDATE_COLOR_PALETTE": {
      const colorData = data as {
        id: string;
        value?: { color: string; name: string };
      };
      const newPalette = { ...state.design.colorPalette };
      if (colorData.value) {
        newPalette[colorData.id] = colorData.value;
      } else {
        delete newPalette[colorData.id];
      }
      return {
        design: {
          ...state.design,
          colorPalette: newPalette,
        },
      };
    }

    case "SET_FONT": {
      const fontFamily = data as string;
      useFontStore.getState().setSelectedFontFromHistory(fontFamily);
      return state;
    }

    default:
      return state;
  }
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        dispatch: (action: CanvasAction, skipHistory = false) => {
          const state = get();

          if (HISTORY_CLEARING_ACTIONS.has(action.type)) {
            useHistoryStore.getState().clearHistory();
          } else if (!skipHistory && HISTORY_ACTION_TYPES.has(action.type)) {
            const undoData = captureUndoData(state, action);
            const redoData = captureRedoData(action);

            useHistoryStore.getState().pushAction({
              type: action.type as HistoryActionType,
              undoData,
              redoData,
            });
          }

          set((state) => canvasReducer(state, action), false, action);
        },

        undo: () => {
          const entry = useHistoryStore.getState().undo();
          if (entry) {
            set(
              (state) => applyHistoryEntry(state, entry, true),
              false,
              "UNDO",
            );
          }
        },

        redo: () => {
          const entry = useHistoryStore.getState().redo();
          if (entry) {
            set(
              (state) => applyHistoryEntry(state, entry, false),
              false,
              "REDO",
            );
          }
        },
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
            return { design: top8erDesign };
          }

          if (!persisted || typeof persisted !== "object") {
            return { design: top8erDesign };
          }

          const persistedAny = persisted as { design?: unknown };
          const design: any = persistedAny.design ?? {};

          if (
            !design?.canvasSize?.width ||
            !design?.canvasSize?.height ||
            typeof design?.canvasDisplayScale !== "number"
          ) {
            return { design: top8erDesign };
          }

          return persisted as { design: Design };
        },
      },
    ),
  ),
);
