import { useCallback, useEffect, useMemo, useRef } from "react";
import { Group, Layer, Transformer } from "react-konva";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Group as KonvaGroup } from "konva/lib/Group";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { KonvaEventObject } from "konva/lib/Node";

export const TournamentLayer = () => {
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const tournamentLayout = useCanvasStore((state) => state.layout.tournament);
  const cavnasConfig = useCanvasStore((state) => state.layout.canvas);
  const tournament = useTournamentStore((state) => state.info);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const transformerRef = useRef<KonvaTransformer>(null);
  const groupRef = useRef<KonvaGroup>(null);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(tournamentLayout?.elements ?? [], {
        fontFamily: selectedFont,
        tournament,
        containerSize: cavnasConfig.size,
      }),
    [tournamentLayout?.elements, selectedFont, tournament, cavnasConfig.size]
  );

  useEffect(() => {
    if (
      selectedElementIndex !== -1 &&
      transformerRef.current &&
      groupRef.current
    ) {
      const node = groupRef.current.children[selectedElementIndex];
      if (node) {
        transformerRef.current.nodes([node]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementIndex, konvaElements]);

  const handleTransform = useCallback((e: KonvaEventObject<MouseEvent>) => {
    console.log("handleTransform", e);
  }, []);

  return (
    <Layer>
      <Group
        ref={groupRef}
        width={cavnasConfig.size.width}
        height={cavnasConfig.size.height}
      >
        {konvaElements}
        <Transformer
          name={`transformer-${selectedElementIndex}`}
          ref={transformerRef}
          onTransform={handleTransform}
        />
      </Group>
    </Layer>
  );
};
