import { useEffect } from "react";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { NUDGE_PX, NUDGE_PX_LARGE } from "@/consts/thumbnail/defaults";
import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import { uuid } from "@/utils/thumbnail/uuid";
import { getSelectedGroupIds } from "@/utils/thumbnail/groups";
import {
  findElement,
  flattenTree,
} from "@/utils/thumbnail/elementTree";

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
};

export const KeyboardShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const editorState = useThumbnailEditorStore.getState();
      const storeState = useThumbnailStore.getState();
      if (editorState.isEditingTextId) return;
      if (isEditableElement(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;
      const { selectedIds } = editorState;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          storeState.applyRedo();
        } else {
          storeState.applyUndo();
        }
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        storeState.applyRedo();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const before = storeState.design.elements;
        storeState.dispatch({
          type: "DUPLICATE_ELEMENTS",
          payload: { ids: selectedIds },
        });
        const after = useThumbnailStore.getState().design.elements;
        const added = after.slice(before.length);
        const addedIds = added.map((el) => el.id);
        storeState.pushHistory({
          type: "THUMBNAIL_STRUCTURE",
          undoData: before,
          redoData: after,
        });
        editorState.setSelectedIds(addedIds);
        return;
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        editorState.setSelectedIds(
          storeState.design.elements
            .filter((el) => !el.locked && el.visible)
            .map((el) => el.id),
        );
        return;
      }
      if (meta && e.key.toLowerCase() === "g" && !e.shiftKey) {
        if (selectedIds.length < 2) return;
        e.preventDefault();
        const before = storeState.design.elements;
        const newGroupId = uuid();
        storeState.dispatch({
          type: "GROUP_ELEMENTS",
          payload: {
            ids: selectedIds,
            group: { id: newGroupId, name: "Group" },
          },
        });
        const after = useThumbnailStore.getState().design.elements;
        storeState.pushHistory({
          type: "THUMBNAIL_STRUCTURE",
          undoData: before,
          redoData: after,
        });
        editorState.setSelectedIds([newGroupId]);
        return;
      }
      if (meta && e.key.toLowerCase() === "g" && e.shiftKey) {
        const elements = storeState.design.elements;
        const groupIdsToRemove = getSelectedGroupIds(selectedIds, elements);
        if (groupIdsToRemove.length === 0) return;
        e.preventDefault();
        const before = elements;
        storeState.dispatch({
          type: "UNGROUP_ELEMENTS",
          payload: { groupIds: groupIdsToRemove },
        });
        const after = useThumbnailStore.getState().design.elements;
        storeState.pushHistory({
          type: "THUMBNAIL_STRUCTURE",
          undoData: before,
          redoData: after,
        });
        return;
      }
      if (meta && (e.key === "]" || e.key === "[")) {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const beforeIds = storeState.design.elements.map((el) => el.id);
        const idSet = new Set(selectedIds.filter((id) => beforeIds.includes(id)));
        if (idSet.size === 0) return;
        const nextIds =
          e.key === "]"
            ? [
                ...beforeIds.filter((id) => !idSet.has(id)),
                ...beforeIds.filter((id) => idSet.has(id)),
              ]
            : [
                ...beforeIds.filter((id) => idSet.has(id)),
                ...beforeIds.filter((id) => !idSet.has(id)),
              ];
        if (nextIds.every((id, i) => id === beforeIds[i])) return;
        storeState.dispatch({
          type: "REORDER_ELEMENTS",
          payload: { ids: nextIds },
        });
        storeState.pushHistory({
          type: "THUMBNAIL_ELEMENT_REORDER",
          undoData: beforeIds,
          redoData: nextIds,
        });
        return;
      }

      if (e.key === "Escape") {
        editorState.clearSelection();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        const before = storeState.design.elements;
        storeState.dispatch({
          type: "REMOVE_ELEMENTS",
          payload: { ids: selectedIds },
        });
        const after = useThumbnailStore.getState().design.elements;
        storeState.pushHistory({
          type: "THUMBNAIL_STRUCTURE",
          undoData: before,
          redoData: after,
        });
        editorState.clearSelection();
        return;
      }

      const arrowDelta: { dx: number; dy: number } | null =
        e.key === "ArrowLeft"
          ? { dx: -1, dy: 0 }
          : e.key === "ArrowRight"
            ? { dx: 1, dy: 0 }
            : e.key === "ArrowUp"
              ? { dx: 0, dy: -1 }
              : e.key === "ArrowDown"
                ? { dx: 0, dy: 1 }
                : null;
      if (arrowDelta && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? NUDGE_PX_LARGE : NUDGE_PX;
        const elementsAll = flattenTree(storeState.design.elements);
        const elementMap = new Map(elementsAll.map((el) => [el.id, el]));
        const updates = selectedIds
          .map((id) => {
            const el = elementMap.get(id) ?? findElement(storeState.design.elements, id);
            return el
              ? {
                  id,
                  patch: {
                    x: el.x + arrowDelta.dx * step,
                    y: el.y + arrowDelta.dy * step,
                  } as Partial<ThumbnailElement>,
                }
              : null;
          })
          .filter((x): x is { id: string; patch: Partial<ThumbnailElement> } =>
            Boolean(x),
          );
        const undo = updates.map((u) => {
          const el = elementMap.get(u.id)!;
          return { id: u.id, patch: { x: el.x, y: el.y } };
        });
        storeState.dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
        storeState.pushHistory({
          type: "THUMBNAIL_ELEMENT_UPDATE",
          undoData: undo,
          redoData: updates,
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
};
