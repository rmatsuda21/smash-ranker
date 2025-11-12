import { Layer } from "react-konva";
import { memo, useEffect, useState } from "react";

import { CustomImage } from "./CustomImage";
import backgroundImage from "/assets/top8/theme/wtf/background.svg";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { useCanvasStore } from "@/store/canvasStore";

type Props = {
  onClick: () => void;
};

const BackgroundLayerComponent = ({ onClick }: Props) => {
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string>();

  const canvasSize = useCanvasStore((state) => state.size);

  useEffect(() => {
    const fetchBackgroundImageSrc = async () => {
      const url = await fetchAndColorSVG(backgroundImage, "rgba(0, 0, 0, 0.8)");
      if (url) {
        setBackgroundImageSrc(url);
      }
    };
    fetchBackgroundImageSrc();
  }, []);

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
