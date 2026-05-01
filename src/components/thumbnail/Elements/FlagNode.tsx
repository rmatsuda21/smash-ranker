import { memo } from "react";
import { Image as KonvaImage } from "react-konva";

import { FlagElement } from "@/types/thumbnail/ThumbnailDesign";
import { useSvgImage } from "@/hooks/top8/useSvgImage";

type Props = {
  element: FlagElement;
  draggable: boolean;
};

const EMPTY_PALETTE: Record<string, string> = {};

const FlagNodeComponent = ({ element, draggable }: Props) => {
  const url =
    element.customSrc ?? `/assets/flags/${element.country.toLowerCase()}.svg`;
  const [image] = useSvgImage({ svgUrl: url, palette: EMPTY_PALETTE });

  if (!image) return null;

  return (
    <KonvaImage
      id={element.id}
      name={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      listening={!element.locked}
      draggable={draggable && !element.locked}
      image={image}
    />
  );
};

export const FlagNode = memo(FlagNodeComponent);
