import { Layer, Rect } from "react-konva";
import { memo, useEffect, useState } from "react";

import { CustomImage } from "./CustomImage";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { useCanvasStore } from "@/store/canvasStore";
import { BackgroundConfig } from "@/types/top8/LayoutTypes";

type Props = {
  onClick: () => void;
};

const BackgroundLayerComponent = ({ onClick }: Props) => {
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string>();

  const layout = useCanvasStore((state) => state.layout);

  const defaultConfig: BackgroundConfig = {
    type: "image",
    imgSrc: "/assets/top8/theme/wtf/background.svg",
  };

  const backgroundConfig = layout?.canvas.background || defaultConfig;

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
          width={layout?.canvas.size.width}
          height={layout?.canvas.size.height}
          fill={backgroundConfig.color || "black"}
        />
      </Layer>
    );
  }

  if (!backgroundImageSrc || !layout?.canvas)
    return <Layer onClick={onClick} listening={false} />;

  return (
    <Layer onClick={onClick} listening={false}>
      <CustomImage
        width={layout?.canvas.size.width}
        height={layout?.canvas.size.height}
        imageSrc={backgroundImageSrc}
        fillMode="cover"
      />
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
