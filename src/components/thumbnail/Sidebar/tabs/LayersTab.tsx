import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaChevronDown,
  FaChevronRight,
  FaCircle,
  FaEye,
  FaEyeSlash,
  FaFlag,
  FaFont,
  FaGripVertical,
  FaImage,
  FaLayerGroup,
  FaLock,
  FaLockOpen,
  FaObjectUngroup,
  FaPersonRays,
  FaSquare,
  FaTrophy,
} from "react-icons/fa6";
import cn from "classnames";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import {
  GroupElement,
  ThumbnailElement,
} from "@/types/thumbnail/ThumbnailDesign";
import { useElementActions } from "@/components/thumbnail/useElementActions";
import {
  findElement,
  findElementWithContext,
  isDescendantOf,
} from "@/utils/thumbnail/elementTree";

import styles from "./LayersTab.module.scss";

const TYPE_ICONS: Record<
  Exclude<ThumbnailElement["type"], "shape" | "group">,
  React.ComponentType
> = {
  text: FaFont,
  image: FaImage,
  character: FaPersonRays,
  flag: FaFlag,
  tournamentIcon: FaTrophy,
};

const labelFor = (el: ThumbnailElement) => {
  if (el.name) return el.name;
  if (el.type === "text") return el.text || "Text";
  if (el.type === "character") return `Character (${el.characterId})`;
  if (el.type === "flag") return `Flag (${el.country})`;
  if (el.type === "shape") return el.shape === "circle" ? "Circle" : "Rectangle";
  if (el.type === "group") return "Group";
  return el.type;
};

const iconFor = (el: ThumbnailElement): React.ComponentType => {
  if (el.type === "shape") return el.shape === "circle" ? FaCircle : FaSquare;
  if (el.type === "group") return FaLayerGroup;
  return TYPE_ICONS[el.type] ?? FaSquare;
};

const ElementRow = ({
  element,
  depth,
}: {
  element: ThumbnailElement;
  depth: number;
}) => {
  const sortable = useSortable({ id: element.id });
  const selectedIds = useThumbnailEditorStore((s) => s.selectedIds);
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);
  const toggleSelectedId = useThumbnailEditorStore(
    (s) => s.toggleSelectedId,
  );
  const setActiveSidebarTab = useThumbnailEditorStore(
    (s) => s.setActiveSidebarTab,
  );
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(element.name ?? "");

  const Icon = iconFor(element);
  const isSelected = selectedIds.includes(element.id);

  const onClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      toggleSelectedId(element.id);
    } else {
      setSelectedIds([element.id]);
      setActiveSidebarTab("properties");
    }
  };

  const commitRename = () => {
    setIsRenaming(false);
    if (draftName !== (element.name ?? "")) {
      dispatch({
        type: "RENAME_ELEMENT",
        payload: { id: element.id, name: draftName },
      });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_UPDATE",
        undoData: [{ id: element.id, patch: { name: element.name } }],
        redoData: [{ id: element.id, patch: { name: draftName } }],
      });
    }
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "SET_VISIBILITY",
      payload: { id: element.id, visible: !element.visible },
    });
    pushHistory({
      type: "THUMBNAIL_ELEMENT_UPDATE",
      undoData: [{ id: element.id, patch: { visible: element.visible } }],
      redoData: [{ id: element.id, patch: { visible: !element.visible } }],
    });
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "SET_LOCKED",
      payload: { id: element.id, locked: !element.locked },
    });
    pushHistory({
      type: "THUMBNAIL_ELEMENT_UPDATE",
      undoData: [{ id: element.id, patch: { locked: element.locked } }],
      redoData: [{ id: element.id, patch: { locked: !element.locked } }],
    });
  };

  return (
    <div
      ref={sortable.setNodeRef}
      className={cn(styles.row, {
        [styles.selected]: isSelected,
      })}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
        marginLeft: depth * 18,
      }}
      onClick={onClick}
      onDoubleClick={() => {
        setDraftName(element.name ?? labelFor(element));
        setIsRenaming(true);
      }}
    >
      <span
        className={styles.handle}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <FaGripVertical />
      </span>
      <span className={styles.typeIcon}>
        <Icon />
      </span>
      {isRenaming ? (
        <input
          autoFocus
          className={styles.name}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={styles.name}>{labelFor(element)}</span>
      )}
      <button
        className={styles.iconButton}
        onClick={toggleVisibility}
        type="button"
        aria-label={element.visible ? "Hide" : "Show"}
      >
        {element.visible ? <FaEye /> : <FaEyeSlash />}
      </button>
      <button
        className={styles.iconButton}
        onClick={toggleLock}
        type="button"
        aria-label={element.locked ? "Unlock" : "Lock"}
      >
        {element.locked ? <FaLock /> : <FaLockOpen />}
      </button>
    </div>
  );
};

