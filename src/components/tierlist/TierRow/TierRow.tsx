import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import { TierLabel } from "@/components/tierlist/TierLabel/TierLabel";
import { TierSettings } from "@/components/tierlist/TierSettings/TierSettings";
import { SortableCharacter } from "@/components/tierlist/SortableCharacter/SortableCharacter";
import { useTierListStore } from "@/store/tierListStore";
import { LabelFont, Tier, ImageDisplayMode, TierListLayout } from "@/types/tierlist/TierList";

import styles from "./TierRow.module.scss";

type Props = {
  tier: Tier;
  tierIndex: number;
  tierCount: number;
  imageMode: ImageDisplayMode;
  layout: TierListLayout;
  labelFont: LabelFont;
  onCharacterContextMenu: (instanceId: string, e: React.MouseEvent) => void;
};

export const TierRow = ({
  tier,
  tierIndex,
  tierCount,
  imageMode,
  layout,
  labelFont,
  onCharacterContextMenu,
}: Props) => {
  const dispatch = useTierListStore((s) => s.dispatch);
  const characters = useTierListStore((s) => s.characters);

  const { setNodeRef } = useDroppable({ id: tier.id });

  return (
    <div className={`${styles.row} ${layout === "top" ? styles.topLayout : ""}`}>
      <TierLabel
        name={tier.name}
        color={tier.color}
        layout={layout}
        labelFont={labelFont}
        onRename={(name) =>
          dispatch({ type: "RENAME_TIER", tierId: tier.id, name })
        }
      />
      <SortableContext
        id={tier.id}
        items={tier.characterIds}
        strategy={rectSortingStrategy}
      >
        <div ref={setNodeRef} className={styles.characters}>
          {tier.characterIds.map((instanceId) => {
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
      </SortableContext>
      <div className={styles.settings} data-export-ignore>
        <TierSettings
          tierId={tier.id}
          tierIndex={tierIndex}
          tierCount={tierCount}
          color={tier.color}
        />
      </div>
    </div>
  );
};
