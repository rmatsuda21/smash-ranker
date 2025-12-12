import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

export const useCustomImage = ({
  imageSrc,
  width,
  height,
  fillMode = "contain",
  align = "center",
  offset = { x: 0, y: 0 },
  onReady,
  onError,
}: {
  imageSrc: string;
  width: number;
  height: number;
  fillMode: "contain" | "cover";
  align?: "center" | "left" | "right" | "top" | "bottom";
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
    image.onerror = (error) => {
      onError?.(
        new Error(error instanceof Error ? error.message : "Unknown error")
      );
      setImage(undefined);
      setFinalImage(undefined);
    };

    return () => {
      image.src = "";
      image.onload = null;
      image.onerror = null;
      image.remove();
      imgRef?.clearCache();
    };
  }, [imageSrc, onError]);

  useEffect(() => {
    if (!image) return;

    const fitImage = (ctx: CanvasRenderingContext2D) => {
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
          const remainingHeight = height - imgHeight;
          if (align === "top") {
            imgY = 0;
          } else if (align === "bottom") {
            imgY = remainingHeight;
          } else {
            imgY = remainingHeight / 2;
          }
        } else {
          imgWidth = height * imageAspectRatio;
          imgX = (width - imgWidth) / 2;
        }
      } else {
        // Image is taller than container
        if (fillMode === "contain") {
          imgWidth = height * imageAspectRatio;
          const remainingWidth = width - imgWidth;
          if (align === "left") {
            imgX = 0;
          } else if (align === "right") {
            imgX = remainingWidth;
          } else {
            imgX = remainingWidth / 2;
          }
        } else {
          imgHeight = width / imageAspectRatio;
          imgY = (height - imgHeight) / 2;
        }
      }

      ctx.drawImage(
        image,
        imgX + offset.x,
        imgY + offset.y,
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

      fitImage(ctx);

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
  }, [
    image,
    width,
    height,
    offset.x,
    offset.y,
    fillMode,
    align,
    onReady,
    onError,
  ]);

  return {
    finalImage,
    image,
    ref,
  };
};
