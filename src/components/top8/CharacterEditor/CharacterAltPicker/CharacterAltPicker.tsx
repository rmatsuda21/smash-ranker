import { useEffect, useMemo, useRef, useState } from "react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";

import styles from "./CharacterAltPicker.module.scss";

const TOOLTIP_DELAY = 200;

type Props = {
  selectedCharacter?: CharacerData;
  onAltChange: (alt: CharacerData["alt"]) => void;
  disabled?: boolean;
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = (id: string, hasAltName: boolean) => {
    if (hasAltName) {
      tooltipTimeout.current = setTimeout(() => {
        setActiveTooltip(id);
      }, TOOLTIP_DELAY);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setActiveTooltip(null);
  };

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

  const handleAltClick = (alt: CharacerData["alt"]) => {
    if (!disabled) {
      onAltChange(alt);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={styles.container}
      role="radiogroup"
      aria-label="Character alternate costume"
    >
      {altsAndIcons.map(({ alt, icon, id, altName }) => {
        const isSelected =
          alt === selectedCharacter?.alt && !!selectedCharacter;

        return (
          <label
            key={id}
            className={styles.label}
            onMouseEnter={() => handleMouseEnter(id, !!altName)}
            onMouseLeave={handleMouseLeave}
          >
            <input
              type="radio"
              name="character-alt"
              value={alt}
              checked={isSelected}
              onChange={() => handleAltClick(alt)}
              disabled={disabled}
            />

            {icon && <img src={icon} alt={`Alt ${alt}`} />}
            {altName && (
              <div
                className={`${styles.tooltip} ${
                  activeTooltip === id ? styles.show : ""
                }`}
              >
                {altName}
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
};
