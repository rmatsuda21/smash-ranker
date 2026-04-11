import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import { characters } from "@/consts/top8/ultCharacters.json";
import { DEFAULT_PALETTE_ID } from "@/consts/tierlist/tierPalettes";
import {
  ImageDisplayMode,
  LabelFont,
  Tier,
  TierCharacter,
  TierListLayout,
  TitleAlign,
} from "@/types/tierlist/TierList";

interface TierListState {
  tiers: Tier[];
  pool: string[];
  characters: Record<string, TierCharacter>;
  imageMode: ImageDisplayMode;
  tierListWidth: number;
  layout: TierListLayout;
  labelFont: LabelFont;
  title: string;
  titleAlign: TitleAlign;
  activePaletteId: string;
}

type TierListAction =
  | {
      type: "MOVE_CHARACTER";
      instanceId: string;
      toContainer: string;
      toIndex: number;
    }
  | { type: "ADD_TIER"; name: string; color: string }
  | { type: "REMOVE_TIER"; tierId: string }
  | { type: "RENAME_TIER"; tierId: string; name: string }
  | { type: "RECOLOR_TIER"; tierId: string; color: string }
  | { type: "MOVE_TIER"; fromIndex: number; toIndex: number }
  | { type: "SET_CHARACTER_ALT"; instanceId: string; alt: number }
  | { type: "SET_IMAGE_MODE"; mode: ImageDisplayMode }
  | { type: "RESET_ALL" }
  | { type: "CLEAR_TIERS" }
  | { type: "SET_TIER_LIST_WIDTH"; width: number }
  | { type: "SET_LAYOUT"; layout: TierListLayout }
  | { type: "SET_LABEL_FONT"; font: Partial<LabelFont> }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_TITLE_ALIGN"; align: TitleAlign }
  | { type: "APPLY_PALETTE"; paletteId: string; colors: string[] };

const DEFAULT_TIERS: Tier[] = [
  { id: "tier-s", name: "S", color: "#ff7f7f", characterIds: [] },
  { id: "tier-a", name: "A", color: "#ffbf7f", characterIds: [] },
  { id: "tier-b", name: "B", color: "#ffdf7f", characterIds: [] },
  { id: "tier-c", name: "C", color: "#ffff7f", characterIds: [] },
  { id: "tier-d", name: "D", color: "#bfff7f", characterIds: [] },
  { id: "tier-e", name: "E", color: "#7fffff", characterIds: [] },
];

const buildInitialCharacters = (): {
  characters: Record<string, TierCharacter>;
  pool: string[];
} => {
  const charMap: Record<string, TierCharacter> = {};
  const pool: string[] = [];

  for (const char of characters) {
    const instanceId = `char-${char.id}-0`;
    charMap[instanceId] = {
      instanceId,
      characterId: char.id,
      alt: 0,
    };
    pool.push(instanceId);
  }

  return { characters: charMap, pool };
};

const { characters: initialCharacters, pool: initialPool } =
  buildInitialCharacters();

const initialState: TierListState = {
  tiers: DEFAULT_TIERS,
  pool: initialPool,
  characters: initialCharacters,
  imageMode: "stock",
  tierListWidth: 600,
  layout: "side",
  labelFont: { family: "inherit", size: 24, weight: 700 },
  title: "",
  titleAlign: "center",
  activePaletteId: DEFAULT_PALETTE_ID,
};

const removeCharFromContainers = (
  state: TierListState,
  instanceId: string
): TierListState => {
  return {
    ...state,
    tiers: state.tiers.map((tier) => ({
      ...tier,
      characterIds: tier.characterIds.filter((id) => id !== instanceId),
    })),
    pool: state.pool.filter((id) => id !== instanceId),
  };
};

