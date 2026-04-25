import { FaPlus } from "react-icons/fa6";

import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import type { PredictionPlayer } from "@/types/predict/Prediction";

import styles from "./EntrantPoolItem.module.scss";

type Props = {
  player: PredictionPlayer;
  disabled: boolean;
  onAdd: (player: PredictionPlayer) => void;
};

export const EntrantPoolItem = ({ player, disabled, onAdd }: Props) => {
  return (
    <button
      className={styles.root}
      disabled={disabled}
      onClick={() => onAdd(player)}
    >
      <span className={styles.seed}>#{player.seed}</span>
      {player.characterId !== EMPTY_CHARACTER_ID && (
        <img
          className={styles.charIcon}
          src={getCharImgUrl({
            characterId: player.characterId,
            alt: 0,
            type: "stock",
          })}
          alt=""
          loading="lazy"
        />
      )}
      <span className={styles.name}>
        {player.prefix && (
          <span className={styles.prefix}>{player.prefix} | </span>
        )}
        {player.name}
      </span>
      <FaPlus className={styles.addIcon} />
    </button>
  );
};
