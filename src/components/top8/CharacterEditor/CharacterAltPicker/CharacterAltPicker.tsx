import { useMemo } from "react";
import cn from "classnames";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";

import styles from "./CharacterAltPicker.module.scss";

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
  }));
};

export const CharacterAltPicker = ({
  selectedCharacter,
  onAltChange,
  disabled = false,
}: Props) => {
  const altsAndIcons = useMemo(
    () => getAltsAndIcons(selectedCharacter?.id),
    [selectedCharacter]
  );

  const handleAltClick = (alt: CharacerData["alt"]) => {
    if (!disabled) {
      onAltChange(alt);
    }
  };

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Character alternate costume"
    >
      {altsAndIcons.map(({ alt, icon, id }) => {
        const isSelected =
          alt === selectedCharacter?.alt && !!selectedCharacter;

        return (
          <label
            key={id}
            className={cn(styles.label, { [styles.selected]: isSelected })}
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
          </label>
        );
      })}
    </div>
  );
};
