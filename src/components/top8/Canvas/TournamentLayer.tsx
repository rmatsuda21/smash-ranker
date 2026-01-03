import { useCallback, useEffect, useMemo, useRef } from "react";
import { Group, Layer, Transformer } from "react-konva";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Group as KonvaGroup } from "konva/lib/Group";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { useFontStore } from "@/store/fontStore";
import { useEditorStore } from "@/store/editorStore";
import { EditorTab } from "@/types/top8/Editor";

export const TournamentLayer = () => {
  const transformerRef = useRef<KonvaTransformer>(null);
  const groupRef = useRef<KonvaGroup>(null);

  const selectedFont = useFontStore((state) => state.selectedFont);
  const layout = useCanvasStore((state) => state.design.tournament);
  const canvasSize = useCanvasStore((state) => state.design.canvasSize);
  const colorPalette = useCanvasStore((state) => state.design.colorPalette);
  const textPalette = useCanvasStore((state) => state.design.textPalette);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const tournament = useTournamentStore((state) => state.info);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const dispatch = useEditorStore((state) => state.dispatch);

  const handleElementSelect = useCallback(() => {
    dispatch({
      type: "SET_ACTIVE_TAB",
      payload: EditorTab.TEXTS,
    });
  }, [dispatch]);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(layout?.elements ?? [], {
        fontFamily: selectedFont,
        tournament,
        containerSize: canvasSize,
        design: { colorPalette, textPalette, bgAssetId },
        onElementSelect: handleElementSelect,
      }),
    [
      layout?.elements,
      selectedFont,
      tournament,
      canvasSize,
      colorPalette,
      textPalette,
      bgAssetId,
      handleElementSelect,
    ]
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
        width={canvasSize.width}
        height={canvasSize.height}
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
