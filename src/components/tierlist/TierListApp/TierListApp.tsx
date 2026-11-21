import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FaPlus } from "react-icons/fa6";
import cn from "classnames";

import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { TierRow } from "@/components/tierlist/TierRow/TierRow";
import { CharacterPool } from "@/components/tierlist/CharacterPool/CharacterPool";
import { TierListToolbar } from "@/components/tierlist/TierListToolbar/TierListToolbar";
import { TierListTitle } from "@/components/tierlist/TierListTitle/TierListTitle";
import { CharacterImage } from "@/components/tierlist/CharacterImage/CharacterImage";
import { AltPicker } from "@/components/tierlist/AltPicker/AltPicker";
import { useTierListStore } from "@/store/tierListStore";
import { useKonamiCode } from "@/hooks/tierlist/useKonamiCode";
import {
  TIER_PALETTES,
  getColorsForTierCount,
  DEFAULT_PALETTE_ID,
} from "@/consts/tierlist/tierPalettes";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { isLegacyFontStack } from "@/utils/tierlist/labelFont";
import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";

import styles from "./TierListApp.module.scss";

type AltPickerState = {
  instanceId: string;
  position: { x: number; y: number };
} | null;

const MIN_WIDTH = 300;
const DEFAULT_WIDTH = 600;
const KEYBOARD_STEP = 16;

const findContainer = (
  instanceId: string,
  tiers: { id: string; characterIds: string[] }[],
  pool: string[],
): string | null => {
  for (const tier of tiers) {
    if (tier.characterIds.includes(instanceId)) return tier.id;
  }
  if (pool.includes(instanceId)) return "pool";
  return null;
};