const GroupRow = ({
  group,
  depth,
  collapsed,
  onToggleCollapse,
}: {
  group: GroupElement;
  depth: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) => {
  const sortable = useSortable({ id: group.id });
  const selectedIds = useThumbnailEditorStore((s) => s.selectedIds);
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);
  const toggleSelectedId = useThumbnailEditorStore(
    (s) => s.toggleSelectedId,
  );
  const setActiveSidebarTab = useThumbnailEditorStore(
    (s) => s.setActiveSidebarTab,
  );
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const actions = useElementActions();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name ?? "Group");

  const isSelected = selectedIds.includes(group.id);

  const onClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      toggleSelectedId(group.id);
    } else {
      setSelectedIds([group.id]);
      setActiveSidebarTab("properties");
    }
  };

  const commitRename = () => {
    setIsRenaming(false);
    if (draftName !== (group.name ?? "")) {
      dispatch({
        type: "RENAME_ELEMENT",
        payload: { id: group.id, name: draftName },
      });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_UPDATE",
        undoData: [{ id: group.id, patch: { name: group.name } }],
        redoData: [{ id: group.id, patch: { name: draftName } }],
      });
    }
  };

  return (
    <div
      ref={sortable.setNodeRef}
      className={cn(styles.row, styles.group, {
        [styles.selected]: isSelected,
      })}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
        marginLeft: depth * 18,
      }}
      onClick={onClick}
      onDoubleClick={() => {
        setDraftName(group.name ?? "Group");
        setIsRenaming(true);
      }}
    >
      <span
        className={styles.handle}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <FaGripVertical />
      </span>
      <button
        type="button"
        className={styles.collapseButton}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <FaChevronRight /> : <FaChevronDown />}
      </button>
      <span className={styles.typeIcon}>
        <FaLayerGroup />
      </span>
      {isRenaming ? (
        <input
          autoFocus
          className={styles.name}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={styles.name}>
          {group.name ?? "Group"} ({group.children.length})
        </span>
      )}
      <button
        className={styles.iconButton}
        onClick={(e) => {
          e.stopPropagation();
          actions.ungroupSelection([group.id]);
        }}
        type="button"
        aria-label="Ungroup"
        title="Ungroup"
      >
        <FaObjectUngroup />
      </button>
    </div>
  );
};

const renderTree = (
  elements: ThumbnailElement[],
  depth: number,
  collapsed: Set<string>,
  setCollapsed: React.Dispatch<React.SetStateAction<Set<string>>>,
): React.ReactNode[] => {
  // top-of-canvas-first = reversed
  const reversed = [...elements].reverse();
  const out: React.ReactNode[] = [];
  for (const el of reversed) {
    if (el.type === "group") {
      const isCollapsed = collapsed.has(el.id);
      out.push(
        <GroupRow
          key={el.id}
          group={el}
          depth={depth}
          collapsed={isCollapsed}
          onToggleCollapse={() =>
            setCollapsed((prev) => {
              const next = new Set(prev);
              if (next.has(el.id)) next.delete(el.id);
              else next.add(el.id);
              return next;
            })
          }
        />,
      );
      if (!isCollapsed) {
        out.push(...renderTree(el.children, depth + 1, collapsed, setCollapsed));
      }
    } else {
      out.push(<ElementRow key={el.id} element={el} depth={depth} />);
    }
  }
  return out;
};

