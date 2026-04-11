import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Trans } from "@lingui/react/macro";

import { SortableCharacter } from "@/components/tierlist/SortableCharacter/SortableCharacter";
import { useTierListStore } from "@/store/tierListStore";
import { ImageDisplayMode } from "@/types/tierlist/TierList";

import styles from "./CharacterPool.module.scss";

type Props = {
  imageMode: ImageDisplayMode;
  onCharacterContextMenu: (instanceId: string, e: React.MouseEvent) => void;
};

export const CharacterPool = ({ imageMode, onCharacterContextMenu }: Props) => {
  const pool = useTierListStore((s) => s.pool);
  const characters = useTierListStore((s) => s.characters);

  const { setNodeRef } = useDroppable({ id: "pool" });

  return (
    <div className={styles.poolWrapper}>
      <h3 className={styles.title}><Trans>Character Collection</Trans></h3>
      <SortableContext id="pool" items={pool} strategy={rectSortingStrategy}>
        <div className={styles.scrollContainer}>
          <div ref={setNodeRef} className={styles.pool}>
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
          </div>
          <div className={styles.scrollZone} />
        </div>
      </SortableContext>
      <div className={styles.scrollZoneLabel}><Trans>← swipe to scroll →</Trans></div>
    </div>
  );
};