export const TierListApp = () => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);
  const tiers = useTierListStore((s) => s.tiers);
  const pool = useTierListStore((s) => s.pool);
  const characters = useTierListStore((s) => s.characters);
  const imageMode = useTierListStore((s) => s.imageMode);
  const layout = useTierListStore((s) => s.layout);
  const labelFont = useTierListStore((s) => s.labelFont);
  const title = useTierListStore((s) => s.title);
  const titleAlign = useTierListStore((s) => s.titleAlign);
  const activePaletteId = useTierListStore((s) => s.activePaletteId);

  const tierListWidth = useTierListStore((s) => s.tierListWidth);

  useKonamiCode(
    useCallback(() => {
      dispatch({ type: "RANDOMIZE_TIERS", minPerTier: 5 });
    }, [dispatch]),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [altPicker, setAltPicker] = useState<AltPickerState>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(Infinity);
  const [isResizing, setIsResizing] = useState(false);

  // The list never grows past the room beside it, so its resize handle
  // cannot end up under the roster or off the screen. The stored width is
  // left alone when the window shrinks and comes back when it grows.
  useLayoutEffect(() => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const measure = () => {
      const style = getComputedStyle(area);
      setAvailableWidth(
        area.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  // On a phone the list always spans the screen (CSS), whatever width is
  // stored, so the row is sized from the room there actually is.
  const isPhone = window.matchMedia("(max-width: 768px)").matches;
  const maxWidth = Math.max(MIN_WIDTH, Math.floor(availableWidth));
  const listWidth = isPhone ? maxWidth : Math.min(tierListWidth, maxWidth);

  const setWidth = useCallback(
    (width: number) => {
      dispatch({
        type: "SET_TIER_LIST_WIDTH",
        width: Math.round(Math.min(Math.max(MIN_WIDTH, width), maxWidth)),
      });
    },
    [dispatch, maxWidth],
  );

  const tiersRef = useRef(tiers);
  tiersRef.current = tiers;
  const poolRef = useRef(pool);
  poolRef.current = pool;

  const handleAddTier = useCallback(() => {
    const palette =
      TIER_PALETTES.find((p) => p.id === activePaletteId) ??
      TIER_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
    const colors = getColorsForTierCount(palette, tiers.length + 1);
    dispatch({ type: "ADD_TIER", name: "?", color: colors[tiers.length] });
  }, [dispatch, activePaletteId, tiers.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const game = useTierListStore((s) => s.game);
  useEffect(() => {
    preloadCharacterImages(game);
  }, [game]);

  // Fetch the label font (only the weight in use) for a saved list and
  // whenever the weight changes. Until it arrives the labels show in the
  // fallback font.
  useEffect(() => {
    if (isLegacyFontStack(labelFont.family)) return;
    loadFamily(labelFont.family, [labelFont.weight]).catch(() => {
      /* stays on the fallback font */
    });
  }, [labelFont.family, labelFont.weight]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setAltPicker(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeInstanceId = active.id as string;
      const overId = over.id as string;

      if (activeInstanceId === overId) return;

      const currentTiers = tiersRef.current;
      const currentPool = poolRef.current;

      const activeContainer = findContainer(
        activeInstanceId,
        currentTiers,
        currentPool,
      );

      // Determine target container
      let overContainer: string | null = null;
      if (overId === "pool" || currentTiers.some((t) => t.id === overId)) {
        overContainer = overId;
      } else {
        overContainer = findContainer(overId, currentTiers, currentPool);
      }

      if (!activeContainer || !overContainer) return;

      // Same-container reordering is handled visually by SortableContext transforms
      // and committed in handleDragEnd. Only handle cross-container moves here.
      if (activeContainer === overContainer) return;

      const overItems =
        overContainer === "pool"
          ? currentPool
          : (currentTiers.find((t) => t.id === overContainer)?.characterIds ??
            []);

      const overIndex = overItems.indexOf(overId);
      let insertIndex: number;
      if (overIndex < 0) {
        insertIndex = overItems.length;
      } else {
        const activeRect = active.rect.current.translated;
        const overRect = over.rect;
        if (activeRect && overRect) {
          const activeCenterX = activeRect.left + activeRect.width / 2;
          const overCenterX = overRect.left + overRect.width / 2;
          insertIndex = activeCenterX < overCenterX ? overIndex : overIndex + 1;
        } else {
          insertIndex = overIndex;
        }
      }

      dispatch({
        type: "MOVE_CHARACTER",
        instanceId: activeInstanceId,
        toContainer: overContainer,
        toIndex: insertIndex,
      });
    },
    [dispatch],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeInstanceId = active.id as string;
      const overId = over.id as string;

      const currentTiers = tiersRef.current;
      const currentPool = poolRef.current;

      const activeContainer = findContainer(
        activeInstanceId,
        currentTiers,
        currentPool,
      );
      const isContainer =
        overId === "pool" || currentTiers.some((t) => t.id === overId);

      // Drop onto empty container
      if (isContainer) {
        if (!activeContainer || activeContainer === overId) return;
        const overItems =
          overId === "pool"
            ? currentPool
            : (currentTiers.find((t) => t.id === overId)?.characterIds ?? []);
        dispatch({
          type: "MOVE_CHARACTER",
          instanceId: activeInstanceId,
          toContainer: overId,
          toIndex: overItems.length,
        });
        return;
      }

      // Same-container reorder on drop
      const overContainer = findContainer(overId, currentTiers, currentPool);
      if (
        !activeContainer ||
        !overContainer ||
        activeContainer !== overContainer
      )
        return;

      const items =
        overContainer === "pool"
          ? currentPool
          : (currentTiers.find((t) => t.id === overContainer)?.characterIds ??
            []);
      const activeIndex = items.indexOf(activeInstanceId);
      const overIndex = items.indexOf(overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;

      dispatch({
        type: "MOVE_CHARACTER",
        instanceId: activeInstanceId,
        toContainer: overContainer,
        toIndex: overIndex,
      });
    },
    [dispatch],
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const handle = e.currentTarget;
      const startX = e.clientX;
      const startWidth = listWidth;
      handle.setPointerCapture(e.pointerId);
      setIsResizing(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        // The list is centred, so it grows on both sides: twice the pointer
        // travel keeps the handle under the cursor.
        setWidth(startWidth + (moveEvent.clientX - startX) * 2);
      };

      const stop = () => {
        setIsResizing(false);
        handle.removeEventListener("pointermove", onPointerMove);
        handle.removeEventListener("pointerup", stop);
        handle.removeEventListener("pointercancel", stop);
      };

      handle.addEventListener("pointermove", onPointerMove);
      handle.addEventListener("pointerup", stop);
      handle.addEventListener("pointercancel", stop);
    },
    [listWidth, setWidth],
  );

  const handleResizeKeyDown = (e: React.KeyboardEvent) => {
    const next = {
      ArrowLeft: listWidth - KEYBOARD_STEP,
      ArrowRight: listWidth + KEYBOARD_STEP,
      Home: MIN_WIDTH,
      End: maxWidth,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setWidth(next);
  };

  const handleCharacterContextMenu = useCallback(
    (instanceId: string, e: React.MouseEvent) => {
      e.preventDefault();
      setAltPicker({
        instanceId,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    [],
  );

  const activeChar = activeId ? characters[activeId] : null;

  const tierCols = useMemo(() => {
    const MAX_CELL = 64;
    const GAP = 4;

    const overhead = layout === "top" ? 10 : 90;
    const content = Math.max(0, listWidth - overhead);
    return Math.max(1, Math.ceil((content + GAP) / (MAX_CELL + GAP)));
  }, [listWidth, layout]);

  return (
    <div className={styles.root}>
      <TierListToolbar exportRef={exportRef} />
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.body}>
          <div ref={scrollAreaRef} className={styles.scrollArea}>
            <div
              className={styles.resizeContainer}
              style={
                {
                  width: listWidth,
                  "--tier-cols": tierCols,
                } as React.CSSProperties
              }
            >
              <div
                ref={exportRef}
                className={cn(
                  styles.tierList,
                  layout === "fancy" && styles.fancySpacing,
                )}
              >
                <TierListTitle
                  title={title}
                  labelFont={labelFont}
                  titleAlign={titleAlign}
                  onChangeTitle={(t) =>
                    dispatch({ type: "SET_TITLE", title: t })
                  }
                />
                {tiers.map((tier, index) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    tierIndex={index}
                    tierCount={tiers.length}
                    imageMode={imageMode}
                    layout={layout}
                    labelFont={labelFont}
                    onCharacterContextMenu={handleCharacterContextMenu}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.addTierButton}
                onClick={handleAddTier}
                data-export-ignore
              >
                <FaPlus size={12} /> <Trans>Add Tier</Trans>
              </button>

              <div
                className={cn(styles.resizeHandle, {
                  [styles.resizing]: isResizing,
                })}
                role="separator"
                aria-orientation="vertical"
                aria-label={_(msg`Tier list width`)}
                aria-valuemin={MIN_WIDTH}
                aria-valuemax={maxWidth}
                aria-valuenow={listWidth}
                title={_(msg`Drag to resize · Double-click to reset`)}
                tabIndex={0}
                onPointerDown={handleResizePointerDown}
                onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
                onKeyDown={handleResizeKeyDown}
              >
                <span className={styles.resizeReadout} aria-hidden="true">
                  {listWidth}px
                </span>
              </div>
            </div>
          </div>
          <CharacterPool
            imageMode={imageMode}
            onCharacterContextMenu={handleCharacterContextMenu}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeChar ? (
            <div className={styles.dragOverlay}>
              <CharacterImage
                character={activeChar}
                imageMode={imageMode}
                size={52}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {altPicker && (
        <AltPicker
          instanceId={altPicker.instanceId}
          position={altPicker.position}
          imageMode={imageMode}
          onClose={() => setAltPicker(null)}
        />
      )}
    </div>
  );
};
