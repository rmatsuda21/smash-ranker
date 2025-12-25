import { memo, useEffect, useState } from "react";

import { CustomImage } from "./CustomImage";
import { assetRepository } from "@/db/repository";

const MISSING_ASSET_URL = "/assets/missing_asset.svg";

type Props = {
  assetId: string;
  fallbackSrc?: string;
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillMode?: "contain" | "cover";
  align?: "center" | "left" | "right" | "top" | "bottom";
};

const AssetImageComponent = ({
  assetId,
  fallbackSrc = MISSING_ASSET_URL,
  x,
  y,
  id,
  width,
  height,
  fillMode = "contain",
  align = "center",
}: Props) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setImageSrc(fallbackSrc ?? null);
      return;
    }

    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        const asset = await assetRepository.get(assetId);
        if (asset?.data) {
          objectUrl = URL.createObjectURL(asset.data);
          setImageSrc(objectUrl);
        } else {
          setImageSrc(fallbackSrc ?? null);
        }
      } catch (error) {
        console.error("Failed to load asset image:", error);
        setImageSrc(fallbackSrc ?? null);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetId, fallbackSrc]);

  if (!imageSrc) {
    return null;
  }

  return (
    <CustomImage
      x={x}
      y={y}
      id={id}
      width={width}
      height={height}
      imageSrc={imageSrc}
      fillMode={fillMode}
      align={align}
    />
  );
};

export const AssetImage = memo(AssetImageComponent);
