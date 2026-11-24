import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { useConfirmation } from "@/hooks/useConfirmation";
import { PredictionCountSelector } from "@/components/predict/PredictionCountSelector/PredictionCountSelector";

import { usePredictionStore } from "@/store/predictionStore";
import { getPlacements } from "@/utils/placements";
import {
  SortablePredictionItem,
  PredictionItemOverlay,
} from "@/components/predict/SortablePredictionItem/SortablePredictionItem";

import styles from "./PredictionListPanel.module.scss";

export const PredictionListPanel = () => {
  const { _ } = useLingui();
  const predictions = usePredictionStore((s) => s.predictions);
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const dispatch = usePredictionStore((s) => s.dispatch);
  const [activeId, setActiveId] = useState<string | null>(null);

  const effectiveCount =
    predictionCount === "custom" ? customCount : predictionCount;

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = predictions.findIndex((p) => p.id === String(active.id));
    const toIndex = predictions.findIndex((p) => p.id === String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;

    dispatch({ type: "REORDER_PREDICTIONS", fromIndex, toIndex });
  };

  const { confirm: confirmClear, confirmationDialog: clearConfirmation } =
    useConfirmation(() => dispatch({ type: "CLEAR_PREDICTIONS" }), {
      title: _(msg`Clear Predictions?`),
      description: _(msg`All current predictions will be removed.`),
    });

  const handleRemove = (id: string) => {
    dispatch({ type: "REMOVE_PREDICTION", payload: id });
  };

  const placements = getPlacements(predictions.length);
  const activePlayer = activeId
    ? predictions.find((p) => p.id === activeId)
    : null;
  const activeRank = activePlayer
    ? placements[predictions.indexOf(activePlayer)]
    : 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Trans>Predictions</Trans>
          <span className={styles.count}>
            {predictions.length}/{effectiveCount}
          </span>
        </h3>
        <PredictionCountSelector />
        <Button
          className={styles.clear}
          variant="ghost"
          size="sm"
          disabled={predictions.length === 0}
          onClick={confirmClear}
        >
          <Trans>Clear</Trans>
        </Button>
      </div>
      {clearConfirmation}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={predictions.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {predictions.length === 0 && (
            <p className={styles.empty}>
              <Trans>Tap entrants to add predictions</Trans>
            </p>
          )}
          <div className={styles.list}>
            {predictions.map((player, index) => (
              <SortablePredictionItem
                key={player.id}
                player={player}
                rank={placements[index]}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activePlayer && (
            <PredictionItemOverlay player={activePlayer} rank={activeRank} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
