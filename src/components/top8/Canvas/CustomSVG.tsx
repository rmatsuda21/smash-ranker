import { ComponentProps, memo, useRef } from "react";
import { Image } from "react-konva";
import { useSvgImage } from "@/hooks/top8/useSvgImage";

const BACKDROP_OFFSET = 10;

type Props = Omit<ComponentProps<typeof Image>, "image" | "src"> & {
  width: number;
  height: number;
  src: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  palette: Record<string, string>;
};

const CustomSVGComponent = ({
  width,
  height,
  src,
  hasShadow = false,
  shadowColor = "red",
  x = 0,
  y = 0,
  palette,
  onReady,
  onError,
  ...rest
}: Props) => {
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const [image] = useSvgImage({
    svgUrl: src,
    palette,
    onReady: onReadyRef.current,
    onError: onErrorRef.current,
  });

  if (!image) return null;

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

const arePaletteEqual = (
  prevPalette: Record<string, string>,
  nextPalette: Record<string, string>
): boolean => {
  const prevKeys = Object.keys(prevPalette);
  const nextKeys = Object.keys(nextPalette);
  if (prevKeys.length !== nextKeys.length) return false;
  return prevKeys.every((key) => prevPalette[key] === nextPalette[key]);
};

export const CustomSVG = memo(CustomSVGComponent, (prevProps, nextProps) => {
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.src === nextProps.src &&
    prevProps.hasShadow === nextProps.hasShadow &&
    prevProps.shadowColor === nextProps.shadowColor &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    arePaletteEqual(prevProps.palette, nextProps.palette)
  );
});
