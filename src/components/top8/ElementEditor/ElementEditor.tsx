import { Button } from "@radix-ui/themes";
import { LuPlus } from "react-icons/lu";

import { useCanvasStore } from "@/store/canvasStore";
import { ConfigEditor } from "@/components/top8/ElementEditor/ConfigEditor";
import { useTournamentStore } from "@/store/tournamentStore";

export const ElementEditor = () => {
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const dispatch = useCanvasStore((state) => state.dispatch);
  const tournamentElements = useCanvasStore(
    (state) => state.layout.tournament?.elements
  );

  const handleClick = (index: number) => {
    tournamentDispatch({ type: "SET_SELECTED_ELEMENT_INDEX", payload: index });
  };

  const addElement = () => {
    dispatch({
      type: "ADD_TOURNAMENT_ELEMENT",
      payload: {
        type: "text",
        text: "Hello",
        fill: "yellow",
        fontSize: 200,
        fontWeight: "bold",
        position: { x: 0, y: 0 },
      },
    });
  };

  return (
    <div>
      <Button variant="outline" size="2" onClick={addElement}>
        <LuPlus />
        Add Element
      </Button>
      <div>
        {tournamentElements?.map((element, index) => (
          <Button
            key={`${element.type}-${index}`}
            onClick={() => handleClick(index)}
            variant={index === selectedElementIndex ? "solid" : "outline"}
          >
            {element.type}
          </Button>
        ))}
      </div>
      {selectedElementIndex !== -1 &&
        tournamentElements?.[selectedElementIndex] && (
          <ConfigEditor
            index={selectedElementIndex}
            element={tournamentElements?.[selectedElementIndex]}
          />
        )}
    </div>
  );
};
