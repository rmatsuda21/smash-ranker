import { ComponentProps, useState, useEffect, useRef } from "react";
import { Image } from "react-konva";
import Konva from "konva";

const BACKDROP_OFFSET = 10;

type Props = Omit<ComponentProps<typeof Image>, "image"> & {
  width: number;
  height: number;
  imageSrc: string;
  hasBackdrop?: boolean;
  backdropColor?: string;
  offset?: { x: number; y: number };
  onReady?: () => void;
  onError?: (error: Error) => void;
};

export const ContainedImage = ({
  width,
  height,
  imageSrc,
  hasBackdrop = false,
  backdropColor = "red",
  x = 0,
  y = 0,
  offset = { x: 0, y: 0 },
  onReady,
  onError,
  ...rest
}: Props) => {
  const [finalImage, setFinalImage] = useState<HTMLImageElement>();
  const [image, setImage] = useState<HTMLImageElement>();
  const ref = useRef<Konva.Image>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.clearCache();
    }

    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      setImage(image);
    };

    return () => {
      image.src = "";
      image.onload = null;
      image.onerror = null;
      image.remove();
      ref.current?.clearCache();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!image) return;

    const drawContainedImage = (
      ctx: CanvasRenderingContext2D,
      xPos: number,
      yPos: number
    ) => {
      const imageAspectRatio = image.width / image.height;
      const containerAspectRatio = width / height;

      let imgWidth = width;
      let imgHeight = height;
      let imgX = 0;
      let imgY = 0;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container
        imgHeight = width / imageAspectRatio;
        imgY = (height - imgHeight) / 2;
      } else {
        // Image is taller than container
        imgWidth = height * imageAspectRatio;
        imgX = (width - imgWidth) / 2;
      }

      ctx.drawImage(
        image,
        xPos + imgX + offset.x,
        yPos + imgY + offset.y,
        imgWidth,
        imgHeight
      );
    };

    const createImage = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      if (hasBackdrop) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");

        if (!tempCtx) return;

        drawContainedImage(tempCtx, 0, 0);

        ctx.drawImage(tempCanvas, BACKDROP_OFFSET, BACKDROP_OFFSET);
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = backdropColor;
        ctx.fillRect(BACKDROP_OFFSET, BACKDROP_OFFSET, width, height);

        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        drawContainedImage(ctx, 0, 0);
      }

      const img = new window.Image();
      img.src = canvas.toDataURL();
      img.onload = () => {
        setFinalImage(img);
        ref.current?.cache();
        onReady?.();
      };
      img.onerror = (error) => {
        onError?.(
          new Error(error instanceof Error ? error.message : "Unknown error")
        );
      };
    };

    createImage();
  }, [image, width, height, offset.x, offset.y, hasBackdrop, backdropColor]);

  if (!finalImage) return null;

  return (
    <Image
      ref={ref}
      x={x}
      y={y}
      width={width}
      height={height}
      image={finalImage}
      {...rest}
    />
  );
};
