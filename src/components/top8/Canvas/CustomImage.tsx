import { ComponentProps, useState, useEffect, useRef } from "react";
import { Image } from "react-konva";
import Konva from "konva";

const BACKDROP_OFFSET = 10;

type Props = Omit<ComponentProps<typeof Image>, "image"> & {
  width: number;
  height: number;
  imageSrc: string;
  hasShadow?: boolean;
  shadowColor?: string;
  offset?: { x: number; y: number };
  onReady?: () => void;
  onError?: (error: Error) => void;
  fillMode?: "contain" | "cover";
};

export const CustomImage = ({
  width,
  height,
  imageSrc,
  hasShadow = false,
  shadowColor = "red",
  x = 0,
  y = 0,
  offset = { x: 0, y: 0 },
  onReady,
  onError,
  fillMode = "contain",
  ...rest
}: Props) => {
  const [finalImage, setFinalImage] = useState<HTMLImageElement>();
  const [image, setImage] = useState<HTMLImageElement>();
  const ref = useRef<Konva.Image>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.clearCache();
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
      ref.current?.clearCache();
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
  }, [image, width, height, offset.x, offset.y]);

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
      shadowBlur={3}
      shadowOffset={{ x: BACKDROP_OFFSET, y: BACKDROP_OFFSET }}
      shadowOpacity={hasShadow ? 1 : 0}
      {...rest}
    />
  );
};
