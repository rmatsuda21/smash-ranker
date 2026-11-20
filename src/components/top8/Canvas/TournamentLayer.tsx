import { useCallback, useEffect, useRef } from "react";
import { Group, Layer, Transformer } from "react-konva";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Group as KonvaGroup } from "konva/lib/Group";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentContent } from "@/components/top8/Canvas/scene/TournamentContent";
import {
  useSceneDesign,
  useTournamentElements,
} from "@/hooks/top8/useSceneState";
import { useFontStore } from "@/store/fontStore";
import { useEditorStore } from "@/store/editorStore";
import { EditorTab } from "@/types/top8/Editor";

export const TournamentLayer = ({ onReady }: { onReady?: () => void }) => {
  const transformerRef = useRef<KonvaTransformer>(null);
  const groupRef = useRef<KonvaGroup>(null);

  const displayedFont = useFontStore((state) => state.displayedFont);
  const elements = useTournamentElements();
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize),
  );
  const tournament = useTournamentStore((state) => state.info);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex,
  );
  const dispatch = useEditorStore((state) => state.dispatch);

  const handleElementSelect = useCallback(() => {
    dispatch({
      type: "SET_ACTIVE_TAB",
      payload: EditorTab.TEXTS,
    });
  }, [dispatch]);

  const design = useSceneDesign();

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
  }, [
    selectedElementIndex,
    // Re-attach whenever the elements may have been rebuilt.
    elements,
    displayedFont,
    tournament,
    design,
  ]);

  return (
    <Layer>
      <Group ref={groupRef} width={canvasSize.width} height={canvasSize.height}>
        <TournamentContent
          elements={elements}
          canvasSize={canvasSize}
          design={design}
          fontFamily={displayedFont}
          tournament={tournament}
          onElementSelect={handleElementSelect}
          onReady={onReady}
        />
        <Transformer
          name={`transformer-${selectedElementIndex}`}
          ref={transformerRef}
        />
      </Group>
    </Layer>
  );
};
