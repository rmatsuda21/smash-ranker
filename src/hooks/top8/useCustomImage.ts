import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

export const useCustomImage = ({
  imageSrc,
  width,
  height,
  fillMode = "contain",
  offset = { x: 0, y: 0 },
  onReady,
  onError,
}: {
  imageSrc: string;
  width: number;
  height: number;
  fillMode: "contain" | "cover";
  offset: { x: number; y: number };
  onReady?: () => void;
  onError?: (error: Error) => void;
}) => {
  const [finalImage, setFinalImage] = useState<HTMLImageElement>();
  const [image, setImage] = useState<HTMLImageElement>();
  const ref = useRef<KonvaImage>(null);

  useEffect(() => {
    const imgRef = ref.current;

    if (imgRef) {
      imgRef.clearCache();
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
      imgRef?.clearCache();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!image) return;

    const fitImage = (
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
        if (fillMode === "contain") {
          imgHeight = width / imageAspectRatio;
          imgY = (height - imgHeight) / 2;
        } else {
          imgWidth = height * imageAspectRatio;
          imgX = (width - imgWidth) / 2;
        }
      } else {
        // Image is taller than container
        if (fillMode === "contain") {
          imgWidth = height * imageAspectRatio;
          imgX = (width - imgWidth) / 2;
        } else {
          imgHeight = width / imageAspectRatio;
          imgY = (height - imgHeight) / 2;
        }
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

      fitImage(ctx, 0, 0);

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
  }, [image, width, height, offset.x, offset.y, fillMode, onReady, onError]);

  return {
    finalImage,
    image,
    ref,
  };
};
