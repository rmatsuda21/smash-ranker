import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";

import styles from "./PlayersEditor.module.scss";

export const PlayerSelector = () => {
  const playerCount = useCanvasStore((state) => state.design.players.length);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex,
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  return Array.from({ length: playerCount }).map((_, index) => {
    const isSelected = selectedPlayerIndex === index;
    return (
      <Button
        key={index}
        size="sm"
        onClick={() =>
          dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index })
        }
        variant={isSelected ? "solid" : "ghost"}
        className={isSelected ? undefined : styles.unselected}
      >
        {index + 1}
      </Button>
    );
  });
};
