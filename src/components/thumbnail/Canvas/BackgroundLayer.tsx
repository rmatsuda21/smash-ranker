import { memo, useEffect, useState } from "react";
import { Layer, Rect, Image as KonvaImage } from "react-konva";

import {
  ThumbnailBackground,
  ThumbnailDesign,
} from "@/types/thumbnail/ThumbnailDesign";

type Props = {
  background: ThumbnailBackground;
  canvasSize: ThumbnailDesign["canvasSize"];
};

const useImageSrc = (src: string | null): HTMLImageElement | null => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => !cancelled && setImage(img);
    img.onerror = () => !cancelled && setImage(null);
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  return image;
};

const BackgroundLayerComponent = ({ background, canvasSize }: Props) => {
  const imgSrc = background.type === "image" ? background.src : null;
  const image = useImageSrc(imgSrc);

  return (
    <Layer listening={false}>
      {background.type === "color" && (
        <Rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill={background.color}
        />
      )}
      {background.type === "split" && (
        <>
          <Rect
            x={0}
            y={0}
            width={canvasSize.width / 2}
            height={canvasSize.height}
            fill={background.left}
          />
          <Rect
            x={canvasSize.width / 2}
            y={0}
            width={canvasSize.width / 2}
            height={canvasSize.height}
            fill={background.right}
          />
        </>
      )}
      {background.type === "image" && image && (
        <BackgroundImage
          image={image}
          fillMode={background.fillMode}
          canvasSize={canvasSize}
        />
      )}
      {background.type === "image" && !image && (
        <Rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill="#1a1a1a"
        />
      )}
    </Layer>
  );
};

const BackgroundImage = ({
  image,
  fillMode,
  canvasSize,
}: {
  image: HTMLImageElement;
  fillMode: "contain" | "cover";
  canvasSize: ThumbnailDesign["canvasSize"];
}) => {
  const imgAspect = image.width / image.height;
  const canvasAspect = canvasSize.width / canvasSize.height;
  let dx = 0;
  let dy = 0;
  let w = canvasSize.width;
  let h = canvasSize.height;
  if (fillMode === "contain") {
    if (imgAspect > canvasAspect) {
      h = canvasSize.width / imgAspect;
      dy = (canvasSize.height - h) / 2;
    } else {
      w = canvasSize.height * imgAspect;
      dx = (canvasSize.width - w) / 2;
    }
  } else {
    if (imgAspect > canvasAspect) {
      w = canvasSize.height * imgAspect;
      dx = (canvasSize.width - w) / 2;
    } else {
      h = canvasSize.width / imgAspect;
      dy = (canvasSize.height - h) / 2;
    }
  }
  return <KonvaImage image={image} x={dx} y={dy} width={w} height={h} />;
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
