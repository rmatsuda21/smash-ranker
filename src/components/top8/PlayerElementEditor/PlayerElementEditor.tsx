import { useMemo, useState } from "react";
import { Layer, Stage } from "react-konva";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { ElementEditor } from "@/components/top8/ElementEditor/ElementEditor";
import { ElementConfig } from "@/types/top8/LayoutTypes";

import styles from "./PlayerElementEditor.module.scss";

const examplePlayer: PlayerInfo = {
  id: "1",
  name: "T1 | Reo M",
  characters: [{ id: "1293", alt: 0 }],
  country: "US",
  twitter: "test_player",
  placement: 1,
  gamerTag: "Reo M",
  prefix: "T1",
};

type Props = {
  className?: string;
};

export const PlayerElementEditor = ({ className }: Props) => {
  const basePlayer = useCanvasStore((state) => state.layout.basePlayer);
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const tournament = useTournamentStore((state) => state.info);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const [selectedElementIndex, setSelectedElementIndex] = useState(0);

  const konvaElements = useMemo(() => {
    return createKonvaElements(basePlayer.elements, {
      fontFamily: selectedFont,
      containerSize: basePlayer.size,
      player: examplePlayer,
      tournament,
    });
  }, [basePlayer.elements, selectedFont, basePlayer.size, tournament]);

  const handleAddElement = (element: ElementConfig) => {
    canvasDispatch({
      type: "UPDATE_BASE_PLAYER_CONFIG",
      payload: {
        elements: [...basePlayer.elements, element],
      },
    });
  };

  const handleElementSelect = (index: number) => {
    setSelectedElementIndex(index);
  };

  const handleUpdateElement = (element: ElementConfig) => {
    canvasDispatch({
      type: "UPDATE_BASE_ELEMENT_CONFIG",
      payload: { index: selectedElementIndex, element },
    });
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        className={styles.playerPreview}
        style={
          {
            "--preview-width": "150px",
            "--preview-height": "150px",
            "--player-width": `${basePlayer.size.width}px`,
            "--player-height": `${basePlayer.size.height}px`,
          } as React.CSSProperties
        }
      >
        <div className={styles.viewport}>
          <Stage width={basePlayer.size.width} height={basePlayer.size.height}>
            <Layer>{konvaElements}</Layer>
          </Stage>
        </div>
      </div>
      <ElementEditor
        elements={basePlayer.elements}
        selectedElementIndex={selectedElementIndex}
        onAddElement={handleAddElement}
        onElementSelect={handleElementSelect}
        onUpdateElement={handleUpdateElement}
      />
    </div>
  );
};
