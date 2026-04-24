import { useCallback, useEffect, useRef, useState } from "react";
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

import { TierRow } from "@/components/tierlist/TierRow/TierRow";
import { CharacterPool } from "@/components/tierlist/CharacterPool/CharacterPool";
import { TierListToolbar } from "@/components/tierlist/TierListToolbar/TierListToolbar";
import { TierListTitle } from "@/components/tierlist/TierListTitle/TierListTitle";
import { CharacterImage } from "@/components/tierlist/CharacterImage/CharacterImage";
import { AltPicker } from "@/components/tierlist/AltPicker/AltPicker";
import { useTierListStore } from "@/store/tierListStore";
import { useKonamiCode } from "@/hooks/tierlist/useKonamiCode";
import { TIER_PALETTES, getColorsForTierCount, DEFAULT_PALETTE_ID } from "@/consts/tierlist/tierPalettes";
import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";

import styles from "./TierListApp.module.scss";

type AltPickerState = {
  instanceId: string;
  position: { x: number; y: number };
} | null;

const findContainer = (
  instanceId: string,
  tiers: { id: string; characterIds: string[] }[],
  pool: string[]
): string | null => {
  for (const tier of tiers) {
    if (tier.characterIds.includes(instanceId)) return tier.id;
  }
  if (pool.includes(instanceId)) return "pool";
  return null;
};

export const TierListApp = () => {
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
    }, [dispatch])
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [altPicker, setAltPicker] = useState<AltPickerState>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const handleAddTier = useCallback(() => {
    const palette = TIER_PALETTES.find((p) => p.id === activePaletteId)
      ?? TIER_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
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
    })
  );

  useEffect(() => {
    preloadCharacterImages();
  }, []);

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

      const activeContainer = findContainer(activeInstanceId, tiers, pool);

      // Determine target container
      let overContainer: string | null = null;
      if (overId === "pool" || tiers.some((t) => t.id === overId)) {
        overContainer = overId;
      } else {
        overContainer = findContainer(overId, tiers, pool);
      }

      if (!activeContainer || !overContainer) return;

      const overItems =
        overContainer === "pool"
          ? pool
          : tiers.find((t) => t.id === overContainer)?.characterIds ?? [];

      if (activeContainer === overContainer) {
        // Same container reorder
        const activeIndex = overItems.indexOf(activeInstanceId);
        const overIndex = overItems.indexOf(overId);
        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;

        dispatch({
          type: "MOVE_CHARACTER",
          instanceId: activeInstanceId,
          toContainer: overContainer,
          toIndex: overIndex,
        });
      } else {
        // Cross-container move
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
      }
    },
    [tiers, pool, dispatch]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeInstanceId = active.id as string;
      const overId = over.id as string;

      // Only handle drops onto empty containers (container IDs, not character IDs)
      const isContainer = overId === "pool" || tiers.some((t) => t.id === overId);
      if (!isContainer) return;

      const activeContainer = findContainer(activeInstanceId, tiers, pool);
      if (!activeContainer || activeContainer === overId) return;

      const overItems =
        overId === "pool"
          ? pool
          : tiers.find((t) => t.id === overId)?.characterIds ?? [];

      dispatch({
        type: "MOVE_CHARACTER",
        instanceId: activeInstanceId,
        toContainer: overId,
        toIndex: overItems.length,
      });
    },
    [tiers, pool, dispatch]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = tierListWidth;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.min(
          Math.max(300, startWidth + delta),
          window.innerWidth - 48
        );
        dispatch({ type: "SET_TIER_LIST_WIDTH", width: newWidth });
      };

      const onPointerUp = () => {
        isResizing.current = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [tierListWidth, dispatch]
  );

  const handleCharacterContextMenu = useCallback(
    (instanceId: string, e: React.MouseEvent) => {
      e.preventDefault();
      setAltPicker({
        instanceId,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    []
  );

  const activeChar = activeId ? characters[activeId] : null;

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
        <div className={styles.contentRow}>
          <div className={styles.resizeContainer} style={{ width: tierListWidth }}>
            <div ref={exportRef} className={cn(styles.tierList, layout === "fancy" && styles.fancySpacing)}>
              <TierListTitle
                title={title}
                labelFont={labelFont}
                titleAlign={titleAlign}
                onChangeTitle={(t) => dispatch({ type: "SET_TITLE", title: t })}
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
              className={styles.addTierButton}
              onClick={handleAddTier}
              data-export-ignore
            >
              <FaPlus size={12} /> <Trans>Add Tier</Trans>
            </button>

            <div
              className={styles.resizeHandle}
              onPointerDown={handleResizePointerDown}
            />
          </div>

          <div className={styles.poolSide}>
            <CharacterPool
              imageMode={imageMode}
              onCharacterContextMenu={handleCharacterContextMenu}
            />
          </div>
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
