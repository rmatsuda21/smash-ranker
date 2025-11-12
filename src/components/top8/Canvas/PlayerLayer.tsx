import { memo } from "react";
import { Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { LayoutConfig } from "@/types/top8/Layout";
import { usePlayerStore } from "@/store/playerStore";

type PlayerLayerProps = {
  ref: React.RefObject<Konva.Layer | null>;
  onPlayerDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  layout: LayoutConfig | null;
};

const PlayerLayerComponent = ({
  ref,
  onPlayerDragStart,
  onPlayerDragEnd,
  layout,
}: PlayerLayerProps) => {
  const players = usePlayerStore((state) => state.players);
  const playerOrder = usePlayerStore((state) => state.playerOrder);

  if (!layout) return <Layer ref={ref} />;

  return (
    <Layer ref={ref}>
      {playerOrder.map((playerIndex, index) => {
        const player = players[playerIndex];
        if (!player) return null;

        const layoutConfig = layout.players[index];
        if (!layoutConfig) return null;

        return (
          <Player
            key={player.id}
            size={layoutConfig.size}
            position={layoutConfig.position}
            scale={layoutConfig.scale}
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
