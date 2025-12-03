import { ComponentProps, memo } from "react";
import { Image } from "react-konva";
import { useSvgImage } from "@/hooks/top8/useSvgImage";

const BACKDROP_OFFSET = 10;

type Props = Omit<ComponentProps<typeof Image>, "image" | "src"> & {
  width: number;
  height: number;
  src: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  fillColorMain?: string;
  fillColorSecondary?: string;
};

const CustomSVGComponent = ({
  width,
  height,
  src,
  hasShadow = false,
  shadowColor = "red",
  x = 0,
  y = 0,
  fillColorMain = "red",
  fillColorSecondary = "blue",
  ...rest
}: Props) => {
  const [image, status] = useSvgImage({
    svgUrl: src,
    fillColorMain,
    fillColorSecondary,
  });

  if (status === "loading") return null;
  if (status === "failed") return null;

  return (
    <Image
      x={x}
      y={y}
      width={width}
      height={height}
      image={image}
      shadowColor={shadowColor}
      shadowBlur={3}
      shadowOffset={{ x: BACKDROP_OFFSET, y: BACKDROP_OFFSET }}
      shadowOpacity={hasShadow ? 1 : 0}
      {...rest}
    />
  );
};

export const CustomSVG = memo(CustomSVGComponent);
