import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

import { isIdbImageSrc } from "@/utils/assetSrc";
import { LRUCache } from "@/utils/LRUCache";
import { getDeviceRenderProfile } from "@/utils/top8/renderProfile";
import type { ImageTone } from "@/types/top8/Design";
import { logWarning } from "@/utils/observability/log";

// Decoded sources are kept so interactive edits (resize, crop, template
// switch) re-bake instantly. Profiles that opt out keep none: character art
// is up to ~2000px square (~15 MB decoded each) and only the baked,
// slot-sized canvas is ever drawn. A re-bake there re-reads the file from
// the browser's HTTP cache instead.
const sourceCache = !getDeviceRenderProfile().keepSourceImages
  ? null
  : new LRUCache<string, HTMLImageElement>(200, (_key, img) => {
      // Only clear event handlers — an evicted image may still be mid-bake.
      img.onload = null;
      img.onerror = null;
    });

const inflight = new Map<string, Promise<HTMLImageElement>>();

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [500, 1000, 2000];

const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

const SUPPORTS_CANVAS_FILTER =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "filter" in CanvasRenderingContext2D.prototype;

const toneToCssFilter = (tone: ImageTone): string =>
  [
    tone.grayscale ? "grayscale(1)" : "",
    tone.contrast !== undefined ? `contrast(${tone.contrast})` : "",
    tone.brightness !== undefined ? `brightness(${tone.brightness})` : "",
  ]
    .filter(Boolean)
    .join(" ");

/** The same result as `toneToCssFilter`, for browsers without `ctx.filter`
 *  (Safari before 18). Runs once per bake, on the slot-sized canvas. */
const applyToneToPixels = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tone: ImageTone,
) => {
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  const contrast = tone.contrast ?? 1;
  const brightness = tone.brightness ?? 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (tone.grayscale) {
      r = g = b = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    data[i] = ((r - 127.5) * contrast + 127.5) * brightness;
    data[i + 1] = ((g - 127.5) * contrast + 127.5) * brightness;
    data[i + 2] = ((b - 127.5) * contrast + 127.5) * brightness;
  }

  ctx.putImageData(image, 0, 0);
};

// An image that fails to load is drawn as nothing, so a broken asset path
// or an outage would otherwise go unseen. Each address is reported once, and
// a page reports a handful at most: one outage fails every image at once.
const MAX_FAILURE_REPORTS = 10;
const reportedFailures = new Set<string>();

const describeSource = (imageSrc: string): string => {
  if (imageSrc.startsWith("data:")) return "data:";
  if (imageSrc.startsWith("blob:")) return "blob:";
  try {
    const url = new URL(imageSrc, window.location.origin);
    return url.host + url.pathname;
  } catch {
    return "invalid";
  }
};

const reportLoadFailure = (imageSrc: string) => {
  // Offline is the user's connection, not a broken image.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const source = describeSource(imageSrc);
  if (reportedFailures.has(source)) return;
  if (reportedFailures.size >= MAX_FAILURE_REPORTS) return;
  reportedFailures.add(source);
  logWarning("canvas image failed to load", { area: "assets", source });
};

const fetchSource = (imageSrc: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const attemptLoad = (attempt: number) => {
      const image = new window.Image();
      if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
        image.crossOrigin = "anonymous";
      }
      image.onload = () => {
        image.onload = null;
        image.onerror = null;
        resolve(image);
      };
      image.onerror = () => {
        image.onload = null;
        image.onerror = null;
        if (isIdbImageSrc(imageSrc) && attempt < MAX_RETRIES) {
          setTimeout(
            () => attemptLoad(attempt + 1),
            RETRY_BACKOFF_MS[attempt] ?? 2000,
          );
          return;
        }
        // An <img> error event carries no reason: name the image instead.
        reportLoadFailure(imageSrc);
        reject(new Error(`Image failed to load: ${describeSource(imageSrc)}`));
      };
      image.src = imageSrc;
    };

    attemptLoad(0);
  });

