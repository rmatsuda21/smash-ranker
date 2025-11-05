import { useLayoutEffect, useRef } from "react";
import { Reorder } from "framer-motion";
import { useDragControls } from "motion/react";
import { MdDragIndicator } from "react-icons/md";
import cn from "classnames";

import { PlayerInfo } from "@/types/top8/Result";

import styles from "./PlayerList.module.scss";

type Props = {
  players: PlayerInfo[];
  setPlayers: (players: PlayerInfo[]) => void;
  selectedPlayerId?: string;
  className?: string;
  updatePlayer: (player: PlayerInfo) => void;
  setSelectedPlayerId: (playerId: string) => void;
};

type PlayerItemProps = {
  player: PlayerInfo;
  containerRef: React.RefObject<any>;
  isSelected: boolean;
  setSelectedPlayerId: (playerId: string) => void;
};

const PlayerItem = ({
  player,
  containerRef,
  isSelected,
  setSelectedPlayerId,
}: PlayerItemProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      className={cn(styles.item, { [styles.selected]: isSelected })}
      key={player.id}
      value={player}
      dragConstraints={containerRef}
      dragListener={false}
      dragControls={controls}
      onClick={() => {
        if (isSelected) {
          setSelectedPlayerId("");
        } else {
          setSelectedPlayerId(player.id);
        }
      }}
      data-id={player.id}
    >
      <div className={styles.header}>
        <MdDragIndicator
          className={styles.dragHandle}
          onPointerDown={(e) => controls.start(e)}
        />
        <span>{player.name}</span>
      </div>
    </Reorder.Item>
  );
};

export const PlayerList = ({
  className,
  players,
  setPlayers,
  selectedPlayerId,
  setSelectedPlayerId,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
      <Reorder.Group
        as="div"
        ref={containerRef}
        className={cn(styles.list, className)}
        axis="y"
        values={players}
        onReorder={setPlayers}
      >
        {players.map((player) => (
          <PlayerItem
            key={player.id}
            player={player}
            containerRef={containerRef}
            isSelected={selectedPlayerId === player.id}
            setSelectedPlayerId={setSelectedPlayerId}
          />
        ))}
      </Reorder.Group>
    </div>
  );
};
