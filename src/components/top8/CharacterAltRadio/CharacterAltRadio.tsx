import cn from "classnames";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";

import styles from "./CharacterAltRadio.module.scss";
import { useMemo } from "react";

type Props = {
  characterId: string;
  selectedAlt: CharacerData["alt"];
  onAltChange: (alt: CharacerData["alt"]) => void;
  disabled?: boolean;
};

const getAltsAndIcons = (characterId: string) => {
  const character = characters.find((c) => c.id === characterId);
  return Array.from({ length: character?.alts || 8 }, (_, i) => ({
    alt: i as CharacerData["alt"],
    icon: getCharImgUrl({
      characterId,
      alt: i as CharacerData["alt"],
      type: "stock",
    }),
  }));
};

export const CharacterAltRadio = ({
  characterId,
  selectedAlt,
  onAltChange,
  disabled = false,
}: Props) => {
  const altsAndIcons = useMemo(
    () => getAltsAndIcons(characterId),
    [characterId]
  );

  const handleAltClick = (alt: CharacerData["alt"]) => {
    if (!disabled) {
      onAltChange(alt);
    }
  };

  return (
    <div className={styles.container}>
      {altsAndIcons.map(({ alt, icon }) => {
        const isSelected = alt === selectedAlt && !!characterId;

        return (
          <label
            key={`${characterId}-${alt}`}
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

            {characterId && <img src={icon} alt={`Alt ${alt}`} />}
          </label>
        );
      })}
    </div>
  );
};
