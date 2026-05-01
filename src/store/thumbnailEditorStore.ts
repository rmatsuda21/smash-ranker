import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { useThumbnailStore } from "./thumbnailStore";
import { DEFAULT_GRID_SIZE } from "@/consts/thumbnail/defaults";

export type SidebarTab =
  | "add"
  | "layers"
  | "properties"
  | "templates"
  | "background"
  | "settings";

interface ThumbnailEditorState {
  selectedIds: string[];
  hoveredId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  snapToElements: boolean;
  isEditingTextId: string | null;
  activeSidebarTab: SidebarTab;
  isSidebarOpen: boolean;
  stage: KonvaStage | null;
  setStage: (stage: KonvaStage | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  setHoveredId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSnapToGrid: (value: boolean) => void;
  setGridSize: (value: number) => void;
  setShowGrid: (value: boolean) => void;
  setSnapToElements: (value: boolean) => void;
  setEditingTextId: (id: string | null) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useThumbnailEditorStore = create<ThumbnailEditorState>()(
  devtools(
    (set) => ({
      selectedIds: [],
      hoveredId: null,
      zoom: 1,
      pan: { x: 0, y: 0 },
      snapToGrid: false,
      gridSize: DEFAULT_GRID_SIZE,
      showGrid: false,
      snapToElements: true,
      isEditingTextId: null,
      activeSidebarTab: "add",
      isSidebarOpen: false,
      stage: null,
      setStage: (stage) => set({ stage }),
      setSelectedIds: (selectedIds) => set({ selectedIds }),
      toggleSelectedId: (id) =>
        set((state) => {
          const has = state.selectedIds.includes(id);
          return {
            selectedIds: has
              ? state.selectedIds.filter((i) => i !== id)
              : [...state.selectedIds, id],
          };
        }),
      clearSelection: () => set({ selectedIds: [] }),
      setHoveredId: (hoveredId) => set({ hoveredId }),
      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setGridSize: (gridSize) => set({ gridSize }),
      setShowGrid: (showGrid) => set({ showGrid }),
      setSnapToElements: (snapToElements) => set({ snapToElements }),
      setEditingTextId: (isEditingTextId) => set({ isEditingTextId }),
      setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
    }),
    { name: "thumbnail-editor-store" },
  ),
);

useThumbnailStore.subscribe((state, prev) => {
  if (state.design.elements === prev.design.elements) return;
  const ids = new Set(state.design.elements.map((e) => e.id));
  const editor = useThumbnailEditorStore.getState();
  const filtered = editor.selectedIds.filter((id) => ids.has(id));
  if (filtered.length !== editor.selectedIds.length) {
    editor.setSelectedIds(filtered);
  }
  if (editor.isEditingTextId && !ids.has(editor.isEditingTextId)) {
    editor.setEditingTextId(null);
  }
  if (editor.hoveredId && !ids.has(editor.hoveredId)) {
    editor.setHoveredId(null);
  }
});
