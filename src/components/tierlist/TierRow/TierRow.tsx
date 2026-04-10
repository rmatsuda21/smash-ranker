import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import cn from "classnames";

import { TierLabel } from "@/components/tierlist/TierLabel/TierLabel";
import { TierSettings } from "@/components/tierlist/TierSettings/TierSettings";
import { SortableCharacter } from "@/components/tierlist/SortableCharacter/SortableCharacter";
import { useTierListStore } from "@/store/tierListStore";
import { LabelFont, Tier, ImageDisplayMode, TierListLayout } from "@/types/tierlist/TierList";

import styles from "./TierRow.module.scss";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

function buildFancyStyles(color: string) {
  const { r, g, b } = hexToRgb(color);
  return {
    row: {
      border: `2px solid rgba(${r}, ${g}, ${b}, 0.5)`,
      boxShadow: `0 0 12px 2px rgba(${r}, ${g}, ${b}, 0.25), inset 0 0 8px 0 rgba(${r}, ${g}, ${b}, 0.1)`,
    } as React.CSSProperties,
    characters: {
      background: `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.15), transparent 70%)`,
    } as React.CSSProperties,
    label: {
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
    } as React.CSSProperties,
  };
}

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

  const isFancy = layout === "fancy";
  const fancyStyles = isFancy ? buildFancyStyles(tier.color) : null;

  return (
    <div className={cn(styles.row, layout === "top" && styles.topLayout, isFancy && styles.fancyLayout)} style={fancyStyles?.row}>
      <TierLabel
        name={tier.name}
        color={tier.color}
        layout={layout}
        labelFont={labelFont}
        extraStyle={fancyStyles?.label}
        onRename={(name) =>
          dispatch({ type: "RENAME_TIER", tierId: tier.id, name })
        }
      />
      <SortableContext
        id={tier.id}
        items={tier.characterIds}
        strategy={rectSortingStrategy}
      >
        <div ref={setNodeRef} className={styles.characters} style={fancyStyles?.characters}>
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
