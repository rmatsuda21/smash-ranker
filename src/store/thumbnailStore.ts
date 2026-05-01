import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import {
  GroupElement,
  ThumbnailDesign,
  ThumbnailElement,
} from "@/types/thumbnail/ThumbnailDesign";
import { ThumbnailAction } from "@/types/thumbnail/ThumbnailAction";
import {
  HistoryActionType,
  HistoryEntry,
  useHistoryStore,
} from "@/store/historyStore";
import { vsMatchTemplate } from "@/thumbnails/vsMatch";
import { uuid } from "@/utils/thumbnail/uuid";
import { cloneElement } from "@/utils/thumbnail/cloneElement";
import {
  applyParentTransform,
  computeBoundingBox,
  elementLocalToWorld,
  elementWorldToLocal,
  findElement,
  findElementWithContext,
  flattenTree,
  getAncestors,
  insertIntoTree,
  isDescendantOf,
  removeAndReturn,
  removeElementsFromTree,
  updateElementInTree,
} from "@/utils/thumbnail/elementTree";

interface ThumbnailState {
  design: ThumbnailDesign;
}

const initialState: ThumbnailState = {
  design: vsMatchTemplate(),
};

const HISTORY_CLEARING_ACTIONS = new Set<ThumbnailAction["type"]>([
  "LOAD_DESIGN",
  "RESET",
  "SET_CANVAS_SIZE",
]);

const isGroup = (el: ThumbnailElement): el is GroupElement =>
  el.type === "group";

