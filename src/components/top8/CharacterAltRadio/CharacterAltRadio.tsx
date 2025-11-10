import cn from "classnames";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { PlayerInfo } from "@/types/top8/Result";

import styles from "./CharacterAltRadio.module.scss";
import { useMemo } from "react";

type Props = {
  characterId: string;
  selectedAlt: PlayerInfo["alt"];
  onAltChange: (alt: PlayerInfo["alt"]) => void;
  disabled?: boolean;
};

const getAltsAndIcons = (characterId: string) => {
  const character = characters.find((c) => c.id === characterId);
  return Array.from({ length: character?.alts || 8 }, (_, i) => ({
    alt: i as PlayerInfo["alt"],
    icon: getCharImgUrl({
      characterId,
      alt: i as PlayerInfo["alt"],
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

  const handleAltClick = (alt: PlayerInfo["alt"]) => {
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
