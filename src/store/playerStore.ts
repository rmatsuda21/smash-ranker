import { create } from "zustand";

import { PlayerInfo } from "@/types/top8/Player";

interface PlayerState {
  players: PlayerInfo[];
  playerOrder: number[];
  selectedPlayerIndex: number;
  fetching: boolean;
  error: string;
}

type PlayerAction =
  | { type: "SET_PLAYERS"; payload: PlayerInfo[] }
  | { type: "UPDATE_PLAYER"; payload: { index: number; player: PlayerInfo } }
  | { type: "SET_PLAYER_ORDER"; payload: number[] }
  | { type: "SET_SELECTED_PLAYER_INDEX"; payload: number }
  | { type: "CLEAR_SELECTED_PLAYER" }
  | { type: "SET_FETCHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "FETCH_PLAYERS" }
  | { type: "FETCH_PLAYERS_SUCCESS"; payload: PlayerInfo[] }
  | { type: "FETCH_PLAYERS_FAIL"; payload: string }
  | { type: "RESET" };

const playerReducer = (
  state: PlayerState,
  action: PlayerAction
): PlayerState => {
  switch (action.type) {
    case "SET_PLAYERS":
      return { ...state, players: action.payload };
    case "UPDATE_PLAYER":
      const playerIndex = state.playerOrder[action.payload.index];
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex ? action.payload.player : p
        ),
      };
    case "SET_PLAYER_ORDER":
      return { ...state, playerOrder: action.payload };
    case "SET_SELECTED_PLAYER_INDEX":
      return { ...state, selectedPlayerIndex: action.payload };
    case "CLEAR_SELECTED_PLAYER":
      return { ...state, selectedPlayerIndex: -1 };
    case "SET_FETCHING":
      return { ...state, fetching: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "FETCH_PLAYERS":
      return { ...state, fetching: true, error: "" };
    case "FETCH_PLAYERS_SUCCESS":
      return { ...state, fetching: false, players: action.payload, error: "" };
    case "FETCH_PLAYERS_FAIL":
      return { ...state, fetching: false, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const DEFAULT_PLAYER: PlayerInfo = {
  id: "0",
  name: "Player Name",
  characters: [{ id: "1293", alt: 0 }],
  placement: 0,
  gamerTag: "Player Name",
  prefix: "",
};

const initialState: PlayerState = {
  players: Array.from({ length: 8 }).map((_, index) => ({
    ...DEFAULT_PLAYER,
    name: `Player ${index + 1}`,
    gamerTag: `Player ${index + 1}`,
    id: index.toString(),
    placement: index + 1,
  })),
  playerOrder: Array.from({ length: 8 }).map((_, index) => index),
  selectedPlayerIndex: -1,
  fetching: false,
  error: "",
};

interface PlayerStore extends PlayerState {
  dispatch: (action: PlayerAction) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,
  dispatch: (action: PlayerAction) =>
    set((state) => playerReducer(state, action)),
}));
