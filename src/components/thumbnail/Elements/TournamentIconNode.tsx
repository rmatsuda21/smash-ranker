import { memo, useEffect, useState } from "react";
import { Group, Image as KonvaImage, Rect } from "react-konva";

import { TournamentIconElement } from "@/types/thumbnail/ThumbnailDesign";

type Props = {
  element: TournamentIconElement;
  draggable: boolean;
};

const TournamentIconNodeComponent = ({ element, draggable }: Props) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!element.src) {
      setImage(null);
      return;
    }
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

  const cornerRadius = element.cornerRadius ?? 0;

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
      {image ? (
        <KonvaImage
          image={image}
          width={element.width}
          height={element.height}
          listening={false}
        />
      ) : (
        <Rect
          width={element.width}
          height={element.height}
          fill="#444"
          stroke="#888"
          strokeWidth={2}
          dash={[6, 6]}
        />
      )}
    </Group>
  );
};

export const TournamentIconNode = memo(TournamentIconNodeComponent);
