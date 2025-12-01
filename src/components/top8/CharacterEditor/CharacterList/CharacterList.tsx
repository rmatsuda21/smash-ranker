import cn from "classnames";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./CharacterList.module.scss";

type Props = {
  player?: PlayerInfo;
  updatePlayer: (player: PlayerInfo) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  disabled?: boolean;
};

export const CharacterList = ({
  player,
  updatePlayer,
  selectedIndex,
  setSelectedIndex,
  disabled = false,
}: Props) => {
  const addCharacter = () => {
    if (!player) return;
    updatePlayer({
      ...player,
      characters: [...player.characters, { id: "1293", alt: 0 }],
    });
  };

  const removeCharacter = (index: number) => {
    if (!player || player.characters.length <= 1) return;

    const newPlayer = {
      ...player,
      characters: player.characters.filter((_, i) => i !== index),
    };

    if (selectedIndex >= newPlayer.characters.length) {
      setSelectedIndex(newPlayer.characters.length - 1);
    }

    updatePlayer(newPlayer);
  };

  const handleSelect = (index: number) => {
    if (selectedIndex === index) {
      removeCharacter(index);
    } else {
      setSelectedIndex(index);
    }
  };

  return (
    <div className={styles.wrapper}>
      {player?.characters.map((char, i) => (
        <button
          key={`${char.id}-${i}`}
          className={cn(styles.button, {
            [styles.selected]: selectedIndex === i,
            [styles.only]: player?.characters.length === 1,
          })}
          onClick={() => handleSelect(i)}
        >
          <img
            src={getCharImgUrl({
              characterId: char.id,
              alt: char.alt,
              type: "stock",
            })}
          />
        </button>
      ))}
      <button disabled={disabled} onClick={addCharacter}>
        +
      </button>
    </div>
  );
};
