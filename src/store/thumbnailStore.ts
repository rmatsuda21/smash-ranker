import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_GAME, GAMES } from "@/consts/games";
import { DEFAULT_THUMBNAIL_FONT } from "@/consts/thumbnail/thumbnail";
import type { GameId } from "@/types/Game";
import type {
  ThumbnailEvent,
  ThumbnailLook,
  ThumbnailMatch,
  ThumbnailSet,
  ThumbnailSetFilter,
  ThumbnailSide,
} from "@/types/thumbnail/Thumbnail";
import { getCharacterGame } from "@/utils/top8/characterCatalog";
import {
  filterSets,
  makeSampleMatch,
  pickSetFilter,
} from "@/utils/thumbnail/match";
import {
  safeLocalStorage,
  mergePersisted,
  isRecord,
} from "@/utils/safeStorage";

// What undo and redo restore.
type Snapshot = {
  game: GameId;
  manual: ThumbnailMatch;
  sets: ThumbnailSet[];
  look: ThumbnailLook;
};

type State = Snapshot & {
  // The match being edited: a set of the loaded event, or `manual` when
  // there is no event.
  selectedSetId: string | null;
  filter: ThumbnailSetFilter;
  event: ThumbnailEvent | null;
  past: Snapshot[];
  future: Snapshot[];
};

type Actions = {
  // `key` names the kind of edit: edits with the same key within a second
  // (typing, dragging a colour) are one undo step.
  updateSide: (
    index: 0 | 1,
    patch: Partial<ThumbnailSide>,
    key: string,
  ) => void;
  setRound: (round: string) => void;
  swapSides: () => void;
  setGame: (game: GameId) => void;
  updateLook: (patch: Partial<ThumbnailLook>, key: string) => void;
  selectSet: (id: string) => void;
  setFilter: (filter: ThumbnailSetFilter) => void;
  setIncluded: (ids: string[], included: boolean) => void;
  loadEvent: (payload: {
    event: ThumbnailEvent;
    sets: ThumbnailSet[];
    game: GameId | null;
  }) => void;
  appendSets: (sets: ThumbnailSet[], loadedPages: number) => void;
  clearEvent: () => void;
  undo: () => void;
  redo: () => void;
};

const MAX_HISTORY = 60;
const MERGE_WINDOW_MS = 1000;

// The last recorded edit, to merge a burst of the same edit into one step.
let lastEdit = { key: "", at: 0 };

const snapshot = (state: State): Snapshot => ({
  game: state.game,
  manual: state.manual,
  sets: state.sets,
  look: state.look,
});

const mapCurrentMatch = (
  state: State,
  change: (match: ThumbnailMatch) => ThumbnailMatch,
): Pick<State, "manual" | "sets"> => {
  if (!state.selectedSetId) {
    return { manual: change(state.manual), sets: state.sets };
  }
  return {
    manual: state.manual,
    sets: state.sets.map((set) =>
      set.id === state.selectedSetId ? { ...set, ...change(set) } : set,
    ),
  };
};

// A saved match the painter can draw: it reads both sides without checking.
const isMatch = (value: unknown): boolean =>
  isRecord(value) &&
  Array.isArray(value.sides) &&
  value.sides.length === 2 &&
  value.sides.every((side) => isRecord(side) && isRecord(side.offset));

export const DEFAULT_LOOK: ThumbnailLook = {
  templateId: "split",
  left: "#d9482f",
  right: "#2b5d8a",
  font: DEFAULT_THUMBNAIL_FONT,
  logo: null,
  eventText: "",
};

