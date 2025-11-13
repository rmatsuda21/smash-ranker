import { create } from "zustand";

import { TournamentInfo } from "@/types/top8/Tournament";
interface TournamentState {
  info: TournamentInfo;
  fetching: boolean;
  error: string;
}

type TournamentAction =
  | { type: "SET_TOURNAMENT_NAME"; payload: string }
  | { type: "SET_EVENT_NAME"; payload: string }
  | { type: "SET_DATE"; payload: Date }
  | { type: "SET_LOCATION"; payload: string }
  | { type: "SET_ENTRANTS"; payload: number }
  | { type: "SET_TOURNAMENT_INFO"; payload: TournamentInfo }
  | { type: "SET_FETCHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" };

const tournamentReducer = (
  state: TournamentState,
  action: TournamentAction
): TournamentState => {
  switch (action.type) {
    case "SET_TOURNAMENT_NAME":
      return {
        ...state,
        info: { ...state.info, tournamentName: action.payload },
      };
    case "SET_EVENT_NAME":
      return { ...state, info: { ...state.info, eventName: action.payload } };
    case "SET_DATE":
      return { ...state, info: { ...state.info, date: action.payload } };
    case "SET_LOCATION":
      return { ...state, info: { ...state.info, location: action.payload } };
    case "SET_ENTRANTS":
      return { ...state, info: { ...state.info, entrants: action.payload } };
    case "SET_TOURNAMENT_INFO":
      return { ...state, info: action.payload };
    case "SET_FETCHING":
      return { ...state, fetching: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState: TournamentState = {
  info: {
    tournamentName: `Tournament Name`,
    eventName: `Event Name`,
    date: new Date("1999-11-07"),
    location: `Somewhere, World`,
    entrants: 69,
  },
  fetching: false,
  error: "",
};

interface TournamentStore extends TournamentState {
  dispatch: (action: TournamentAction) => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...initialState,
  dispatch: (action: TournamentAction) =>
    set((state) => tournamentReducer(state, action)),
}));
