import { useRef } from "react";
import { Reorder } from "framer-motion";
import { useDragControls } from "motion/react";
import { MdDragIndicator } from "react-icons/md";
import cn from "classnames";

import { PlayerInfo } from "@/types/top8/Result";

import styles from "./PlayerList.module.scss";
import { PlayerForm } from "../PlayerForm/PlayerForm";

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
  updatePlayer: (player: PlayerInfo) => void;
  setSelectedPlayerId: (playerId: string) => void;
};

const PlayerItem = ({
  player,
  containerRef,
  isSelected,
  updatePlayer,
  setSelectedPlayerId,
}: PlayerItemProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      className={styles.item}
      key={player.id}
      value={player}
      dragConstraints={containerRef}
      dragListener={false}
      dragControls={controls}
      onClick={() => setSelectedPlayerId(player.id)}
    >
      <div className={styles.header}>
        <div
          className={styles.dragHandle}
          onPointerDown={(e) => controls.start(e)}
        >
          <MdDragIndicator color={isSelected ? "blue" : "white"} />
        </div>
        <h3>{player.name}</h3>
      </div>
      {isSelected && (
        <PlayerForm selectedPlayer={player} updatePlayer={updatePlayer} />
      )}
    </Reorder.Item>
  );
};

export const PlayerList = ({
  className,
  players,
  setPlayers,
  selectedPlayerId,
  updatePlayer,
  setSelectedPlayerId,
}: Props) => {
  const containerRef = useRef(null);

  return (
    <Reorder.Group
      as="div"
      ref={containerRef}
      className={cn(styles.wrapper, className)}
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
          updatePlayer={updatePlayer}
          setSelectedPlayerId={setSelectedPlayerId}
        />
      ))}
    </Reorder.Group>
  );
};
