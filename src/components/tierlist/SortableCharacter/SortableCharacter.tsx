import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import cn from "classnames";

import { CharacterImage } from "@/components/tierlist/CharacterImage/CharacterImage";
import { ImageDisplayMode, TierCharacter } from "@/types/tierlist/TierList";

import styles from "./SortableCharacter.module.scss";

type Props = {
  character: TierCharacter;
  imageMode: ImageDisplayMode;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export const SortableCharacter = ({
  character,
  imageMode,
  onContextMenu,
}: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: character.instanceId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(styles.character, { [styles.dragging]: isDragging })}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
      <CharacterImage character={character} imageMode={imageMode} />
    </div>
  );
};