const tierListReducer = (
  state: TierListState,
  action: TierListAction
): Partial<TierListState> => {
  switch (action.type) {
    case "MOVE_CHARACTER": {
      const cleaned = removeCharFromContainers(state, action.instanceId);

      if (action.toContainer === "pool") {
        const newPool = [...cleaned.pool];
        newPool.splice(action.toIndex, 0, action.instanceId);
        return { ...cleaned, pool: newPool };
      }

      const newTiers = cleaned.tiers.map((tier) => {
        if (tier.id === action.toContainer) {
          const newIds = [...tier.characterIds];
          newIds.splice(action.toIndex, 0, action.instanceId);
          return { ...tier, characterIds: newIds };
        }
        return tier;
      });
      return { ...cleaned, tiers: newTiers };
    }

    case "ADD_TIER": {
      const newTier: Tier = {
        id: `tier-${Date.now()}`,
        name: action.name,
        color: action.color,
        characterIds: [],
      };
      return { tiers: [...state.tiers, newTier] };
    }

    case "REMOVE_TIER": {
      const tier = state.tiers.find((t) => t.id === action.tierId);
      if (!tier) return {};
      return {
        tiers: state.tiers.filter((t) => t.id !== action.tierId),
        pool: [...state.pool, ...tier.characterIds],
      };
    }

    case "RENAME_TIER":
      return {
        tiers: state.tiers.map((t) =>
          t.id === action.tierId ? { ...t, name: action.name } : t
        ),
      };

    case "RECOLOR_TIER":
      return {
        tiers: state.tiers.map((t) =>
          t.id === action.tierId ? { ...t, color: action.color } : t
        ),
      };

    case "MOVE_TIER": {
      const newTiers = [...state.tiers];
      const [moved] = newTiers.splice(action.fromIndex, 1);
      newTiers.splice(action.toIndex, 0, moved);
      return { tiers: newTiers };
    }

    case "SET_CHARACTER_ALT": {
      const char = state.characters[action.instanceId];
      if (!char) return {};
      return {
        characters: {
          ...state.characters,
          [action.instanceId]: {
            ...char,
            alt: action.alt as TierCharacter["alt"],
          },
        },
      };
    }

    case "SET_IMAGE_MODE":
      return { imageMode: action.mode };

    case "APPLY_PALETTE": {
      return {
        tiers: state.tiers.map((tier, i) => ({
          ...tier,
          color: action.colors[i] ?? tier.color,
        })),
        activePaletteId: action.paletteId,
      };
    }

    case "RESET_ALL": {
      const { characters: chars, pool } = buildInitialCharacters();
      return {
        tiers: DEFAULT_TIERS,
        pool,
        characters: chars,
        imageMode: "stock",
        title: "",
        titleAlign: "center",
        activePaletteId: DEFAULT_PALETTE_ID,
      };
    }

    case "CLEAR_TIERS": {
      const allTierChars = state.tiers.flatMap((t) => t.characterIds);
      return {
        tiers: state.tiers.map((t) => ({ ...t, characterIds: [] })),
        pool: [...state.pool, ...allTierChars],
      };
    }

    case "SET_TIER_LIST_WIDTH":
      return { tierListWidth: action.width };

    case "SET_LAYOUT":
      return { layout: action.layout };

    case "SET_LABEL_FONT":
      return { labelFont: { ...state.labelFont, ...action.font } };

    case "SET_TITLE":
      return { title: action.title };

    case "SET_TITLE_ALIGN":
      return { titleAlign: action.align };

    default:
      return state;
  }
};

interface TierListStore extends TierListState {
  dispatch: (action: TierListAction) => void;
}

export const useTierListStore = create<TierListStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: TierListAction) =>
          set((state) => tierListReducer(state, action), false, action),
      }),
      {
        name: "tier-list-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tiers: state.tiers,
          pool: state.pool,
          characters: state.characters,
          imageMode: state.imageMode,
          tierListWidth: state.tierListWidth,
          layout: state.layout,
          labelFont: state.labelFont,
          title: state.title,
          titleAlign: state.titleAlign,
          activePaletteId: state.activePaletteId,
        }),
        version: 2,
        migrate: (persisted, version) => {
          const state = persisted as Record<string, unknown>;
          if (version < 2) {
            state.activePaletteId = DEFAULT_PALETTE_ID;
          }
          return state as unknown as TierListStore;
        },
      }
    )
  )
);
