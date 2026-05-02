import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MdDragIndicator, MdClose } from "react-icons/md";

import type { PredictionPlayer } from "@/types/predict/Prediction";

import styles from "./SortablePredictionItem.module.scss";

type Props = {
  player: PredictionPlayer;
  rank: number;
  onRemove: (id: string) => void;
};

export const SortablePredictionItem = ({ player, rank, onRemove }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.root}>
      <button
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
      >
        <MdDragIndicator />
      </button>
      <span className={styles.rank} data-rank={rank}>
        {rank}
      </span>
      <span className={styles.name}>
        {player.prefix && (
          <span className={styles.prefix}>{player.prefix} | </span>
        )}
        {player.name}
      </span>
      <span className={styles.seed}>Seed {player.seed}</span>
      <button className={styles.removeButton} onClick={() => onRemove(player.id)}>
        <MdClose />
      </button>
    </div>
  );
};

export const PredictionItemOverlay = ({
  player,
  rank,
}: {
  player: PredictionPlayer;
  rank: number;
}) => {
  return (
    <div className={styles.overlay}>
      <span className={styles.dragHandle}>
        <MdDragIndicator />
      </span>
      <span className={styles.rank} data-rank={rank}>
        {rank}
      </span>
      <span className={styles.name}>
        {player.prefix && (
          <span className={styles.prefix}>{player.prefix} | </span>
        )}
        {player.name}
      </span>
      <span className={styles.seed}>Seed {player.seed}</span>
    </div>
  );
};