// Build the flat list of IDs that's currently visible in the layers panel,
// in the order they're rendered (top-of-canvas first). Used as the
// SortableContext's items array.
const buildVisibleFlatIds = (
  elements: ThumbnailElement[],
  collapsed: Set<string>,
): string[] => {
  const out: string[] = [];
  const walk = (els: ThumbnailElement[]) => {
    const reversed = [...els].reverse();
    for (const el of reversed) {
      out.push(el.id);
      if (el.type === "group" && !collapsed.has(el.id)) {
        walk(el.children);
      }
    }
  };
  walk(elements);
  return out;
};

export const LayersTab = () => {
  const elements = useThumbnailStore((s) => s.design.elements);
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const sortableIds = useMemo(
    () => buildVisibleFlatIds(elements, collapsedGroups),
    [elements, collapsedGroups],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);

      const beforeElements = elements;
      const sourceCtx = findElementWithContext(beforeElements, activeId);
      if (!sourceCtx) return;
      const overEl = findElement(beforeElements, overId);
      if (!overEl) return;

      // Don't allow moving a group into itself / its descendants.
      if (
        sourceCtx.element.type === "group" &&
        isDescendantOf(sourceCtx.element, overId)
      ) {
        return;
      }

      let targetParentId: string | null;
      let targetIndex: number;

      // Drop ON a group ROW = move INTO the group (at top of its visual stack).
      // Skipped when the user is reordering within their existing group — in
      // that case we want to treat the group's row as "out of group" landing.
      if (
        overEl.type === "group" &&
        sourceCtx.element.id !== overEl.id &&
        sourceCtx.parent?.id !== overEl.id
      ) {
        targetParentId = overEl.id;
        targetIndex = overEl.children.length;
      } else {
        const overCtx = findElementWithContext(beforeElements, overId);
        if (!overCtx) return;
        targetParentId = overCtx.parent ? overCtx.parent.id : null;

        // Determine "above" vs "below" using visual positions in the
        // sortableIds list. If active was BELOW over (higher visual idx) and
        // dragged UP, drop it ABOVE over visually. Otherwise drop BELOW.
        const activeVis = sortableIds.indexOf(activeId);
        const overVis = sortableIds.indexOf(overId);
        const placeAbove = activeVis > overVis;

        // Account for the upcoming removal: if active is in the same parent
        // and BELOW over in the data array, removing active drops over's
        // index by 1.
        let overIndexAfterRemoval = overCtx.index;
        if (
          sourceCtx.parent?.id === overCtx.parent?.id &&
          sourceCtx.index < overCtx.index
        ) {
          overIndexAfterRemoval -= 1;
        }

        // Above visually = higher z-order = higher data index
        targetIndex = placeAbove
          ? overIndexAfterRemoval + 1
          : overIndexAfterRemoval;
      }

      // No-op detection
      if (
        sourceCtx.parent?.id === targetParentId &&
        sourceCtx.index === targetIndex
      ) {
        return;
      }

      dispatch({
        type: "MOVE_ELEMENT",
        payload: { id: activeId, targetParentId, targetIndex },
      });
      const afterElements = useThumbnailStore.getState().design.elements;
      pushHistory({
        type: "THUMBNAIL_STRUCTURE",
        undoData: beforeElements,
        redoData: afterElements,
      });
    },
    [elements, sortableIds, dispatch, pushHistory],
  );

  if (elements.length === 0) {
    return <div className={styles.empty}>No elements yet.</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.list}>
          {renderTree(elements, 0, collapsedGroups, setCollapsedGroups)}
        </div>
      </SortableContext>
    </DndContext>
  );
};
