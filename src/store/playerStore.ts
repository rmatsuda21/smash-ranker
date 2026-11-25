import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { applyRenderStyle } from "@/utils/top8/renderStyle";
import { DEFAULT_RENDER_STYLE } from "@/consts/games";
import { RenderStyleId } from "@/types/Game";
import {
  safeLocalStorage,
  mergePersisted,
  isRecord,
} from "@/utils/safeStorage";

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
  // Characters that arrived after the players did, by entrant id.
  | {
      type: "FILL_PLAYER_CHARACTERS";
      payload: Record<
        string,
        { player: CharacerData[]; teammate?: CharacerData[] }
      >;
    }
  | { type: "RESET" };

const hasNoCharacter = ({
  characters,
}: {
  characters: CharacerData[];
}): boolean =>
  characters.length === 0 ||
  (characters.length === 1 && characters[0].id === EMPTY_CHARACTER_ID);

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
    case "FILL_PLAYER_CHARACTERS":
      return {
        players: applyRenderStyle(
          state.players.map((player) => {
            const found = action.payload[player.entrantId];
            if (!found) return player;
            // Only a player still waiting for characters: one the user has
            // given a character in the meantime keeps it.
            const fillPlayer = hasNoCharacter(player);
            const fillTeammate =
              player.teammate &&
              found.teammate &&
              hasNoCharacter(player.teammate);
            if (!fillPlayer && !fillTeammate) return player;

            return {
              ...player,
              ...(fillPlayer && { characters: found.player }),
              ...(fillTeammate && {
                teammate: { ...player.teammate!, characters: found.teammate! },
              }),
            };
          }),
          state.renderStyle,
        ),
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

// A saved player the canvas can draw: it reads `characters` of every player
// and teammate without checking.
const isPlayerList = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every(
    (player) =>
      isRecord(player) &&
      Array.isArray(player.characters) &&
      (player.teammate === undefined ||
        (isRecord(player.teammate) &&
          Array.isArray(player.teammate.characters))),
  );

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
      {
        name: "player-store",
        storage: createJSONStorage(() => safeLocalStorage),
        merge: mergePersisted<PlayerState>({
          guards: { players: isPlayerList },
          transient: ["fetching", "error"],
        }),
      },
    ),
  ),
);
