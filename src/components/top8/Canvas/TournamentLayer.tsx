import { useEffect, useMemo, useRef } from "react";
import { Group, Layer, Transformer } from "react-konva";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Group as KonvaGroup } from "konva/lib/Group";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";

export const TournamentLayer = () => {
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const layout = useCanvasStore((state) => state.layout.tournament);
  const canvasConfig = useCanvasStore((state) => state.layout.canvas);
  const tournament = useTournamentStore((state) => state.info);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const transformerRef = useRef<KonvaTransformer>(null);
  const groupRef = useRef<KonvaGroup>(null);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(layout?.elements ?? [], {
        fontFamily: selectedFont,
        tournament,
        containerSize: canvasConfig.size,
        canvas: canvasConfig,
      }),
    [layout?.elements, selectedFont, tournament, canvasConfig]
  );

  useEffect(() => {
    if (
      selectedElementIndex !== -1 &&
      transformerRef.current &&
      groupRef.current
    ) {
      const node = groupRef.current.children[selectedElementIndex];
      const visible = node?.attrs.visible;
      if (node) {
        if (visible) {
          transformerRef.current.nodes([node]);
        } else {
          transformerRef.current.nodes([]);
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementIndex, konvaElements]);

  return (
    <Layer>
      <Group
        ref={groupRef}
        width={canvasConfig.size.width}
        height={canvasConfig.size.height}
      >
        {konvaElements}
        <Transformer
          name={`transformer-${selectedElementIndex}`}
          ref={transformerRef}
        />
      </Group>
    </Layer>
  );
};
