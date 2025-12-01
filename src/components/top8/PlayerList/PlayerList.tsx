import { useLayoutEffect, useRef } from "react";
import { MdDragIndicator } from "react-icons/md";
import cn from "classnames";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { usePlayerStore } from "@/store/playerStore";

import styles from "./PlayerList.module.scss";

type Props = {
  className?: string;
};

type PlayerItemProps = {
  player: PlayerInfo;
  index: number;
  isSelected: boolean;
  setSelectedIndex: (index: number) => void;
};

const PlayerItem = ({
  player,
  index,
  isSelected,
  setSelectedIndex,
}: PlayerItemProps) => {
  return (
    <div
      className={cn(styles.item, { [styles.selected]: isSelected })}
      key={player.id}
      onClick={() => {
        if (isSelected) {
          setSelectedIndex(-1);
        } else {
          setSelectedIndex(index);
        }
      }}
      data-id={player.id}
    >
      <div className={styles.header}>
        <MdDragIndicator className={styles.dragHandle} />
        <span>{player.name}</span>
      </div>
    </div>
  );
};

export const PlayerList = ({ className }: Props) => {
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      const width = wrapperRef.current.offsetWidth;
      document
        .getElementById("places")
        ?.style.setProperty("--wrapper-width", `${width}px`);
    }
  }, []);

  const setSelectedIndex = (index: number) => {
    dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index });
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div id="places" className={styles.places}>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className={cn(styles.list, className)}>
        {players.map((player, index) => (
          <PlayerItem
            key={player.id}
            index={index}
            player={player}
            isSelected={selectedPlayerIndex === index}
            setSelectedIndex={setSelectedIndex}
          />
        ))}
      </div>
    </div>
  );
};
