import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useShallow } from "zustand/react/shallow";

import {
  FaArrowDown,
  FaArrowUp,
  FaClone,
  FaEye,
  FaEyeSlash,
  FaLayerGroup,
  FaLock,
  FaLockOpen,
  FaObjectGroup,
  FaObjectUngroup,
  FaTrash,
} from "react-icons/fa6";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import {
  computeSnap,
  computeTransformSnap,
  SnapGuide,
} from "@/utils/thumbnail/snapping";
import {
  expandSelectionToGroups,
  getSelectedGroupIds,
} from "@/utils/thumbnail/groups";
import { findElement } from "@/utils/thumbnail/elementTree";
import {
  ContextMenu,
  ContextMenuItem,
} from "@/components/thumbnail/ContextMenu/ContextMenu";
import { useElementActions } from "@/components/thumbnail/useElementActions";

import { BackgroundLayer } from "./BackgroundLayer";
import { ElementsLayer } from "./ElementsLayer";
import { GuidesLayer } from "./GuidesLayer";
import { TransformerLayer } from "./TransformerLayer";
import { InlineTextEditor } from "./InlineTextEditor";
import { useStageGestures } from "./useStageGestures";

import styles from "./Canvas.module.scss";

type ElementSnapshot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type SnapBoundBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

const VIEWPORT_PADDING = 40;

