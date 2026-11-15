import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./PlayersEditor.module.scss";

// One chip per slot in the design, showing who is in it: the player's main
// character over the slot number.
export const PlayerSelector = () => {
  const { _ } = useLingui();
  const playerCount = useCanvasStore((state) => state.design.players.length);
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex,
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  return Array.from({ length: playerCount }).map((_unused, index) => {
    const isSelected = selectedPlayerIndex === index;
    const player = players[index];
    const main = player?.characters[0];
    const slot = index + 1;

    return (
      <button
        key={index}
        type="button"
        className={cn(styles.slot, { [styles.slotSelected]: isSelected })}
        onClick={() =>
          dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index })
        }
        aria-pressed={isSelected}
        aria-label={
          player?.gamerTag
            ? `${slot}: ${player.gamerTag}`
            : _(msg`Player ${slot}`)
        }
        title={player?.gamerTag || undefined}
      >
        <span className={styles.slotIcon}>
          {main && (
            <img
              src={getCharImgUrl({
                characterId: main.id,
                alt: main.alt,
                type: "stock",
              })}
              alt=""
              draggable={false}
            />
          )}
        </span>
        <span className={styles.slotNumber}>{slot}</span>
      </button>
    );
  });
};
