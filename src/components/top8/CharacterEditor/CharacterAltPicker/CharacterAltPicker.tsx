import { useEffect, useMemo, useRef } from "react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";
import { useTooltip } from "@/hooks/top8/useTooltip";

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
  const { Tooltip, handleMouseEnter, handleMouseLeave } = useTooltip({
    tooltip: altName ?? "",
  });

  return (
    <label
      className={styles.label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="radio"
        name="character-alt"
        value={alt}
        checked={isSelected}
        onChange={() => !disabled && onAltChange(alt)}
        disabled={disabled}
      />

      {icon && <img src={icon} alt={`Alt ${alt}`} />}
      {altName && <Tooltip className={styles.tooltip} />}
    </label>
  );
};

const getAltsAndIcons = (characterId?: string) => {
  const character = characters.find((c) => c.id === characterId);

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  const altsAndIcons = useMemo(() => {
    const alts = getAltsAndIcons(selectedCharacter?.id);

    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty("--num-alts", String(alts.length));
      wrapperRef.current.style.setProperty(
        "--selected-alt",
        String(selectedCharacter?.alt)
      );
    }

    return alts;
  }, [selectedCharacter?.id, selectedCharacter?.alt]);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty(
        "--selected-alt",
        String(selectedCharacter?.alt || 0)
      );
    }
  }, [selectedCharacter?.alt]);

  return (
    <div
      ref={wrapperRef}
      className={styles.container}
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
