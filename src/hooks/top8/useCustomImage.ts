import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

import { LRUCache } from "@/utils/LRUCache";
import { isMobile } from "@/utils/isMobile";

const IMAGE_CACHE_SIZE = isMobile() ? 50 : 200;
const imageCache = new LRUCache<string, HTMLImageElement>(
  IMAGE_CACHE_SIZE,
  (_key, img) => {
    // Only clear event handlers — don't set img.src = "" or call img.remove().
    // The evicted HTMLImageElement may still be referenced by components via React state.
    img.onload = null;
    img.onerror = null;
  },
);

const IDB_IMAGE_PREFIX = "/idb-images/";
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [500, 1000, 2000];

const isIdbImageUrl = (src: string) => src.startsWith(IDB_IMAGE_PREFIX);

export const useCustomImage = ({
  imageSrc,
  width,
  height,
  fillMode = "contain",
  align = "center",
  offset = { x: 0, y: 0 },
  cropOffset = { x: 0, y: 0 },
  cropScale = 1,
  flipX = false,
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
  flipX?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}) => {
  const [finalImage, setFinalImage] = useState<CanvasImageSource>();
  const [image, setImage] = useState<HTMLImageElement | undefined>(() =>
    imageCache.get(imageSrc),
  );
  const ref = useRef<KonvaImage>(null);

  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const imgRef = ref.current;
    let cancelled = false;
    let activeImage: HTMLImageElement | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    if (imgRef) {
      imgRef.clearCache();
    }

    const cached = imageCache.get(imageSrc);
    if (cached) {
      setImage(cached);
      return;
    }

    const loadImage = (attempt: number) => {
      if (cancelled) return;

      const image = new window.Image();
      activeImage = image;

      if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
        image.crossOrigin = "anonymous";
      }
      image.src = imageSrc;
      image.onload = () => {
        if (cancelled) return;
        imageCache.set(imageSrc, image);
        setImage(image);
      };
      image.onerror = (error) => {
        if (cancelled) return;

        if (isIdbImageUrl(imageSrc) && attempt < MAX_RETRIES) {
          retryTimeout = setTimeout(
            () => loadImage(attempt + 1),
            RETRY_BACKOFF_MS[attempt] ?? 2000,
          );
          return;
        }

        onErrorRef.current?.(
          new Error(error instanceof Error ? error.message : "Unknown error"),
        );
        setImage(undefined);
        setFinalImage(undefined);
      };
    };

    loadImage(0);

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (activeImage) {
        activeImage.onload = null;
        activeImage.onerror = null;
      }
      imgRef?.clearCache();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!image) return;

    // Capture source image in closure before it may be cleared from state
    const sourceImage = image;

    const fitImage = (ctx: CanvasRenderingContext2D) => {
      const imageAspectRatio = sourceImage.width / sourceImage.height;
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
        sourceImage,
        cropX + offset.x,
        cropY + offset.y,
        scaledWidth,
        scaledHeight,
      );
    };

    const scale = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);
    if (flipX) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    fitImage(ctx);

    setFinalImage(canvas);
    onReadyRef.current?.();
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
    flipX,
  ]);

  return {
    finalImage,
    ref,
  };
};
