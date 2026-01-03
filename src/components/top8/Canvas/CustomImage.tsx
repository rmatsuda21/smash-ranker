import { ComponentProps, memo, useEffect } from "react";
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
  const { finalImage, ref } = useCustomImage({
    imageSrc,
    width,
    height,
    fillMode,
    align,
    offset,
    cropOffset,
    cropScale,
    onReady,
    onError,
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

export const CustomImage = memo(CustomImageComponent);
