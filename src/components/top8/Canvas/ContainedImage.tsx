import { ComponentProps, useState, useEffect } from "react";
import { Image } from "react-konva";

export const ContainedImage = ({
  width,
  height,
  image,
  hasBackdrop = false,
  backdropColor = "red",
  x = 0,
  y = 0,
  offset = { x: 0, y: 0 },
  onReady,
  onError,
  ...rest
}: ComponentProps<typeof Image> & {
  width: number;
  height: number;
  image: HTMLImageElement;
  hasBackdrop?: boolean;
  backdropColor?: string;
  offset?: { x: number; y: number };
  onReady?: () => void;
  onError?: (error: Error) => void;
}) => {
  const [finalImage, setFinalImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (!image) {
      setFinalImage(undefined);
      return;
    }

    const backdropOffset = 10;

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
        // First, draw the main image to a temporary canvas to create the backdrop
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");

        if (!tempCtx) return;

        drawContainedImage(tempCtx, 0, 0);

        // Draw backdrop (colored version) at offset position
        ctx.drawImage(tempCanvas, backdropOffset, backdropOffset);
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = backdropColor;
        ctx.fillRect(backdropOffset, backdropOffset, width, height);

        // Reset composite operation and draw main image on top
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        // Just draw the main image without backdrop
        drawContainedImage(ctx, 0, 0);
      }

      const img = new window.Image();
      img.src = canvas.toDataURL();
      img.onload = () => {
        setFinalImage(img);
        onReady?.();
      };
      img.onerror = (error) => {
        onError?.(
          new Error(error instanceof Error ? error.message : "Unknown error")
        );
      };
    };

    createImage();
  }, [image, width, height, offset, hasBackdrop, backdropColor]);

  if (!finalImage) return null;

  return (
    <Image
      x={x}
      y={y}
      width={width}
      height={height}
      image={finalImage}
      {...rest}
    />
  );
};
