import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

const imageCache = new Map<string, HTMLImageElement>();

export const useCustomImage = ({
  imageSrc,
  width,
  height,
  fillMode = "contain",
  align = "center",
  offset = { x: 0, y: 0 },
  cropOffset = { x: 0, y: 0 },
  cropScale = 1,
  onReady,
  onError,
}: {
  imageSrc: string;
  width: number;
  height: number;
  fillMode: "contain" | "cover";
  align?: "center" | "left" | "right" | "top" | "bottom";
  offset: { x: number; y: number };
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}) => {
  const [finalImage, setFinalImage] = useState<HTMLImageElement>();
  const [image, setImage] = useState<HTMLImageElement | undefined>(() =>
    imageCache.get(imageSrc)
  );
  const ref = useRef<KonvaImage>(null);

  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const imgRef = ref.current;

    if (imgRef) {
      imgRef.clearCache();
    }

    const cached = imageCache.get(imageSrc);
    if (cached) {
      setImage(cached);
      return;
    }

    const image = new window.Image();
    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      image.crossOrigin = "anonymous";
    }
    image.src = imageSrc;
    image.onload = () => {
      imageCache.set(imageSrc, image);
      setImage(image);
    };
    image.onerror = (error) => {
      onErrorRef.current?.(
        new Error(error instanceof Error ? error.message : "Unknown error")
      );
      setImage(undefined);
      setFinalImage(undefined);
    };

    return () => {
      image.onload = null;
      image.onerror = null;
      imgRef?.clearCache();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!image) return;

    let cancelled = false;
    let generatedImg: HTMLImageElement | null = null;

    const fitImage = (ctx: CanvasRenderingContext2D) => {
      const imageAspectRatio = image.width / image.height;
      const containerAspectRatio = width / height;

      let imgWidth = width;
      let imgHeight = height;
      let imgX = 0;
      let imgY = 0;

      if (imageAspectRatio > containerAspectRatio) {
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

      const scaledWidth = imgWidth * cropScale;
      const scaledHeight = imgHeight * cropScale;
      const cropX =
        imgX - (scaledWidth - imgWidth) / 2 + cropOffset.x * scaledWidth;
      const cropY =
        imgY - (scaledHeight - imgHeight) / 2 + cropOffset.y * scaledHeight;

      ctx.drawImage(
        image,
        cropX + offset.x,
        cropY + offset.y,
        scaledWidth,
        scaledHeight
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
      generatedImg = img;
      img.src = canvas.toDataURL();
      img.onload = () => {
        if (cancelled) return;
        setFinalImage(img);
        ref.current?.cache();
        onReadyRef.current?.();
      };
      img.onerror = (error) => {
        if (cancelled) return;
        onErrorRef.current?.(
          new Error(error instanceof Error ? error.message : "Unknown error")
        );
      };
    };

    createImage();

    return () => {
      cancelled = true;
      if (generatedImg) {
        generatedImg.src = "";
        generatedImg.onload = null;
        generatedImg.onerror = null;
        generatedImg.remove();
      }
    };
  }, [
    image,
    width,
    height,
    offset.x,
    offset.y,
    cropOffset.x,
    cropOffset.y,
    cropScale,
    fillMode,
    align,
  ]);

  return {
    finalImage,
    image,
    ref,
  };
};
