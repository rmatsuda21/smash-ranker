import { memo, useMemo } from "react";
import { Layer } from "react-konva";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { PlayerLayoutConfig } from "@/types/top8/Layout";

type PlayerLayerProps = {
  ref: React.RefObject<KonvaLayer | null>;
  onPlayerDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
};

const PlayerLayerComponent = ({
  ref,
  onPlayerDragStart,
  onPlayerDragEnd,
}: PlayerLayerProps) => {
  const players = usePlayerStore((state) => state.players);
  const layout = useCanvasStore((state) => state.layout);

  const playerConfigs: PlayerLayoutConfig[] = useMemo(() => {
    return layout.players.map((player) => ({
      ...layout.basePlayer,
      ...player,
    }));
  }, [layout.basePlayer, layout.players]);

  if (!layout) return <Layer ref={ref} />;

  return (
    <Layer ref={ref}>
      {players.map((player, index) => {
        return (
          <Player
            key={player.id}
            config={playerConfigs[index]}
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
