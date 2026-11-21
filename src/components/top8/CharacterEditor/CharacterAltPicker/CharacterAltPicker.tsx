import { CSSProperties, useMemo } from "react";

import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacter } from "@/utils/top8/characterCatalog";
import { CharacerData } from "@/types/top8/Player";
import { useTooltip } from "@/hooks/useTooltip";

import styles from "./CharacterAltPicker.module.scss";

type Props = {
  selectedCharacter?: CharacerData;
  onAltChange: (alt: CharacerData["alt"]) => void;
  disabled?: boolean;
};

type AltOptionProps = {
  alt: CharacerData["alt"];
  icon: string | null;
  altName: string | null;
  isSelected: boolean;
  disabled: boolean;
  onAltChange: (alt: CharacerData["alt"]) => void;
};

const AltOption = ({
  alt,
  icon,
  altName,
  isSelected,
  disabled,
  onAltChange,
}: AltOptionProps) => {
  const { triggerProps, tooltip } = useTooltip({ content: altName });
  // Hover lives on the label; the description belongs on the radio itself.
  const { "aria-describedby": describedBy, ...hoverProps } = triggerProps;

  return (
    <label className={styles.label} {...hoverProps}>
      <input
        type="radio"
        aria-describedby={describedBy}
        name="character-alt"
        value={alt}
        checked={isSelected}
        onChange={() => !disabled && onAltChange(alt)}
        disabled={disabled}
      />

      {icon && <img src={icon} alt={`Alt ${alt}`} />}
      {tooltip}
    </label>
  );
};

const getAltsAndIcons = (characterId?: string) => {
  if (characterId === EMPTY_CHARACTER_ID) return [];

  const character = characterId ? getCharacter(characterId) : undefined;

  if (!character || !characterId) {
    return Array.from({ length: 8 }, (_, i) => ({
      alt: 0 as CharacerData["alt"],
      id: `alt-icon-${i}`,
      icon: null,
      altName: null,
    }));
  }

  return Array.from({ length: character?.alts || 8 }, (_, i) => ({
    id: `${character?.id}-${i}`,
    alt: i as CharacerData["alt"],
    icon: getCharImgUrl({
      characterId,
      alt: i as CharacerData["alt"],
      type: "stock",
    }),
    altName: character?.altNames?.[i]
      ? `${i}: ${character?.altNames?.[i]}`
      : null,
  }));
};

export const CharacterAltPicker = ({
  selectedCharacter,
  onAltChange,
  disabled = false,
}: Props) => {
  const altsAndIcons = useMemo(
    () => getAltsAndIcons(selectedCharacter?.id),
    [selectedCharacter?.id],
  );

  if (altsAndIcons.length === 0) return null;

  return (
    <div
      className={styles.container}
      // Characters differ in how many alts they have (Melee: 4 to 6), so the
      // highlight's width and position come from the current list.
      style={
        {
          "--num-alts": altsAndIcons.length,
          "--selected-alt": selectedCharacter?.alt ?? 0,
        } as CSSProperties
      }
      role="radiogroup"
      aria-label="Character alternate costume"
    >
      {altsAndIcons.map(({ alt, icon, id, altName }) => (
        <AltOption
          key={id}
          alt={alt}
          icon={icon}
          altName={altName}
          isSelected={alt === selectedCharacter?.alt && !!selectedCharacter}
          disabled={disabled}
          onAltChange={onAltChange}
        />
      ))}
    </div>
  );
};
