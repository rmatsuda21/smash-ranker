import { useEffect } from "react";
import { Layer, Transformer } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { Node } from "konva/lib/Node";

import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";

const ALL_ANCHORS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-right",
  "bottom-right",
  "bottom-center",
  "bottom-left",
  "middle-left",
];

type BoundBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type Props = {
  stage: KonvaStage | null;
  selectedIds: string[];
  selectedElements: ThumbnailElement[];
  transformerRef: React.RefObject<KonvaTransformer | null>;
  hidden?: boolean;
  boundBoxFunc?: (oldBox: BoundBox, newBox: BoundBox) => BoundBox;
};

export const TransformerLayer = ({
  stage,
  selectedIds,
  selectedElements,
  transformerRef,
  hidden = false,
  boundBoxFunc,
}: Props) => {
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (!stage || hidden) {
      tr.nodes([]);
      return;
    }
    const nodes: Node[] = [];
    for (const id of selectedIds) {
      const n = stage.findOne(`#${id}`);
      if (n) nodes.push(n);
    }
    tr.nodes(nodes);
    tr.enabledAnchors(ALL_ANCHORS);
    tr.getLayer()?.batchDraw();
  }, [stage, selectedIds, selectedElements, transformerRef, hidden]);

  return (
    <Layer>
      <Transformer
        ref={transformerRef}
        rotateEnabled
        keepRatio={false}
        ignoreStroke
        anchorSize={12}
        anchorStroke="#3a8eff"
        anchorFill="#fff"
        borderStroke="#3a8eff"
        borderDash={[6, 4]}
        rotateAnchorOffset={28}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 8 || newBox.height < 8) return oldBox;
          return boundBoxFunc ? boundBoxFunc(oldBox, newBox) : newBox;
        }}
      />
    </Layer>
  );
};
