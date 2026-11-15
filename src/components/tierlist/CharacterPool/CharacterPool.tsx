import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Trans } from "@lingui/react/macro";
import cn from "classnames";

import { SortableCharacter } from "@/components/tierlist/SortableCharacter/SortableCharacter";
import { useTierListStore } from "@/store/tierListStore";
import { ImageDisplayMode } from "@/types/tierlist/TierList";

import styles from "./CharacterPool.module.scss";

type Props = {
  className?: string;
  imageMode: ImageDisplayMode;
  onCharacterContextMenu: (instanceId: string, e: React.MouseEvent) => void;
};

export const CharacterPool = ({
  className,
  imageMode,
  onCharacterContextMenu,
}: Props) => {
  const pool = useTierListStore((s) => s.pool);
  const characters = useTierListStore((s) => s.characters);

  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div className={cn(styles.poolWrapper, className)}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <Trans>Unranked</Trans>
        </h4>
        <span className={styles.count}>{pool.length}</span>
        <span className={styles.hint}>
          <Trans>Drag into a tier · Right-click to change costume</Trans>
        </span>
      </div>
      <SortableContext id="pool" items={pool} strategy={rectSortingStrategy}>
        <div className={styles.scrollContainer}>
          <div
            ref={setNodeRef}
            className={cn(styles.pool, { [styles.over]: isOver })}
          >
            {pool.map((instanceId) => {
              const char = characters[instanceId];
              if (!char) return null;
              return (
                <SortableCharacter
                  key={instanceId}
                  character={char}
                  imageMode={imageMode}
                  onContextMenu={(e) => onCharacterContextMenu(instanceId, e)}
                />
              );
            })}
            {pool.length === 0 && (
              <p className={styles.empty}>
                <Trans>Every character is ranked. Drag one back here.</Trans>
              </p>
            )}
          </div>
          <div className={styles.scrollZone} />
        </div>
      </SortableContext>
      <div className={styles.scrollZoneLabel}>
        <Trans>← swipe to scroll →</Trans>
      </div>
    </div>
  );
};
