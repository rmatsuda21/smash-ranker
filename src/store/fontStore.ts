import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { fetchCatalog } from "@/utils/fonts/catalog";
import {
  loadFamily,
  registerCustomFamily,
  unregisterCustomFamily,
} from "@/utils/fonts/fontLoader";
import { registerCustomFontFace } from "@/utils/top8/registerCustomFont";
import { customFontRepository } from "@/db/repository";
import { useCanvasStore } from "@/store/canvasStore";

const DEFAULT_FONT = "Dela Gothic One";

export type Font = {
  fontFamily: string;
  id?: string;
  weights: number[];
  isCustom?: boolean;
};

interface FontState {
  fonts: Set<Font>;
  selectedFont: string;
  displayedFont: string;
  fetching: boolean;
  error?: Error;
  dispatch: (action: FontAction) => void;
  selectFont: (fontFamily: string, skipHistory?: boolean) => void;
}

type FontAction =
  | { type: "FETCH_FONTS_SUCCESS"; payload: Font[] }
  | { type: "FETCH_FONTS_FAIL"; payload: Error }
  | { type: "SET_SELECTED_FONT"; payload: string }
  | { type: "SET_DISPLAYED_FONT"; payload: string }
  | { type: "ADD_CUSTOM_FONTS"; payload: Font[] }
  | { type: "REMOVE_CUSTOM_FONT"; payload: string };

const fontReducer = (state: FontState, action: FontAction): FontState => {
  switch (action.type) {
    case "FETCH_FONTS_SUCCESS": {
      const customFonts = Array.from(state.fonts).filter((f) => f.isCustom);
      return {
        ...state,
        fetching: false,
        fonts: new Set([...customFonts, ...action.payload]),
        error: undefined,
      };
    }
    case "FETCH_FONTS_FAIL":
      return { ...state, fetching: false, error: action.payload };
    case "SET_SELECTED_FONT":
      return { ...state, selectedFont: action.payload };
    case "SET_DISPLAYED_FONT":
      return { ...state, displayedFont: action.payload };
    case "ADD_CUSTOM_FONTS": {
      const newFamilies = new Set(action.payload.map((f) => f.fontFamily));
      const existing = Array.from(state.fonts).filter(
        (f) => !newFamilies.has(f.fontFamily)
      );
      return {
        ...state,
        fonts: new Set([...action.payload, ...existing]),
      };
    }
    case "REMOVE_CUSTOM_FONT": {
      const fallbackFont = "Noto Sans JP";
      return {
        ...state,
        fonts: new Set(
          Array.from(state.fonts).filter(
            (f) => f.fontFamily !== action.payload
          )
        ),
        selectedFont:
          state.selectedFont === action.payload
            ? fallbackFont
            : state.selectedFont,
        displayedFont:
          state.displayedFont === action.payload
            ? fallbackFont
            : state.displayedFont,
      };
    }
    default:
      return state;
  }
};

const initialState: Omit<FontState, "dispatch" | "selectFont"> = {
  fonts: new Set(),
  selectedFont: DEFAULT_FONT,
  displayedFont: "",
  fetching: true,
  error: undefined,
};

export const useFontStore = create<FontState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      dispatch: (action: FontAction) =>
        set((state) => fontReducer(state, action)),

      selectFont: (fontFamily: string, skipHistory = false) => {
        const { selectedFont: previous, dispatch } = get();
        if (fontFamily === previous) return;

        dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
        useCanvasStore
          .getState()
          .dispatch({ type: "SET_FONT", payload: fontFamily }, skipHistory);

        loadFamily(fontFamily).catch(() => {
          // Failure surfaces visually via the active Canvas/Preview consumer's
          // own load gate; swallow here so we don't trigger an unhandled
          // rejection from a fire-and-forget call.
        });
      },
    }),
    { name: "font-store" }
  )
);

const loadCustomFontsFromDB = async (): Promise<Font[]> => {
  const dbFonts = await customFontRepository.getAll();
  const fonts: Font[] = [];

  for (const dbFont of dbFonts) {
    try {
      await registerCustomFontFace(dbFont.fontFamily, dbFont.data);
      registerCustomFamily(dbFont.fontFamily);
      fonts.push({
        fontFamily: dbFont.fontFamily,
        weights: [400],
        isCustom: true,
      });
    } catch (e) {
      console.warn(`Failed to load custom font "${dbFont.fontFamily}":`, e);
    }
  }

  return fonts;
};

export const removeCustomFont = (fontFamily: string): void => {
  unregisterCustomFamily(fontFamily);
  useFontStore.getState().dispatch({
    type: "REMOVE_CUSTOM_FONT",
    payload: fontFamily,
  });
};

Promise.allSettled([fetchCatalog(), loadCustomFontsFromDB()])
  .then(async ([catalogResult, customResult]) => {
    const dispatch = useFontStore.getState().dispatch;

    const catalogFonts: Font[] =
      catalogResult.status === "fulfilled"
        ? catalogResult.value.map((meta) => ({
            fontFamily: meta.fontFamily,
            id: meta.id,
            weights: meta.weights,
          }))
        : [];
    const customFonts =
      customResult.status === "fulfilled" ? customResult.value : [];

    if (catalogResult.status === "rejected") {
      dispatch({
        type: "FETCH_FONTS_FAIL",
        payload: new Error("Failed to fetch fonts, please refresh the page"),
      });
    } else {
      dispatch({ type: "FETCH_FONTS_SUCCESS", payload: catalogFonts });
    }

    if (customFonts.length > 0) {
      dispatch({ type: "ADD_CUSTOM_FONTS", payload: customFonts });
    }

    const activeFontFamily =
      useCanvasStore.getState().font ||
      useFontStore.getState().selectedFont;

    dispatch({ type: "SET_SELECTED_FONT", payload: activeFontFamily });

    try {
      await loadFamily(activeFontFamily);
    } catch (e) {
      console.warn(`Failed to preload active font "${activeFontFamily}":`, e);
    }
  })
  .catch(() => {
    useFontStore.getState().dispatch({
      type: "FETCH_FONTS_FAIL",
      payload: new Error("Failed to fetch fonts, please refresh the page"),
    });
  });
