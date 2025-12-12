import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@radix-ui/themes";

export const PlayerSelector = () => {
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  return Array.from({ length: players.length }).map((_, index) => (
    <Button
      key={index}
      onClick={() =>
        dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index })
      }
      variant={selectedPlayerIndex === index ? "solid" : "outline"}
    >
      {index + 1}
    </Button>
  ));
};
