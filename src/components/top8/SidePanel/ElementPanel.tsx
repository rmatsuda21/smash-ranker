import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { ElementEditor } from "@/components/top8/ElementEditor/ElementEditor";
import { ElementConfig } from "@/types/top8/LayoutTypes";

type Props = {
  className?: string;
};

export const ElementPanel = ({ className }: Props) => {
  const tournamentLayout = useCanvasStore((state) => state.layout.tournament);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const handleAddElement = (element: ElementConfig) => {
    canvasDispatch({
      type: "ADD_TOURNAMENT_ELEMENT",
      payload: element,
    });
  };

  const handleElementSelect = (index: number) => {
    tournamentDispatch({ type: "SET_SELECTED_ELEMENT_INDEX", payload: index });
  };

  const handleUpdateElement = (element: ElementConfig) => {
    canvasDispatch({
      type: "EDIT_TOURNAMENT_ELEMENT",
      payload: { index: selectedElementIndex, element },
    });
  };

  return (
    <div className={className}>
      <ElementEditor
        elements={tournamentLayout?.elements ?? []}
        selectedElementIndex={selectedElementIndex}
        onAddElement={handleAddElement}
        onElementSelect={handleElementSelect}
        onUpdateElement={handleUpdateElement}
      />
    </div>
  );
};
