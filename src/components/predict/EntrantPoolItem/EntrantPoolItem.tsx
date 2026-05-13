import { FaPlus } from "react-icons/fa6";

import type { PredictionPlayer } from "@/types/predict/Prediction";
import { CountryFlag } from "@/components/predict/CountryFlag/CountryFlag";

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
      <CountryFlag country={player.country} />
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
