import { useCallback, useMemo, useState } from "react";
import cn from "classnames";

import { useFontStore } from "@/store/fontStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { PlayerInfo } from "@/types/top8/Player";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { ElementEditor } from "@/components/top8/ElementEditor/ElementEditor";
import { ElementConfig } from "@/types/top8/Design";
import { PlayerPreview } from "@/components/top8/PlayerElementEditor/PlayerPreview/PlayerPreview";

import styles from "./PlayerElementEditor.module.scss";

const examplePlayer: PlayerInfo = {
  id: "1",
  entrantId: "1",
  name: "T1 | Reo M",
  characters: [{ id: "1293", alt: 0 }],
  country: "US",
  twitter: "chikyunojin",
  placement: 1,
  gamerTag: "Reo M",
  prefix: "T1",
};

type Props = {
  className?: string;
};

export const PlayerElementEditor = ({ className }: Props) => {
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const tournament = useTournamentStore((state) => state.info);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const colorPalette = useCanvasStore((state) => state.design.colorPalette);
  const textPalette = useCanvasStore((state) => state.design.textPalette);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);

  const [selectedElementIndex, setSelectedElementIndex] = useState(0);

  const konvaElements = useMemo(() => {
    return createKonvaElements(basePlayer.elements, {
      fontFamily: selectedFont,
      containerSize: basePlayer.size,
      player: examplePlayer,
      tournament,
      design: { colorPalette, textPalette, bgAssetId },
    });
  }, [
    basePlayer.elements,
    selectedFont,
    basePlayer.size,
    tournament,
    colorPalette,
    textPalette,
    bgAssetId,
  ]);

  const handleAddElement = useCallback(
    (element: ElementConfig) => {
      canvasDispatch({
        type: "UPDATE_BASE_PLAYER_CONFIG",
        payload: {
          elements: [...basePlayer.elements, element],
        },
      });
    },
    [canvasDispatch, basePlayer.elements]
  );

  const handleElementSelect = useCallback(
    (index: number) => {
      setSelectedElementIndex(index);
    },
    [setSelectedElementIndex]
  );

  const handleUpdateElement = useCallback(
    (element: ElementConfig) => {
      canvasDispatch({
        type: "UPDATE_BASE_ELEMENT_CONFIG",
        payload: { index: selectedElementIndex, element },
      });
    },
    [canvasDispatch, selectedElementIndex]
  );

  return (
    <div className={cn(styles.wrapper, className)}>
      <PlayerPreview basePlayer={basePlayer} konvaElements={konvaElements} />
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