export const useThumbnailStore = create<State & Actions>()(
  persist(
    (set, get) => {
      // Applies an undoable change, recording where it started from.
      const edit = (key: string, change: (state: State) => Partial<State>) => {
        const state = get();
        const now = Date.now();
        const merge =
          key !== "" &&
          key === lastEdit.key &&
          now - lastEdit.at < MERGE_WINDOW_MS;
        lastEdit = { key, at: now };
        set({
          ...change(state),
          ...(merge
            ? {}
            : {
                past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
                future: [],
              }),
        });
      };

      return {
        game: DEFAULT_GAME,
        manual: makeSampleMatch(DEFAULT_GAME),
        sets: [],
        look: DEFAULT_LOOK,
        selectedSetId: null,
        filter: "all",
        event: null,
        past: [],
        future: [],

        updateSide: (index, patch, key) =>
          edit(`side-${index}-${key}`, (state) =>
            mapCurrentMatch(state, (match) => {
              const sides: ThumbnailMatch["sides"] = [...match.sides];
              sides[index] = { ...sides[index], ...patch };
              return { ...match, sides };
            }),
          ),

        setRound: (round) =>
          edit("round", (state) =>
            mapCurrentMatch(state, (match) => ({ ...match, round })),
          ),

        swapSides: () =>
          edit("", (state) =>
            mapCurrentMatch(state, (match) => ({
              ...match,
              sides: [match.sides[1], match.sides[0]],
            })),
          ),

        setGame: (game) =>
          edit("", (state) => ({
            game,
            // A character from the other game would have no picker to
            // change it in: start the side on the new game's default.
            ...mapCurrentMatch(state, (match) => ({
              ...match,
              sides: match.sides.map((side) =>
                getCharacterGame(side.characterId) === game
                  ? side
                  : {
                      ...side,
                      characterId: GAMES[game].defaultCharacterId,
                      alt: 0,
                    },
              ) as ThumbnailMatch["sides"],
            })),
          })),

        updateLook: (patch, key) =>
          edit(`look-${key}`, (state) => ({
            look: { ...state.look, ...patch },
          })),

        selectSet: (id) => set({ selectedSetId: id }),

        setFilter: (filter) => set({ filter }),

        setIncluded: (ids, included) => {
          const changed = new Set(ids);
          set({
            sets: get().sets.map((item) =>
              changed.has(item.id) ? { ...item, included } : item,
            ),
          });
        },

        loadEvent: ({ event, sets, game }) => {
          const state = get();
          const filter = pickSetFilter(sets);
          lastEdit = { key: "", at: 0 };
          set({
            event,
            sets,
            game: game ?? state.game,
            filter,
            selectedSetId: filterSets(sets, filter)[0]?.id ?? null,
            look: { ...state.look, eventText: event.tournamentName },
            // Undoing across a load would bring back sets of another event.
            past: [],
            future: [],
          });
        },

        appendSets: (sets, loadedPages) => {
          const state = get();
          if (!state.event) return;
          const known = new Set(state.sets.map((item) => item.id));
          set({
            sets: [
              ...state.sets,
              ...sets.filter((item) => !known.has(item.id)),
            ],
            event: { ...state.event, loadedPages },
          });
        },

        clearEvent: () =>
          set({
            event: null,
            sets: [],
            selectedSetId: null,
            filter: "all",
            past: [],
            future: [],
          }),

        undo: () => {
          const state = get();
          const previous = state.past[state.past.length - 1];
          if (!previous) return;
          lastEdit = { key: "", at: 0 };
          set({
            ...previous,
            past: state.past.slice(0, -1),
            future: [snapshot(state), ...state.future],
          });
        },

        redo: () => {
          const state = get();
          const next = state.future[0];
          if (!next) return;
          lastEdit = { key: "", at: 0 };
          set({
            ...next,
            past: [...state.past, snapshot(state)],
            future: state.future.slice(1),
          });
        },
      };
    },
    {
      // A new key: the first editor kept a design tree under
      // "thumbnail-store" that this one cannot read.
      name: "thumbnail-maker",
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      merge: mergePersisted<State>({
        guards: {
          manual: isMatch,
          sets: (value) => Array.isArray(value) && value.every(isMatch),
          selectedSetId: (value) => value === null || typeof value === "string",
          event: (value) => value === null || isRecord(value),
        },
      }),
      // Everything but the undo history.
      partialize: (state) => ({
        game: state.game,
        manual: state.manual,
        sets: state.sets,
        look: state.look,
        selectedSetId: state.selectedSetId,
        filter: state.filter,
        event: state.event,
      }),
    },
  ),
);

// The match on screen. A selected set that is no longer in the list (after
// an undo) falls back to the manual match.
export const selectCurrentMatch = (state: State): ThumbnailMatch =>
  state.sets.find((set) => set.id === state.selectedSetId) ?? state.manual;
