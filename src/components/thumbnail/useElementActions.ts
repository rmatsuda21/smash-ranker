import { useCallback } from "react";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { uuid } from "@/utils/thumbnail/uuid";
import { getSelectedGroupIds } from "@/utils/thumbnail/groups";

export const useElementActions = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);

  const removeIds = useCallback(
    (ids: string[]) => {
      const beforeSnapshot = useThumbnailStore.getState().design.elements;
      dispatch({ type: "REMOVE_ELEMENTS", payload: { ids } });
      const afterSnapshot = useThumbnailStore.getState().design.elements;
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: beforeSnapshot,
        redoData: afterSnapshot,
      });
      clearSelection();
    },
    [clearSelection, dispatch, pushHistory],
  );

  const duplicateIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const before = useThumbnailStore.getState().design.elements;
      dispatch({ type: "DUPLICATE_ELEMENTS", payload: { ids } });
      const after = useThumbnailStore.getState().design.elements;
      const added = after.slice(before.length);
      const addedIds = added.map((el) => el.id);
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: before,
        redoData: after,
      });
      setSelectedIds(addedIds);
    },
    [dispatch, pushHistory, setSelectedIds],
  );

  // Reorder operates on TOP-LEVEL siblings only.
  const reorderTo = useCallback(
    (target: "front" | "back" | "forward" | "backward", ids: string[]) => {
      if (ids.length === 0) return;
      const beforeElements = useThumbnailStore.getState().design.elements;
      const beforeIds = beforeElements.map((e) => e.id);
      const idSet = new Set(ids.filter((id) => beforeIds.includes(id)));
      if (idSet.size === 0) return;
      let nextIds: string[];
      if (target === "front") {
        nextIds = [
          ...beforeIds.filter((id) => !idSet.has(id)),
          ...beforeIds.filter((id) => idSet.has(id)),
        ];
      } else if (target === "back") {
        nextIds = [
          ...beforeIds.filter((id) => idSet.has(id)),
          ...beforeIds.filter((id) => !idSet.has(id)),
        ];
      } else if (target === "forward") {
        nextIds = [...beforeIds];
        for (let i = nextIds.length - 2; i >= 0; i--) {
          if (idSet.has(nextIds[i]) && !idSet.has(nextIds[i + 1])) {
            const tmp = nextIds[i];
            nextIds[i] = nextIds[i + 1];
            nextIds[i + 1] = tmp;
          }
        }
      } else {
        nextIds = [...beforeIds];
        for (let i = 1; i < nextIds.length; i++) {
          if (idSet.has(nextIds[i]) && !idSet.has(nextIds[i - 1])) {
            const tmp = nextIds[i];
            nextIds[i] = nextIds[i - 1];
            nextIds[i - 1] = tmp;
          }
        }
      }
      if (nextIds.every((id, i) => id === beforeIds[i])) return;
      dispatch({ type: "REORDER_ELEMENTS", payload: { ids: nextIds } });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_REORDER",
        undoData: beforeIds,
        redoData: nextIds,
      });
    },
    [dispatch, pushHistory],
  );

  const setVisibility = useCallback(
    (id: string, visible: boolean) => {
      const before = useThumbnailStore.getState().design.elements;
      dispatch({ type: "SET_VISIBILITY", payload: { id, visible } });
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: before,
        redoData: useThumbnailStore.getState().design.elements,
      });
    },
    [dispatch, pushHistory],
  );

  const setLocked = useCallback(
    (id: string, locked: boolean) => {
      const before = useThumbnailStore.getState().design.elements;
      dispatch({ type: "SET_LOCKED", payload: { id, locked } });
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: before,
        redoData: useThumbnailStore.getState().design.elements,
      });
    },
    [dispatch, pushHistory],
  );

  const groupIds = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      const before = useThumbnailStore.getState().design.elements;
      const newGroupId = uuid();
      dispatch({
        type: "GROUP_ELEMENTS",
        payload: { ids, group: { id: newGroupId, name: "Group" } },
      });
      const after = useThumbnailStore.getState().design.elements;
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: before,
        redoData: after,
      });
      setSelectedIds([newGroupId]);
    },
    [dispatch, pushHistory, setSelectedIds],
  );

  const ungroupSelection = useCallback(
    (ids: string[]) => {
      const elements = useThumbnailStore.getState().design.elements;
      const groupIdsToRemove = getSelectedGroupIds(ids, elements);
      if (groupIdsToRemove.length === 0) return;
      const before = elements;
      dispatch({
        type: "UNGROUP_ELEMENTS",
        payload: { groupIds: groupIdsToRemove },
      });
      const after = useThumbnailStore.getState().design.elements;
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: before,
        redoData: after,
      });
    },
    [dispatch, pushHistory],
  );

  return {
    removeIds,
    duplicateIds,
    reorderTo,
    setVisibility,
    setLocked,
    groupIds,
    ungroupSelection,
  };
};
