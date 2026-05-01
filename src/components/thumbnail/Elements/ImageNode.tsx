import { memo, useEffect, useState } from "react";
import { Group, Image as KonvaImage } from "react-konva";

import { ImageElement } from "@/types/thumbnail/ThumbnailDesign";

type Props = {
  element: ImageElement;
  draggable: boolean;
};

const ImageNodeComponent = ({ element, draggable }: Props) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    if (
      element.src.startsWith("http://") ||
      element.src.startsWith("https://")
    ) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.onerror = () => {
      if (!cancelled) setImage(null);
    };
    img.src = element.src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [element.src]);

  if (!image) {
    return null;
  }

  const cornerRadius = element.cornerRadius ?? 0;

  // fillMode logic — compute draw rect inside the bounding box
  const imgAspect = image.width / image.height;
  const boxAspect = element.width / element.height;
  let dx = 0;
  let dy = 0;
  let dWidth = element.width;
  let dHeight = element.height;
  if (element.fillMode === "contain") {
    if (imgAspect > boxAspect) {
      dHeight = element.width / imgAspect;
      dy = (element.height - dHeight) / 2;
    } else {
      dWidth = element.height * imgAspect;
      dx = (element.width - dWidth) / 2;
    }
  } else {
    if (imgAspect > boxAspect) {
      dWidth = element.height * imgAspect;
      dx = (element.width - dWidth) / 2;
    } else {
      dHeight = element.width / imgAspect;
      dy = (element.height - dHeight) / 2;
    }
  }

  return (
    <Group
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
      clipFunc={
        cornerRadius > 0
          ? (ctx) => {
              const r = Math.min(
                cornerRadius,
                element.width / 2,
                element.height / 2,
              );
              ctx.beginPath();
              ctx.moveTo(r, 0);
              ctx.lineTo(element.width - r, 0);
              ctx.quadraticCurveTo(element.width, 0, element.width, r);
              ctx.lineTo(element.width, element.height - r);
              ctx.quadraticCurveTo(
                element.width,
                element.height,
                element.width - r,
                element.height,
              );
              ctx.lineTo(r, element.height);
              ctx.quadraticCurveTo(0, element.height, 0, element.height - r);
              ctx.lineTo(0, r);
              ctx.quadraticCurveTo(0, 0, r, 0);
              ctx.closePath();
            }
          : undefined
      }
    >
      <KonvaImage
        image={image}
        x={dx}
        y={dy}
        width={dWidth}
        height={dHeight}
        listening={false}
      />
    </Group>
  );
};

export const ImageNode = memo(ImageNodeComponent);
