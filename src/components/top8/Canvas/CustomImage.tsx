import { ComponentProps, memo, useEffect, useRef } from "react";
import { Image } from "react-konva";

import { useCustomImage } from "@/hooks/top8/useCustomImage";

const BACKDROP_OFFSET = 10;

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
  shadowOffset = { x: BACKDROP_OFFSET, y: BACKDROP_OFFSET },
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
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const { finalImage, ref } = useCustomImage({
    imageSrc,
    width,
    height,
    fillMode,
    align,
    offset,
    cropOffset,
    cropScale,
    onReady: onReadyRef.current,
    onError: onErrorRef.current,
  });

  useEffect(() => {
    if (ref.current && finalImage) {
      ref.current.cache();
    }
  }, [shadowColor, shadowBlur, shadowOffset, hasShadow, finalImage, ref]);

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
      shadowOpacity={hasShadow ? 1 : 0}
      {...rest}
    />
  );
};

const areOffsetsEqual = (
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined
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
      prevProps.x === nextProps.x &&
      prevProps.y === nextProps.y &&
      prevProps.cropScale === nextProps.cropScale &&
      prevProps.fillMode === nextProps.fillMode &&
      prevProps.align === nextProps.align &&
      areOffsetsEqual(prevProps.offset, nextProps.offset) &&
      areOffsetsEqual(prevProps.cropOffset, nextProps.cropOffset) &&
      areOffsetsEqual(prevProps.shadowOffset, nextProps.shadowOffset)
    );
  }
);