const reducer = (
  state: ThumbnailState,
  action: ThumbnailAction,
): ThumbnailState => {
  switch (action.type) {
    case "LOAD_DESIGN":
      return { design: action.payload };
    case "RESET":
      return { design: vsMatchTemplate() };
    case "SET_BACKGROUND":
      return { design: { ...state.design, background: action.payload } };
    case "SET_CANVAS_SIZE":
      return { design: { ...state.design, canvasSize: action.payload } };
    case "ADD_ELEMENT":
      return {
        design: {
          ...state.design,
          elements: [...state.design.elements, action.payload],
        },
      };
    case "ADD_ELEMENTS":
      return {
        design: {
          ...state.design,
          elements: [...state.design.elements, ...action.payload],
        },
      };
    case "REMOVE_ELEMENTS": {
      const ids = new Set(action.payload.ids);
      return {
        design: {
          ...state.design,
          elements: removeElementsFromTree(state.design.elements, ids),
        },
      };
    }
    case "UPDATE_ELEMENT":
      return {
        design: {
          ...state.design,
          elements: updateElementInTree(
            state.design.elements,
            action.payload.id,
            action.payload.patch,
          ),
        },
      };
    case "UPDATE_ELEMENTS": {
      let nextElements = state.design.elements;
      for (const { id, patch } of action.payload) {
        nextElements = updateElementInTree(nextElements, id, patch);
      }
      return { design: { ...state.design, elements: nextElements } };
    }
    case "MOVE_ELEMENT": {
      const { id, targetParentId, targetIndex } = action.payload;
      // Capture the source parent BEFORE the removal so we can keep the
      // element's on-canvas position stable across reparenting.
      const sourceCtx = findElementWithContext(state.design.elements, id);
      if (!sourceCtx) return state;
      const sourceParentId = sourceCtx.parent ? sourceCtx.parent.id : null;
      const { tree: withoutMoved, removed } = removeAndReturn(
        state.design.elements,
        id,
      );
      if (!removed) return state;
      // Don't allow moving a group into one of its own descendants.
      if (
        removed.type === "group" &&
        targetParentId &&
        isDescendantOf(removed, targetParentId)
      ) {
        return state;
      }
      let elementToInsert = removed;
      if (sourceParentId !== targetParentId) {
        // Compose ALL source ancestors (immediate parent up to root) so we
        // arrive at true world coords — handles arbitrarily nested groups.
        const sourceAncestors = getAncestors(state.design.elements, id);
        elementToInsert = elementLocalToWorld(elementToInsert, sourceAncestors);

        // Then walk down through the target's ancestor chain (target group +
        // its ancestors) to land in the target parent's local frame.
        if (targetParentId) {
          const targetParent = findElement(withoutMoved, targetParentId);
          if (targetParent && targetParent.type === "group") {
            const targetAncestors = [
              ...getAncestors(withoutMoved, targetParentId),
              targetParent,
            ];
            elementToInsert = elementWorldToLocal(
              elementToInsert,
              targetAncestors,
            );
          }
        }
      }
      const next = insertIntoTree(
        withoutMoved,
        targetParentId,
        targetIndex,
        elementToInsert,
      );
      return { design: { ...state.design, elements: next } };
    }
    case "MOVE_TO_INDEX": {
      const { id, index } = action.payload;
      const ctx = findElementWithContext(state.design.elements, id);
      if (!ctx) return state;
      const siblings = [...ctx.parentChildren];
      const [item] = siblings.splice(ctx.index, 1);
      const clamped = Math.max(0, Math.min(index, siblings.length));
      siblings.splice(clamped, 0, item);
      if (ctx.parent) {
        return {
          design: {
            ...state.design,
            elements: updateElementInTree(state.design.elements, ctx.parent.id, {
              children: siblings,
            } as Partial<ThumbnailElement>),
          },
        };
      }
      return { design: { ...state.design, elements: siblings } };
    }
    case "REORDER_ELEMENTS": {
      // Reorder TOP-LEVEL elements only
      const idToElement = new Map<string, ThumbnailElement>();
      for (const el of state.design.elements) idToElement.set(el.id, el);
      const reordered: ThumbnailElement[] = [];
      const seen = new Set<string>();
      for (const id of action.payload.ids) {
        const el = idToElement.get(id);
        if (el && !seen.has(id)) {
          reordered.push(el);
          seen.add(id);
        }
      }
      const remaining = state.design.elements.filter((e) => !seen.has(e.id));
      return {
        design: {
          ...state.design,
          elements: [...reordered, ...remaining],
        },
      };
    }
    case "DUPLICATE_ELEMENTS": {
      const ids = new Set(action.payload.ids);
      const additions: ThumbnailElement[] = [];
      for (const el of state.design.elements) {
        if (ids.has(el.id)) {
          additions.push(cloneElement(el));
        }
      }
      return {
        design: {
          ...state.design,
          elements: [...state.design.elements, ...additions],
        },
      };
    }
    case "SET_VISIBILITY":
      return {
        design: {
          ...state.design,
          elements: updateElementInTree(state.design.elements, action.payload.id, {
            visible: action.payload.visible,
          } as Partial<ThumbnailElement>),
        },
      };
    case "SET_LOCKED":
      return {
        design: {
          ...state.design,
          elements: updateElementInTree(state.design.elements, action.payload.id, {
            locked: action.payload.locked,
          } as Partial<ThumbnailElement>),
        },
      };
    case "RENAME_ELEMENT":
      return {
        design: {
          ...state.design,
          elements: updateElementInTree(state.design.elements, action.payload.id, {
            name: action.payload.name,
          } as Partial<ThumbnailElement>),
        },
      };
    case "GROUP_ELEMENTS": {
      // Only group TOP-LEVEL siblings.
      const ids = action.payload.ids;
      const top = state.design.elements;
      const toGroup = top.filter((el) => ids.includes(el.id));
      if (toGroup.length < 2) return state;
      const remaining = top.filter((el) => !ids.includes(el.id));
      const bbox = computeBoundingBox(toGroup);
      const groupChildren = toGroup.map(
        (el) => ({ ...el, x: el.x - bbox.x, y: el.y - bbox.y }) as ThumbnailElement,
      );
      const insertIndex = top.findIndex((el) => ids.includes(el.id));
      const newGroup: GroupElement = {
        id: action.payload.group.id,
        name: action.payload.group.name ?? "Group",
        type: "group",
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        scaleX: 1,
        scaleY: 1,
        children: groupChildren,
      };
      const next = [...remaining];
      const adjustedIndex = Math.max(0, Math.min(insertIndex, next.length));
      next.splice(adjustedIndex, 0, newGroup);
      return { design: { ...state.design, elements: next } };
    }
    case "UNGROUP_ELEMENTS": {
      // Dissolve groups at TOP LEVEL only (selecting a group via the layers
      // panel always selects a top-level group; nested groups stay nested).
      const groupIdSet = new Set(action.payload.groupIds);
      const top = state.design.elements;
      const next: ThumbnailElement[] = [];
      for (const el of top) {
        if (el.type === "group" && groupIdSet.has(el.id)) {
          for (const child of el.children) {
            next.push(applyParentTransform(el, child));
          }
        } else {
          next.push(el);
        }
      }
      return { design: { ...state.design, elements: next } };
    }
    case "RENAME_GROUP":
      return {
        design: {
          ...state.design,
          elements: updateElementInTree(state.design.elements, action.payload.id, {
            name: action.payload.name,
          } as Partial<ThumbnailElement>),
        },
      };
    default:
      return state;
  }
};

