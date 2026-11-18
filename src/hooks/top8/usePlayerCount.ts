import { useCallback, useEffect } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { padPlayersWithBlanks } from "@/utils/top8/samplePlayers";

/**
 * The number of player slots in the current design and, when the design
 * allows changing it (`dynamicPlayerCount`), the range and a setter.
 *
 * Player data is not touched when the count changes: a tournament load
 * already fetched more players than fit, so a new slot shows the next player
 * in the standings, and a removed slot's player is still there if the slot
 * comes back. Slots past the end of the data get blank players.
 */
export const usePlayerCount = () => {
  const count = useCanvasStore((state) => state.design.players.length);
  const config = useCanvasStore((state) => state.design.dynamicPlayerCount);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const dataCount = usePlayerStore((state) => state.players.length);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex,
  );
  const playerDispatch = usePlayerStore((state) => state.dispatch);

  // Follows the slot count however it changed (the controls, undo, a
  // template load), so every slot has a player and the selection is a slot.
  useEffect(() => {
    if (dataCount < count) {
      playerDispatch({
        type: "SET_PLAYERS",
        payload: padPlayersWithBlanks(usePlayerStore.getState().players, count),
      });
    }
    if (selectedPlayerIndex >= count) {
      playerDispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: count - 1 });
    }
  }, [count, dataCount, selectedPlayerIndex, playerDispatch]);

  const setCount = useCallback(
    (next: number) =>
      canvasDispatch({ type: "SET_PLAYER_COUNT", payload: next }),
    [canvasDispatch],
  );

  return {
    count,
    /** False when the design has a fixed number of players. */
    adjustable: Boolean(config),
    min: config?.min ?? count,
    max: config?.max ?? count,
    setCount,
  };
};
