import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TemplateFavoritesState {
  /** Favorited template ids (built-in and saved), newest first. */
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

export const useTemplateFavoritesStore = create<TemplateFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (id) => {
        const { favoriteIds } = get();
        set({
          favoriteIds: favoriteIds.includes(id)
            ? favoriteIds.filter((favoriteId) => favoriteId !== id)
            : [id, ...favoriteIds],
        });
      },
      removeFavorite: (id) => {
        const { favoriteIds } = get();
        if (!favoriteIds.includes(id)) return;
        set({
          favoriteIds: favoriteIds.filter((favoriteId) => favoriteId !== id),
        });
      },
    }),
    {
      name: "template-favorites",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Stored values can be corrupted or hand-edited; keep only id strings.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.favoriteIds = Array.isArray(state.favoriteIds)
          ? state.favoriteIds.filter((id) => typeof id === "string")
          : [];
      },
    },
  ),
);
