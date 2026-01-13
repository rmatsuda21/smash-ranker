import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";

export const PlayerSelector = () => {
  const playerCount = useCanvasStore((state) => state.design.players.length);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  return Array.from({ length: playerCount }).map((_, index) => (
    <Button
      key={index}
      onClick={() =>
        dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index })
      }
      variant={selectedPlayerIndex === index ? "solid" : "ghost"}
      className={selectedPlayerIndex === index ? "selected" : ""}
    >
      {index + 1}
    </Button>
  ));
};
