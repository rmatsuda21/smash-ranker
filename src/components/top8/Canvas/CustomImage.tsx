import { ComponentProps, memo, useCallback, useEffect, useRef } from "react";
import { Image } from "react-konva";

import { useCustomImage } from "@/hooks/top8/useCustomImage";
import { useAssetLoad } from "@/components/top8/Canvas/AssetLoadBoundary";
import {
  useBitmapScale,
  useRenderProfile,
} from "@/components/top8/Canvas/RenderProfileContext";

const BACKDROP_OFFSET = 10;
const DEFAULT_SHADOW_OFFSET = { x: BACKDROP_OFFSET, y: BACKDROP_OFFSET };

type Props = Omit<ComponentProps<typeof Image>, "image"> & {
  width: number;
  height: number;
  imageSrc: string;
  hasShadow?: boolean;
  shadowColor?: string;
  offset?: { x: number; y: number };
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
  fillMode?: "contain" | "cover";
  align?: "center" | "left" | "right" | "top" | "bottom";
};

const CustomImageComponent = ({
  width,
  height,
  imageSrc,
  hasShadow = false,
  shadowColor = "red",
  shadowBlur = 3,
  shadowOffset = DEFAULT_SHADOW_OFFSET,
  shadowOpacity: _shadowOpacity,
  x = 0,
  y = 0,
  offset = { x: 0, y: 0 },
  cropOffset = { x: 0, y: 0 },
  cropScale = 1,
  onReady,
  onError,
  fillMode = "contain",
  align = "center",
  ...rest
}: Props) => {
  const shadowOpacity = hasShadow ? (_shadowOpacity ?? 1) : 0;
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  // Registered before `useCustomImage` so a cached image that bakes
  // synchronously is already known to the load boundary.
  const assetLoad = useAssetLoad();
  const handleReady = useCallback(() => {
    assetLoad.ready();
    onReadyRef.current?.();
  }, [assetLoad]);
  const handleError = useCallback(
    (error: Error) => {
      assetLoad.fail();
      onErrorRef.current?.(error);
    },
    [assetLoad],
  );

  const { cacheShadowedImages } = useRenderProfile();
  const bakeScale = useBitmapScale();

  // The baked canvas is already a plain blit, so a node cache only pays for
  // itself when it saves re-running a shadow blur on every redraw.
  const useNodeCache = cacheShadowedImages && shadowOpacity > 0;

  const { finalImage, ref } = useCustomImage({
    imageSrc,
    width,
    height,
    fillMode,
    align,
    offset,
    cropOffset,
    cropScale,
    bakeScale,
    onReady: handleReady,
    onError: handleError,
  });

  useEffect(() => {
    if (!ref.current || !finalImage) return;

    ref.current.clearCache();
    // Same density as the bake, so exports don't upscale a screen-res cache.
    if (useNodeCache) ref.current.cache({ pixelRatio: bakeScale });
  }, [
    shadowColor,
    shadowBlur,
    shadowOffset.x,
    shadowOffset.y,
    shadowOpacity,
    finalImage,
    ref,
    useNodeCache,
    bakeScale,
  ]);

  if (!finalImage) return null;

  return (
    <Image
      ref={ref}
      x={x}
      y={y}
      width={width}
      height={height}
      image={finalImage}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffset={shadowOffset}
      shadowOpacity={shadowOpacity}
      {...rest}
    />
  );
};

const areOffsetsEqual = (
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
};

export const CustomImage = memo(
  CustomImageComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.imageSrc === nextProps.imageSrc &&
      prevProps.hasShadow === nextProps.hasShadow &&
      prevProps.shadowColor === nextProps.shadowColor &&
      prevProps.shadowBlur === nextProps.shadowBlur &&
      prevProps.shadowOpacity === nextProps.shadowOpacity &&
      prevProps.x === nextProps.x &&
      prevProps.y === nextProps.y &&
      prevProps.cropScale === nextProps.cropScale &&
      prevProps.fillMode === nextProps.fillMode &&
      prevProps.align === nextProps.align &&
      areOffsetsEqual(prevProps.offset, nextProps.offset) &&
      areOffsetsEqual(prevProps.cropOffset, nextProps.cropOffset) &&
      areOffsetsEqual(prevProps.shadowOffset, nextProps.shadowOffset)
    );
  },
);
