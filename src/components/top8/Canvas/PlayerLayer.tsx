import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Layer, Transformer } from "react-konva";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { PlayerLayoutConfig } from "@/types/top8/LayoutTypes";

type Props = {
  ref: React.RefObject<KonvaLayer | null>;
  onPlayerDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
};

const PlayerLayerComponent = ({
  ref,
  onPlayerDragStart,
  onPlayerDragEnd,
}: Props) => {
  const trRef = useRef<KonvaTransformer>(null);

  const players = usePlayerStore((state) => state.players);
  const layout = useCanvasStore((state) => state.layout);
  const dispatch = useCanvasStore((state) => state.dispatch);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );

  const playerConfigs: PlayerLayoutConfig[] = useMemo(() => {
    return layout.players.map((player) => ({
      ...layout.basePlayer,
      ...player,
    }));
  }, [layout.basePlayer, layout.players]);

  useEffect(() => {
    if (selectedPlayerIndex !== -1 && trRef.current) {
      const node = ref.current?.findOne(`#${players[selectedPlayerIndex].id}`);
      if (node) {
        trRef.current.nodes([node]);
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedPlayerIndex, ref, players]);

  const handleTransform = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const config = {
        ...layout.basePlayer,
        ...layout.players[selectedPlayerIndex],
      };
      dispatch({
        type: "UPDATE_PLAYER_CONFIG",
        payload: {
          index: selectedPlayerIndex,
          config: {
            ...config,
            scale: { x: e.target.scaleX(), y: e.target.scaleY() },
            rotation: e.target.rotation() ?? 0,
          },
        },
      });
    },
    [selectedPlayerIndex, layout.basePlayer, layout.players, dispatch]
  );

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
            isSelected={selectedPlayerIndex === index}
          />
        );
      })}
      <Transformer
        name="player-transformer"
        ref={trRef}
        onTransform={handleTransform}
      />
    </Layer>
  );
};

export const PlayerLayer = memo(PlayerLayerComponent);
