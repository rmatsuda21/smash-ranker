import { Layer, Rect } from "react-konva";
import { memo, useEffect, useState } from "react";

import { CustomImage } from "./CustomImage";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { useCanvasStore } from "@/store/canvasStore";
import { BackgroundConfig } from "@/types/top8/Layout";

type Props = {
  onClick: () => void;
  config?: BackgroundConfig;
};

const BackgroundLayerComponent = ({ onClick, config }: Props) => {
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string>();

  const canvasSize = useCanvasStore((state) => state.size);

  // Default config if none provided
  const defaultConfig: BackgroundConfig = {
    type: "image",
    imgSrc: "/assets/top8/theme/wtf/background.svg",
  };

  const backgroundConfig = config || defaultConfig;

  useEffect(() => {
    if (backgroundConfig.type === "image" && backgroundConfig.imgSrc) {
      const fetchBackgroundImageSrc = async () => {
        const url = await fetchAndColorSVG(
          backgroundConfig.imgSrc!,
          "rgba(0, 0, 0, 0.8)"
        );
        if (url) {
          setBackgroundImageSrc(url);
        }
      };
      fetchBackgroundImageSrc();
    }
  }, [backgroundConfig]);

  if (backgroundConfig.type === "color") {
    return (
      <Layer onClick={onClick} listening={false}>
        <Rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill={backgroundConfig.color || "black"}
        />
      </Layer>
    );
  }

  if (!backgroundImageSrc) return <Layer onClick={onClick} listening={false} />;

  return (
    <Layer onClick={onClick} listening={false}>
      <CustomImage
        width={canvasSize.width}
        height={canvasSize.height}
        imageSrc={backgroundImageSrc}
        fillMode="cover"
      />
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
