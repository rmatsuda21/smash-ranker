import { memo } from "react";
import { Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";

type PlayerLayerProps = {
  ref: React.RefObject<Konva.Layer | null>;
  onPlayerDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};

const PlayerLayerComponent = ({
  ref,
  onPlayerDragStart,
  onPlayerDragEnd,
}: PlayerLayerProps) => {
  const players = usePlayerStore((state) => state.players);
  const playerOrder = usePlayerStore((state) => state.playerOrder);
  const layout = useCanvasStore((state) => state.layout);

  if (!layout) return <Layer ref={ref} />;

  return (
    <Layer ref={ref}>
      {playerOrder.map((playerIndex, index) => {
        const player = players[playerIndex];
        if (!player) return null;

        const playerConfig = layout.players[index];
        if (!playerConfig) return null;

        return (
          <Player
            key={player.id}
            config={playerConfig}
            player={player}
            index={index}
            onDragStart={onPlayerDragStart}
            onDragEnd={onPlayerDragEnd}
          />
        );
      })}
    </Layer>
  );
};

export const PlayerLayer = memo(PlayerLayerComponent);
