import { create } from "zustand";

import { PlayerInfo } from "@/types/top8/PlayerTypes";

interface PlayerState {
  players: PlayerInfo[];
  selectedPlayerIndex: number;
  fetching: boolean;
  error: string;
}

type PlayerAction =
  | { type: "SET_PLAYERS"; payload: PlayerInfo[] }
  | { type: "UPDATE_PLAYER"; payload: { index: number; player: PlayerInfo } }
  | { type: "SET_SELECTED_PLAYER_INDEX"; payload: number }
  | { type: "CLEAR_SELECTED_PLAYER" }
  | { type: "FETCH_PLAYERS" }
  | { type: "FETCH_PLAYERS_SUCCESS"; payload: PlayerInfo[] }
  | { type: "FETCH_PLAYERS_FAIL"; payload: string }
  | { type: "RESET" };

const playerReducer = (
  state: PlayerState,
  action: PlayerAction
): Partial<PlayerState> => {
  switch (action.type) {
    case "SET_PLAYERS":
      return { players: action.payload };
    case "UPDATE_PLAYER":
      return {
        players: state.players.map((p, i) =>
          i === action.payload.index ? action.payload.player : p
        ),
      };
    case "SET_SELECTED_PLAYER_INDEX":
      return { selectedPlayerIndex: action.payload };
    case "CLEAR_SELECTED_PLAYER":
      return { selectedPlayerIndex: -1 };
    case "FETCH_PLAYERS":
      return { fetching: true, error: "" };
    case "FETCH_PLAYERS_SUCCESS":
      return { fetching: false, players: action.payload, error: "" };
    case "FETCH_PLAYERS_FAIL":
      return { fetching: false, error: action.payload };
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
  players: new Array(8).fill(null).map((_, index) => ({
    ...DEFAULT_PLAYER,
    name: `Player ${index + 1}`,
    gamerTag: `Player ${index + 1}`,
    id: index.toString(),
    placement: index + 1,
  })),
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