interface ThumbnailStore extends ThumbnailState {
  dispatch: (action: ThumbnailAction) => void;
  pushHistory: (entry: {
    type: HistoryActionType;
    undoData: unknown;
    redoData: unknown;
  }) => void;
  applyUndo: () => void;
  applyRedo: () => void;
}

type AddPayload = { element: ThumbnailElement; index: number };
type RemovePayload = Array<{ element: ThumbnailElement; index: number }>;
type ReorderPayload = string[];
type BackgroundPayload = ThumbnailDesign["background"];
type UpdatePayload = Array<{ id: string; patch: Partial<ThumbnailElement> }>;
type DuplicatePayload = { addedIds: string[]; clones: ThumbnailElement[] };
type StructuralSnapshot = ThumbnailElement[];

const applyHistoryEntry = (
  state: ThumbnailState,
  entry: HistoryEntry,
  isUndo: boolean,
): ThumbnailState => {
  const data = isUndo ? entry.undoData : entry.redoData;

  switch (entry.type) {
    case "THUMBNAIL_ELEMENT_ADD": {
      const payload = data as AddPayload | null;
      if (isUndo) {
        const undoIds = new Set([
          (entry.redoData as AddPayload).element.id,
        ]);
        return {
          design: {
            ...state.design,
            elements: removeElementsFromTree(state.design.elements, undoIds),
          },
        };
      }
      if (!payload) return state;
      const next = [...state.design.elements];
      const idx = Math.max(0, Math.min(payload.index, next.length));
      next.splice(idx, 0, payload.element);
      return { design: { ...state.design, elements: next } };
    }
    case "THUMBNAIL_ELEMENT_REMOVE": {
      const payload = data as RemovePayload;
      if (isUndo) {
        const next = [...state.design.elements];
        const sorted = [...payload].sort((a, b) => a.index - b.index);
        for (const { element, index } of sorted) {
          const idx = Math.max(0, Math.min(index, next.length));
          next.splice(idx, 0, element);
        }
        return { design: { ...state.design, elements: next } };
      }
      const ids = new Set(payload.map((p) => p.element.id));
      return {
        design: {
          ...state.design,
          elements: removeElementsFromTree(state.design.elements, ids),
        },
      };
    }
    case "THUMBNAIL_ELEMENT_DUPLICATE": {
      const payload = data as DuplicatePayload;
      if (isUndo) {
        const ids = new Set(payload.addedIds);
        return {
          design: {
            ...state.design,
            elements: removeElementsFromTree(state.design.elements, ids),
          },
        };
      }
      return {
        design: {
          ...state.design,
          elements: [...state.design.elements, ...payload.clones],
        },
      };
    }
    case "THUMBNAIL_ELEMENT_UPDATE": {
      const payload = data as UpdatePayload;
      let next = state.design.elements;
      for (const p of payload) {
        next = updateElementInTree(next, p.id, p.patch);
      }
      return { design: { ...state.design, elements: next } };
    }
    case "THUMBNAIL_ELEMENT_REORDER": {
      const ids = data as ReorderPayload;
      const idToElement = new Map<string, ThumbnailElement>();
      for (const el of state.design.elements) idToElement.set(el.id, el);
      const reordered: ThumbnailElement[] = [];
      const seen = new Set<string>();
      for (const id of ids) {
        const el = idToElement.get(id);
        if (el && !seen.has(id)) {
          reordered.push(el);
          seen.add(id);
        }
      }
      const remaining = state.design.elements.filter((e) => !seen.has(e.id));
      return {
        design: {
          ...state.design,
          elements: [...reordered, ...remaining],
        },
      };
    }
    case "THUMBNAIL_BACKGROUND": {
      return {
        design: { ...state.design, background: data as BackgroundPayload },
      };
    }
    case "THUMBNAIL_STRUCTURE": {
      return { design: { ...state.design, elements: data as StructuralSnapshot } };
    }
    default:
      return state;
  }
};

