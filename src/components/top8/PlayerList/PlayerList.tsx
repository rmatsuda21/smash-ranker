import { useLayoutEffect, useRef } from "react";
import { MdDragIndicator } from "react-icons/md";
import cn from "classnames";

import { PlayerInfo } from "@/types/top8/Result";

import styles from "./PlayerList.module.scss";

type Props = {
  players: PlayerInfo[];
  playerOrder: number[];
  setPlayerOrder: (playerOrder: number[]) => void;
  selectedIndex?: number;
  setSelectedIndex: (index: number | undefined) => void;
  className?: string;
};

type PlayerItemProps = {
  player: PlayerInfo;
  index: number;
  isSelected: boolean;
  setSelectedIndex: (index: number | undefined) => void;
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
          setSelectedIndex(undefined);
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

export const PlayerList = ({
  className,
  players,
  playerOrder,
  // setPlayerOrder,
  selectedIndex,
  setSelectedIndex,
}: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      const width = wrapperRef.current.offsetWidth;
      document
        .getElementById("places")
        ?.style.setProperty("--wrapper-width", `${width}px`);
    }
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div id="places" className={styles.places}>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className={cn(styles.list, className)}>
        {playerOrder.map((playerIndex) => {
          const player = players[playerIndex];
          if (!player) return null;

          return (
            <PlayerItem
              key={player.id}
              index={playerIndex}
              player={player}
              isSelected={selectedIndex === playerIndex}
              setSelectedIndex={setSelectedIndex}
            />
          );
        })}
      </div>
    </div>
  );
};