/** Loads a source image, sharing one request between concurrent callers. */
const loadSource = (imageSrc: string): Promise<HTMLImageElement> => {
  const cached = sourceCache?.get(imageSrc);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(imageSrc);
  if (pending) return pending;

  const promise = fetchSource(imageSrc)
    .then((image) => {
      if (sourceCache) {
        sourceCache.set(imageSrc, image);
      } else {
        // Every caller waiting on this promise bakes synchronously in its
        // own continuation, all before this timer fires. After that nothing
        // needs the full-size bitmap, so drop it rather than wait for GC.
        setTimeout(() => {
          image.src = "";
        }, 0);
      }
      return image;
    })
    .finally(() => {
      inflight.delete(imageSrc);
    });

  inflight.set(imageSrc, promise);
  return promise;
};

export const useCustomImage = ({
  imageSrc,
  width,
  height,
  fillMode = "contain",
  align = "center",
  offset: { x: offsetX, y: offsetY } = { x: 0, y: 0 },
  cropOffset: { x: cropOffsetX, y: cropOffsetY } = { x: 0, y: 0 },
  cropScale = 1,
  flipX = false,
  tone,
  bakeScale,
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
  /** Colour treatment baked into the canvas. */
  tone?: ImageTone;
  /** Backing pixels per design pixel for the baked canvas. Defaults to the
   *  device pixel ratio capped at 2. */
  bakeScale?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}) => {
  const [finalImage, setFinalImage] = useState<HTMLCanvasElement>();
  const ref = useRef<KonvaImage>(null);

  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const scale = bakeScale ?? Math.min(window.devicePixelRatio || 1, 2);

  const toneGrayscale = tone?.grayscale;
  const toneContrast = tone?.contrast;
  const toneBrightness = tone?.brightness;

  useEffect(() => {
    let cancelled = false;

    const bake = (sourceImage: HTMLImageElement) => {
      if (cancelled) return;

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
          imgX - (scaledWidth - imgWidth) / 2 + cropOffsetX * scaledWidth;
        const cropY =
          imgY - (scaledHeight - imgHeight) / 2 + cropOffsetY * scaledHeight;

        ctx.drawImage(
          sourceImage,
          cropX + offsetX,
          cropY + offsetY,
          scaledWidth,
          scaledHeight,
        );
      };

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
      const bakedTone: ImageTone | undefined =
        toneGrayscale ||
        toneContrast !== undefined ||
        toneBrightness !== undefined
          ? {
              grayscale: toneGrayscale,
              contrast: toneContrast,
              brightness: toneBrightness,
            }
          : undefined;
      if (bakedTone && SUPPORTS_CANVAS_FILTER) {
        ctx.filter = toneToCssFilter(bakedTone);
      }
      fitImage(ctx);
      if (bakedTone && !SUPPORTS_CANVAS_FILTER) {
        applyToneToPixels(ctx, canvas, bakedTone);
      }

      setFinalImage(canvas);
      onReadyRef.current?.();
    };

    const cached = sourceCache?.get(imageSrc);
    if (cached) {
      bake(cached);
    } else {
      loadSource(imageSrc)
        .then(bake)
        .catch((error: unknown) => {
          if (cancelled) return;
          onErrorRef.current?.(
            error instanceof Error ? error : new Error(String(error)),
          );
          setFinalImage(undefined);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    imageSrc,
    width,
    height,
    offsetX,
    offsetY,
    cropOffsetX,
    cropOffsetY,
    cropScale,
    fillMode,
    align,
    flipX,
    scale,
    toneGrayscale,
    toneContrast,
    toneBrightness,
  ]);

  // Free a baked canvas once the node has moved on to its replacement.
  // Runs after the commit that handed Konva the new canvas, so the old one
  // is never drawn at 0×0.
  const liveCanvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  useEffect(() => {
    const previous = liveCanvasRef.current;
    if (previous && previous !== finalImage) releaseCanvas(previous);
    liveCanvasRef.current = finalImage;
  }, [finalImage]);

  // ...and on unmount. Deferred behind a mounted check because StrictMode
  // runs this cleanup once on a component that is about to keep rendering.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (mountedRef.current) return;
        if (liveCanvasRef.current) releaseCanvas(liveCanvasRef.current);
        liveCanvasRef.current = undefined;
      }, 0);
    };
  }, []);

  return {
    finalImage,
    ref,
  };
};