// Migrate from older persisted shape that used flat `groupId` tags + a `groups`
// array to the new tree-based structure. Idempotent.
const migrateFromFlatGroupId = (
  designLike: unknown,
): ThumbnailDesign | null => {
  if (!designLike || typeof designLike !== "object") return null;
  const d = designLike as Record<string, unknown>;
  if (
    typeof (d.canvasSize as { width?: unknown })?.width !== "number" ||
    typeof (d.canvasSize as { height?: unknown })?.height !== "number" ||
    !Array.isArray(d.elements) ||
    !d.background
  ) {
    return null;
  }
  const oldElements = d.elements as Array<Record<string, unknown>>;
  const oldGroups = (d.groups as Array<{ id: string; name?: string }>) ?? [];
  const groupNames = new Map(oldGroups.map((g) => [g.id, g.name ?? "Group"]));

  const groupedById = new Map<
    string,
    Array<{ el: ThumbnailElement; index: number }>
  >();
  const ungroupedWithIndex: Array<{ el: ThumbnailElement; index: number }> = [];

  for (let i = 0; i < oldElements.length; i++) {
    const e = { ...oldElements[i] } as Record<string, unknown>;
    const gid = e.groupId as string | undefined;
    delete e.groupId;
    const el = e as unknown as ThumbnailElement;
    if (gid) {
      const arr = groupedById.get(gid) ?? [];
      arr.push({ el, index: i });
      groupedById.set(gid, arr);
    } else {
      ungroupedWithIndex.push({ el, index: i });
    }
  }

  const newTopLevel: Array<{ el: ThumbnailElement; index: number }> = [
    ...ungroupedWithIndex,
  ];
  for (const [gid, members] of groupedById) {
    if (members.length === 0) continue;
    const justEls = members.map((m) => m.el);
    const bbox = computeBoundingBox(justEls);
    const childrenRel = justEls.map(
      (el) => ({ ...el, x: el.x - bbox.x, y: el.y - bbox.y }) as ThumbnailElement,
    );
    const group: GroupElement = {
      id: gid,
      name: groupNames.get(gid) ?? "Group",
      type: "group",
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      scaleX: 1,
      scaleY: 1,
      children: childrenRel,
    };
    newTopLevel.push({ el: group, index: members[0].index });
  }
  newTopLevel.sort((a, b) => a.index - b.index);

  const result: ThumbnailDesign = {
    id: (d.id as string) ?? uuid(),
    name: (d.name as string) ?? "Untitled",
    canvasSize: d.canvasSize as { width: number; height: number },
    background: d.background as ThumbnailDesign["background"],
    elements: newTopLevel.map((x) => x.el),
  };
  return result;
};

export const useThumbnailStore = create<ThumbnailStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: ThumbnailAction) => {
          set(
            (state) => {
              if (HISTORY_CLEARING_ACTIONS.has(action.type)) {
                useHistoryStore.getState().clearHistory();
              }
              return reducer(state, action);
            },
            false,
            action,
          );
        },
        pushHistory: (entry) => {
          useHistoryStore.getState().pushAction(entry);
        },
        applyUndo: () => {
          const entry = useHistoryStore.getState().undo();
          if (!entry) return;
          set((state) => applyHistoryEntry(state, entry, true), false, "UNDO");
        },
        applyRedo: () => {
          const entry = useHistoryStore.getState().redo();
          if (!entry) return;
          set((state) => applyHistoryEntry(state, entry, false), false, "REDO");
        },
      }),
      {
        name: "thumbnail-store",
        version: 2,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ design: state.design }),
        migrate: (persisted, version) => {
          const fallback = { design: vsMatchTemplate() };
          if (!persisted || typeof persisted !== "object") return fallback;
          const persistedAny = persisted as { design?: unknown };
          if (!persistedAny.design) return fallback;
          if (version < 2) {
            const migrated = migrateFromFlatGroupId(persistedAny.design);
            if (migrated) return { design: migrated };
            return fallback;
          }
          // version 2+: validate shape
          const d = persistedAny.design as Partial<ThumbnailDesign>;
          if (
            !d?.canvasSize?.width ||
            !d?.canvasSize?.height ||
            !Array.isArray(d.elements) ||
            !d.background
          ) {
            return fallback;
          }
          return persisted as { design: ThumbnailDesign };
        },
      },
    ),
  ),
);

export const newDesign = (
  partial?: Partial<ThumbnailDesign>,
): ThumbnailDesign => ({
  id: uuid(),
  name: "Untitled",
  canvasSize: { width: 1280, height: 720 },
  background: { type: "color", color: "#1a1a1a" },
  elements: [],
  ...partial,
});

export const allElementsFlat = (design: ThumbnailDesign) =>
  flattenTree(design.elements);

type ElementSnapshot = Pick<
  ThumbnailElement,
  "id" | "x" | "y" | "width" | "height" | "rotation" | "opacity" | "visible" | "locked"
>;
export type { ElementSnapshot };

export { isGroup };
