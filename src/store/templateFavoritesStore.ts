import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "@/utils/safeStorage";

export const TEMPLATE_FILTERS = [
  "all",
  "singles",
  "doubles",
  "favorites",
  "saved",
] as const;
export type TemplateFilter = (typeof TEMPLATE_FILTERS)[number];

// What the template picker remembers between visits: favourites, the filter
// it was left on, and which template was loaded last.
interface TemplateFavoritesState {
  /** Favorited template ids (built-in and saved), newest first. */
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  filter: TemplateFilter;
  setFilter: (filter: TemplateFilter) => void;
  /**
   * The template loaded last. The design may have been replaced since by
   * something that is not a template (a reset), so the picker checks it
   * against the current design before marking it.
   */
  activeTemplateId: string | null;
  setActiveTemplateId: (id: string | null) => void;
}

export const useTemplateFavoritesStore = create<TemplateFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      filter: "all",
      setFilter: (filter) => set({ filter }),
      activeTemplateId: null,
      setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),
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
      storage: createJSONStorage(() => safeLocalStorage),
      // Stored values can be corrupted or hand-edited; keep only id strings.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.favoriteIds = Array.isArray(state.favoriteIds)
          ? state.favoriteIds.filter((id) => typeof id === "string")
          : [];
        if (!TEMPLATE_FILTERS.includes(state.filter)) state.filter = "all";
        if (typeof state.activeTemplateId !== "string") {
          state.activeTemplateId = null;
        }
      },
    },
  ),
);
