import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";

import { Player } from "@/components/top8/Canvas/Player";
import { getPlayerPaintOrder } from "@/utils/top8/scene";
import type { Design, PlayerDesign } from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";

import { useLatestCallback } from "@/hooks/useLatestCallback";
import type { SceneDesign } from "@/hooks/top8/useSceneFactoryContext";

type DragHandler = (e: KonvaEventObject<MouseEvent>) => void;

type Props = {
  players: PlayerInfo[];
  /** One layout per design slot; players beyond the last slot are not drawn. */
  configs: PlayerDesign[];
  reverseZOrder?: boolean;
  canvasSize: Design["canvasSize"];
  design: SceneDesign;
  fontFamily: string;
  editable?: boolean;
  onDragStart?: DragHandler;
  onDragEnd?: DragHandler;
  onHoverChange?: (playerId: string, isHovered: boolean) => void;
  /** Called once every drawn player has loaded its images. */
  onReady?: () => void;
};

const noop = () => {};

/** One `Player` per occupied design slot. Renders bare nodes; the caller
 *  decides which layer or group they live in. */
export const PlayersContent = memo(
  ({
    players,
    configs,
    reverseZOrder,
    canvasSize,
    design,
    fontFamily,
    editable = false,
    onDragStart = noop,
    onDragEnd = noop,
    onHoverChange,
    onReady,
  }: Props) => {
    // Player elements only resolve colors. Narrowing here keeps text edits
    // and background-image changes from rebuilding every player.
    const { colorPalette } = design;
    const playerDesign = useMemo<SceneDesign>(
      () => ({ colorPalette }),
      [colorPalette],
    );

    const paintOrder = useMemo(
      () => getPlayerPaintOrder(players.length, configs.length, reverseZOrder),
      [players.length, configs.length, reverseZOrder],
    );

    // Readiness is tracked per drawn player id rather than with a counter:
    // only players in a slot mount, and a player whose elements rebuild
    // reports ready again.
    const drawnPlayerIds = useMemo(
      () => paintOrder.map((index) => players[index].id),
      [paintOrder, players],
    );
    const drawnPlayerIdsRef = useRef(drawnPlayerIds);
    drawnPlayerIdsRef.current = drawnPlayerIds;
    const readyPlayerIdsRef = useRef<Set<string>>(new Set());

    const notifyReady = useLatestCallback(onReady);
    const notifyIfAllReady = useCallback(() => {
      const ready = readyPlayerIdsRef.current;
      if (drawnPlayerIdsRef.current.every((id) => ready.has(id))) {
        notifyReady();
      }
    }, [notifyReady]);

    // Covers what no player callback will: zero drawn players, or the drawn
    // set shrinking to players that are already ready.
    useEffect(() => {
      notifyIfAllReady();
    }, [drawnPlayerIds, notifyIfAllReady]);

    return paintOrder.map((index) => {
      const player = players[index];

      return (
        <Player
          key={player.id}
          config={configs[index]}
          canvasSize={canvasSize}
          design={playerDesign}
          player={player}
          index={index}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          fontFamily={fontFamily}
          editable={editable}
          onReady={() => {
            readyPlayerIdsRef.current.add(player.id);
            notifyIfAllReady();
          }}
          onHoverChange={
            onHoverChange
              ? (isHovered) => onHoverChange(player.id, isHovered)
              : undefined
          }
        />
      );
    });
  },
);
