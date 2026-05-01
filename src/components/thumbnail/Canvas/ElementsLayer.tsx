import { Layer } from "react-konva";

import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import { ElementNode } from "@/components/thumbnail/Elements/ElementNode";

type Props = {
  elements: ThumbnailElement[];
  draggable: boolean;
};

export const ElementsLayer = ({ elements, draggable }: Props) => {
  return (
    <Layer>
      {elements.map((element) => (
        <ElementNode
          key={element.id}
          element={element}
          draggable={draggable}
        />
      ))}
    </Layer>
  );
};
