import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import { PlayerInfo } from "@/types/top8/Player";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { applyRenderStyle } from "@/utils/top8/renderStyle";
import { DEFAULT_RENDER_STYLE } from "@/consts/games";
import { RenderStyleId } from "@/types/Game";

interface PlayerState {
  players: PlayerInfo[];
  // The art the graphic's full renders use. Every action that changes
  // `players` passes them through `applyRenderStyle`, so characters always
  // carry the style and a costume that exists in it.
  renderStyle: RenderStyleId;
  selectedPlayerIndex: number;
  fetching: boolean;
  error: string;
}

type PlayerAction =
  | { type: "SET_PLAYERS"; payload: PlayerInfo[] }
  | { type: "UPDATE_PLAYER"; payload: { index: number; player: PlayerInfo } }
  | { type: "SET_RENDER_STYLE"; payload: RenderStyleId }
  | { type: "SET_SELECTED_PLAYER_INDEX"; payload: number }
  | { type: "CLEAR_SELECTED_PLAYER" }
  | { type: "FETCH_PLAYERS" }
  | { type: "FETCH_PLAYERS_SUCCESS"; payload: PlayerInfo[] }
  | { type: "FETCH_PLAYERS_FAIL"; payload: string }
  | { type: "RESET" };

const playerReducer = (
  state: PlayerState,
  action: PlayerAction,
): Partial<PlayerState> => {
  switch (action.type) {
    case "SET_PLAYERS":
      return { players: applyRenderStyle(action.payload, state.renderStyle) };
    case "UPDATE_PLAYER":
      return {
        players: applyRenderStyle(
          state.players.map((p, i) =>
            i === action.payload.index ? action.payload.player : p,
          ),
          state.renderStyle,
        ),
      };
    case "SET_RENDER_STYLE":
      return {
        renderStyle: action.payload,
        players: applyRenderStyle(state.players, action.payload),
      };
    case "SET_SELECTED_PLAYER_INDEX":
      return { selectedPlayerIndex: action.payload };
    case "CLEAR_SELECTED_PLAYER":
      return { selectedPlayerIndex: -1 };
    case "FETCH_PLAYERS":
      return { fetching: true, error: "" };
    case "FETCH_PLAYERS_SUCCESS":
      return {
        fetching: false,
        players: applyRenderStyle(action.payload, state.renderStyle),
        error: "",
      };
    case "FETCH_PLAYERS_FAIL":
      return { fetching: false, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const defaultPlayers = createSamplePlayers(32);

const initialState: PlayerState = {
  players: defaultPlayers,
  renderStyle: DEFAULT_RENDER_STYLE,
  selectedPlayerIndex: -1,
  fetching: false,
  error: "",
};

interface PlayerStore extends PlayerState {
  dispatch: (action: PlayerAction) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: PlayerAction) =>
          set((state) => playerReducer(state, action), false, action),
      }),
      { name: "player-store", storage: createJSONStorage(() => localStorage) },
    ),
  ),
);