export const Canvas = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<KonvaTransformer>(null);
  const [stage, setStage] = useState<KonvaStage | null>(null);
  const setStageInStore = useThumbnailEditorStore((s) => s.setStage);
  const stageRef = useCallback(
    (node: KonvaStage | null) => {
      setStage(node);
      setStageInStore(node);
    },
    [setStageInStore],
  );

  const design = useThumbnailStore((s) => s.design);
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);

  const selectedIds = useThumbnailEditorStore(
    useShallow((s) => s.selectedIds),
  );
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);
  const setActiveSidebarTab = useThumbnailEditorStore(
    (s) => s.setActiveSidebarTab,
  );
  const zoom = useThumbnailEditorStore((s) => s.zoom);
  const setZoom = useThumbnailEditorStore((s) => s.setZoom);
  const pan = useThumbnailEditorStore((s) => s.pan);
  const setPan = useThumbnailEditorStore((s) => s.setPan);
  const showGrid = useThumbnailEditorStore((s) => s.showGrid);
  const gridSize = useThumbnailEditorStore((s) => s.gridSize);
  const snapToGrid = useThumbnailEditorStore((s) => s.snapToGrid);
  const snapToElements = useThumbnailEditorStore((s) => s.snapToElements);
  const isEditingTextId = useThumbnailEditorStore((s) => s.isEditingTextId);
  const setEditingTextId = useThumbnailEditorStore((s) => s.setEditingTextId);

  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetIds: string[];
  } | null>(null);
  const dragSnapshots = useRef<Map<string, ElementSnapshot>>(new Map());

  const actions = useElementActions();

  // For selection / lookup we only need TOP-LEVEL elements; selection always
  // resolves to a top-level node (a group, or an ungrouped element).
  const topLevelById = useMemo(() => {
    const m = new Map<string, ThumbnailElement>();
    for (const el of design.elements) m.set(el.id, el);
    return m;
  }, [design.elements]);

  // For looking up any element (including children of groups).
  const findById = useCallback(
    (id: string) => findElement(design.elements, id),
    [design.elements],
  );

  // Auto-fit zoom on mount and on viewport resize
  const handleFit = useCallback(() => {
    const v = viewportRef.current;
    if (!v) return;
    const availW = v.clientWidth - VIEWPORT_PADDING * 2;
    const availH = v.clientHeight - VIEWPORT_PADDING * 2;
    if (availW <= 0 || availH <= 0) return;
    const scale = Math.min(
      availW / design.canvasSize.width,
      availH / design.canvasSize.height,
    );
    setZoom(Math.max(0.1, Math.min(2, scale)));
    setPan({ x: 0, y: 0 });
  }, [design.canvasSize.width, design.canvasSize.height, setZoom, setPan]);

  useLayoutEffect(() => {
    handleFit();
    const v = viewportRef.current;
    if (!v) return;
    const obs =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => requestAnimationFrame(handleFit))
        : null;
    if (obs) obs.observe(v);
    return () => obs?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.canvasSize.width, design.canvasSize.height]);

  useStageGestures({
    containerRef: viewportRef,
    zoom,
    pan,
    setZoom,
    setPan,
  });

  // ---- Selection ----

  const handleStageClickOrTap = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (e.target === e.target.getStage()) {
        clearSelection();
        setEditingTextId(null);
      }
    },
    [clearSelection, setEditingTextId],
  );

  const handleNodeClick = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const target = e.target;
      const stageNode = target.getStage();
      if (!stageNode || target === stageNode) return;
      const id = target.name();
      if (!id || !findById(id)) return;
      const isShift =
        "shiftKey" in e.evt && (e.evt as MouseEvent).shiftKey;
      e.cancelBubble = true;
      const expanded = expandSelectionToGroups([id], design.elements);
      if (isShift) {
        const current = new Set(selectedIds);
        const allIn = expanded.every((eid) => current.has(eid));
        if (allIn) {
          for (const eid of expanded) current.delete(eid);
        } else {
          for (const eid of expanded) current.add(eid);
        }
        setSelectedIds(Array.from(current));
      } else {
        setSelectedIds(expanded);
        setActiveSidebarTab("properties");
      }
    },
    [
      design.elements,
      findById,
      selectedIds,
      setSelectedIds,
      setActiveSidebarTab,
    ],
  );

  const handleDoubleClick = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const target = e.target;
      const id = target.name();
      const el = findById(id);
      if (el && el.type === "text" && !el.locked) {
        setSelectedIds([id]);
        setEditingTextId(id);
      }
    },
    [findById, setSelectedIds, setEditingTextId],
  );

  // ---- Drag with snap ----

  const handleDragStart = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const target = e.target;
      const id = target.name();
      if (!id) return;
      // The dragged Konva node is always a top-level element (groups are
      // single draggable Konva.Group nodes; ungrouped elements are direct).
      const expanded = expandSelectionToGroups([id], design.elements);
      const ids = selectedIds.includes(id)
        ? Array.from(new Set([...selectedIds, ...expanded]))
        : expanded;
      if (
        ids.length !== selectedIds.length ||
        !ids.every((i) => selectedIds.includes(i))
      ) {
        setSelectedIds(ids);
      }
      dragSnapshots.current.clear();
      const stageNode = target.getStage();
      if (!stageNode) return;
      for (const sid of ids) {
        const el = topLevelById.get(sid);
        if (!el) continue;
        dragSnapshots.current.set(sid, {
          id: sid,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
        });
      }
    },
    [design.elements, topLevelById, selectedIds, setSelectedIds],
  );

  const handleDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const target = e.target;
      const id = target.name();
      const el = topLevelById.get(id);
      if (!el) return;

      const stageNode = target.getStage();
      if (!stageNode) return;

      const activeSnap = dragSnapshots.current.get(id);
      const movingIds = activeSnap
        ? Array.from(dragSnapshots.current.keys())
        : [id];

      const others = design.elements
        .filter((o) => !movingIds.includes(o.id) && o.visible)
        .map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));

      const result = computeSnap({
        active: {
          x: target.x(),
          y: target.y(),
          width: el.width,
          height: el.height,
        },
        others,
        canvasSize: design.canvasSize,
        snapToGrid,
        gridSize,
        snapToElements,
      });

      if (result.dx !== 0) target.x(target.x() + result.dx);
      if (result.dy !== 0) target.y(target.y() + result.dy);
      setGuides(result.guides);

      // Multi-select drag: move the other top-level selected nodes by the
      // same delta. (Group internals stay attached to their Konva.Group.)
      if (activeSnap) {
        const activeDx = target.x() - activeSnap.x;
        const activeDy = target.y() - activeSnap.y;
        for (const sid of movingIds) {
          if (sid === id) continue;
          const sibSnap = dragSnapshots.current.get(sid);
          if (!sibSnap) continue;
          const sibNode = stageNode.findOne(`#${sid}`);
          if (!sibNode) continue;
          sibNode.x(sibSnap.x + activeDx);
          sibNode.y(sibSnap.y + activeDy);
        }
      }
    },
    [
      design.canvasSize,
      design.elements,
      topLevelById,
      gridSize,
      snapToElements,
      snapToGrid,
    ],
  );

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const target = e.target;
      const id = target.name();
      if (!id) return;
      setGuides([]);

      // Collect updates and history snapshot for all moved nodes
      const stageNode = target.getStage();
      if (!stageNode) return;

      const updates: Array<{
        id: string;
        patch: Partial<ThumbnailElement>;
      }> = [];
      const undo: Array<{ id: string; patch: Partial<ThumbnailElement> }> = [];
      const redo: Array<{ id: string; patch: Partial<ThumbnailElement> }> = [];

      const ids =
        selectedIds.includes(id) && selectedIds.length > 0
          ? selectedIds
          : [id];

      for (const sid of ids) {
        const node = stageNode.findOne(`#${sid}`);
        const snap = dragSnapshots.current.get(sid);
        if (!node || !snap) continue;
        const newX = node.x();
        const newY = node.y();
        if (newX === snap.x && newY === snap.y) continue;
        // For circles we set x/y to center; convert back to top-left
        const el = topLevelById.get(sid);
        if (!el) continue;
        let patchX = newX;
        let patchY = newY;
        if (el.type === "shape" && el.shape === "circle") {
          patchX = newX - el.width / 2;
          patchY = newY - el.height / 2;
        } else if (el.type === "character" && el.flipX) {
          patchX = newX - el.width;
        }
        updates.push({ id: sid, patch: { x: patchX, y: patchY } });
        undo.push({ id: sid, patch: { x: snap.x, y: snap.y } });
        redo.push({ id: sid, patch: { x: patchX, y: patchY } });
      }

      dragSnapshots.current.clear();
      if (updates.length === 0) return;
      dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_UPDATE",
        undoData: undo,
        redoData: redo,
      });
    },
    [dispatch, topLevelById, pushHistory, selectedIds],
  );

  // ---- Transform with snap ----

  const transformSnapshots = useRef<Map<string, ThumbnailElement>>(new Map());

  const handleTransformStart = useCallback(() => {
    transformSnapshots.current.clear();
    for (const id of selectedIds) {
      const el = topLevelById.get(id);
      if (el) transformSnapshots.current.set(id, el);
    }
  }, [topLevelById, selectedIds]);

  // Snap during transform — only meaningful for single-element transforms in
  // canvas-space (the bbox passed to boundBoxFunc is in stage coords). Multi-
  // select transforms still work, just without snapping.
  const transformBoundBoxFunc = useCallback(
    (oldBox: SnapBoundBox, newBox: SnapBoundBox): SnapBoundBox => {
      if (selectedIds.length !== 1) return newBox;
      const activeId = selectedIds[0];
      const others = design.elements
        .filter((o) => o.id !== activeId && o.visible)
        .map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
      const result = computeTransformSnap({
        oldBox,
        newBox,
        others,
        canvasSize: design.canvasSize,
        snapToGrid,
        gridSize,
        snapToElements,
      });
      setGuides(result.guides);
      return result.box;
    },
    [
      design.canvasSize,
      design.elements,
      gridSize,
      selectedIds,
      snapToElements,
      snapToGrid,
    ],
  );

  const handleTransformEnd = useCallback(() => {
    setGuides([]);
    if (!stage) return;
    const updates: Array<{ id: string; patch: Partial<ThumbnailElement> }> =
      [];
    const undo: Array<{ id: string; patch: Partial<ThumbnailElement> }> = [];
    const redo: Array<{ id: string; patch: Partial<ThumbnailElement> }> = [];
    for (const id of selectedIds) {
      const node = stage.findOne(`#${id}`);
      const before = transformSnapshots.current.get(id);
      if (!node || !before) continue;
      const sx = node.scaleX();
      const sy = node.scaleY();
      let newX = node.x();
      let newY = node.y();
      const newRotation = node.rotation();

      // Groups keep their scale on the node — children render in group-local
      // coords and inherit the group transform via Konva.Group.
      if (before.type === "group") {
        const patch: Partial<ThumbnailElement> = {
          x: newX,
          y: newY,
          rotation: newRotation,
          scaleX: sx,
          scaleY: sy,
        };
        updates.push({ id, patch });
        undo.push({
          id,
          patch: {
            x: before.x,
            y: before.y,
            rotation: before.rotation,
            scaleX: before.scaleX ?? 1,
            scaleY: before.scaleY ?? 1,
          } as Partial<ThumbnailElement>,
        });
        redo.push({ id, patch });
        continue;
      }

      const newWidth = before.width * Math.abs(sx);
      let newHeight = before.height * Math.abs(sy);
      // Reset scale on the node back to 1, since width/height are committed
      node.scaleX(1);
      node.scaleY(1);

      if (before.type === "shape" && before.shape === "circle") {
        newX = node.x() - newWidth / 2;
        newY = node.y() - newHeight / 2;
      } else if (before.type === "character" && before.flipX) {
        newX = node.x() - newWidth;
      }

      const patch: Partial<ThumbnailElement> = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        rotation: newRotation,
      };
      updates.push({ id, patch });
      const undoPatch: Partial<ThumbnailElement> = {
        x: before.x,
        y: before.y,
        width: before.width,
        height: before.height,
        rotation: before.rotation,
      };
      undo.push({ id, patch: undoPatch });
      redo.push({ id, patch });
    }
    transformSnapshots.current.clear();
    if (updates.length === 0) return;
    dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
    pushHistory({
      type: "THUMBNAIL_ELEMENT_UPDATE",
      undoData: undo,
      redoData: redo,
    });
  }, [dispatch, pushHistory, selectedIds, stage]);

  // ---- Inline text editor ----

  const editingElement = isEditingTextId != null ? findById(isEditingTextId) : null;
  const editingTextElement =
    editingElement && editingElement.type === "text" ? editingElement : null;

  // Compute the editing text's WORLD transform (canvas-space), which may differ
  // from element.x/y when the text is nested inside a group. We read from the
  // Konva node so any parent group's transform is automatically composed.
  const editingWorldTransform = useMemo(() => {
    if (!editingTextElement || !stage) return null;
    const node = stage.findOne(`#${editingTextElement.id}`);
    if (!node) return null;
    const pos = node.getAbsolutePosition();
    const scale = node.getAbsoluteScale();
    return {
      x: pos.x,
      y: pos.y,
      rotation: node.getAbsoluteRotation(),
      scaleX: scale.x,
      scaleY: scale.y,
    };
  }, [editingTextElement, stage]);

  const handleCommitText = (text: string) => {
    if (!editingTextElement) return;
    if (text !== editingTextElement.text) {
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { id: editingTextElement.id, patch: { text } },
      });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_UPDATE",
        undoData: [
          { id: editingTextElement.id, patch: { text: editingTextElement.text } },
        ],
        redoData: [{ id: editingTextElement.id, patch: { text } }],
      });
    }
    setEditingTextId(null);
  };

  // Stage onMouseDown / onTouchStart attaches per-node handlers; per-node click is what we use
  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Right-click is handled by the native contextmenu listener; don't change
      // selection here, otherwise multi-select gets collapsed before the menu opens.
      if ("button" in e.evt && (e.evt as MouseEvent).button === 2) {
        return;
      }
      if (e.target === e.target.getStage()) {
        clearSelection();
        setEditingTextId(null);
      } else {
        handleNodeClick(e);
      }
    },
    [clearSelection, handleNodeClick, setEditingTextId],
  );

  // Drag events bubble through the Stage normally
  useEffect(() => {
    if (!stage) return;
    stage.on("dragstart.thumbnail", handleDragStart);
    stage.on("dragmove.thumbnail", handleDragMove);
    stage.on("dragend.thumbnail", handleDragEnd);
    return () => {
      stage.off(".thumbnail");
    };
  }, [stage, handleDragStart, handleDragMove, handleDragEnd]);

  // Native contextmenu listener on the viewport — captures right-click on stage canvases
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      if (!stage) return;
      const target = e.target as HTMLElement;
      const isOnCanvas = target.tagName === "CANVAS";
      if (!isOnCanvas) {
        setContextMenu(null);
        return;
      }
      // Translate viewport coords to stage coords to find the element under cursor
      const containerRect = stage.container().getBoundingClientRect();
      const stageX =
        ((e.clientX - containerRect.left) / containerRect.width) *
        stage.width();
      const stageY =
        ((e.clientY - containerRect.top) / containerRect.height) *
        stage.height();
      const intersect = stage.getIntersection({ x: stageX, y: stageY });
      const id = intersect?.name();
      let targetIds: string[];
      if (id && findById(id)) {
        const expanded = expandSelectionToGroups([id], design.elements);
        // If clicking outside current selection, switch selection to clicked element
        const sel = useThumbnailEditorStore.getState().selectedIds;
        const alreadyInSelection = expanded.every((eid) => sel.includes(eid));
        if (!alreadyInSelection) {
          setSelectedIds(expanded);
          targetIds = expanded;
        } else {
          targetIds = sel;
        }
      } else {
        targetIds = [];
      }
      setContextMenu({ x: e.clientX, y: e.clientY, targetIds });
    };
    node.addEventListener("contextmenu", handler);
    return () => {
      node.removeEventListener("contextmenu", handler);
    };
  }, [stage, findById, design.elements, setSelectedIds]);

  // Transform events are attached directly to the Transformer instance for reliability
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    tr.on("transformstart.thumbnail", handleTransformStart);
    tr.on("transformend.thumbnail", handleTransformEnd);
    return () => {
      tr.off(".thumbnail");
    };
  }, [handleTransformStart, handleTransformEnd, stage, selectedIds]);

  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const ids = contextMenu.targetIds;
    if (ids.length === 0) return [];
    const elements = ids
      .map((id) => topLevelById.get(id))
      .filter((e): e is ThumbnailElement => Boolean(e));
    const allLocked = elements.every((e) => e.locked);
    const allHidden = elements.every((e) => !e.visible);
    const selectedGroupIds = getSelectedGroupIds(ids, design.elements);
    const canGroup = ids.length >= 2;
    const canUngroup = selectedGroupIds.length > 0;
    const isCmd = navigator.platform.toLowerCase().includes("mac")
      ? "⌘"
      : "Ctrl";
    return [
      {
        type: "action",
        label: "Bring to front",
        icon: <FaArrowUp />,
        shortcut: `${isCmd}+]`,
        onClick: () => actions.reorderTo("front", ids),
      },
      {
        type: "action",
        label: "Bring forward",
        icon: <FaArrowUp />,
        onClick: () => actions.reorderTo("forward", ids),
      },
      {
        type: "action",
        label: "Send backward",
        icon: <FaArrowDown />,
        onClick: () => actions.reorderTo("backward", ids),
      },
      {
        type: "action",
        label: "Send to back",
        icon: <FaArrowDown />,
        shortcut: `${isCmd}+[`,
        onClick: () => actions.reorderTo("back", ids),
      },
      { type: "separator" },
      {
        type: "action",
        label: canGroup ? "Group" : "Group (need 2+ items)",
        icon: <FaObjectGroup />,
        shortcut: `${isCmd}+G`,
        onClick: () => actions.groupIds(ids),
        disabled: !canGroup,
      },
      {
        type: "action",
        label: canUngroup ? "Ungroup" : "Ungroup",
        icon: <FaObjectUngroup />,
        shortcut: `${isCmd}+⇧+G`,
        onClick: () => actions.ungroupSelection(ids),
        disabled: !canUngroup,
      },
      { type: "separator" },
      {
        type: "action",
        label: allHidden ? "Show" : "Hide",
        icon: allHidden ? <FaEye /> : <FaEyeSlash />,
        onClick: () => {
          for (const el of elements) {
            actions.setVisibility(el.id, allHidden);
          }
        },
      },
      {
        type: "action",
        label: allLocked ? "Unlock" : "Lock",
        icon: allLocked ? <FaLockOpen /> : <FaLock />,
        onClick: () => {
          for (const el of elements) {
            actions.setLocked(el.id, !allLocked);
          }
        },
      },
      { type: "separator" },
      {
        type: "action",
        label: "Duplicate",
        icon: <FaClone />,
        shortcut: `${isCmd}+D`,
        onClick: () => actions.duplicateIds(ids),
      },
      {
        type: "action",
        label: "Delete",
        icon: <FaTrash />,
        shortcut: "Delete",
        onClick: () => actions.removeIds(ids),
        danger: true,
      },
      { type: "separator" },
      {
        type: "action",
        label: "Deselect",
        icon: <FaLayerGroup />,
        shortcut: "Esc",
        onClick: () => clearSelection(),
      },
    ];
  }, [contextMenu, topLevelById, design.elements, actions, clearSelection]);

  // Compute wrapper transform: center stage on viewport, then apply zoom and pan
  const wrapperStyle: React.CSSProperties = {
    width: design.canvasSize.width,
    height: design.canvasSize.height,
    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  };

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div ref={stageWrapperRef} className={styles.stageWrapper} style={wrapperStyle}>
        <div
          className={styles.stageInner}
          style={{
            width: design.canvasSize.width,
            height: design.canvasSize.height,
          }}
        >
          <div className={styles.checkerboard} />
          <Stage
            ref={stageRef}
            width={design.canvasSize.width}
            height={design.canvasSize.height}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
            onClick={handleStageClickOrTap}
            onTap={handleStageClickOrTap}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
          >
            <BackgroundLayer
              background={design.background}
              canvasSize={design.canvasSize}
            />
            <ElementsLayer
              elements={design.elements}
              draggable={isEditingTextId == null}
            />
            <GuidesLayer
              guides={guides}
              canvasSize={design.canvasSize}
              showGrid={showGrid}
              gridSize={gridSize}
            />
            <TransformerLayer
              stage={stage}
              selectedIds={selectedIds}
              selectedElements={selectedIds
                .map((id) => topLevelById.get(id))
                .filter((e): e is ThumbnailElement => Boolean(e))}
              transformerRef={transformerRef}
              hidden={isEditingTextId != null}
              boundBoxFunc={transformBoundBoxFunc}
            />
          </Stage>
          <div className={styles.editorOverlay}>
            {editingTextElement && editingWorldTransform ? (
              <InlineTextEditor
                element={editingTextElement}
                worldTransform={editingWorldTransform}
                onCommit={handleCommitText}
                onCancel={() => setEditingTextId(null)}
              />
            ) : null}
          </div>
        </div>
      </div>
      {contextMenu && contextMenuItems.length > 0 ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
};
