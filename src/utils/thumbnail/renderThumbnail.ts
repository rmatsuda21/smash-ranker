import {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from "@/consts/thumbnail/thumbnail";
import type { ThumbnailMatch } from "@/types/thumbnail/Thumbnail";
import { loadThumbnailAssets } from "@/utils/thumbnail/assets";
import { drawThumbnail } from "@/utils/thumbnail/drawThumbnail";
import type { ThumbnailScene } from "@/utils/thumbnail/painter";

// The finished image of one thumbnail, as a PNG.
export const renderThumbnail = async (scene: ThumbnailScene): Promise<Blob> => {
  const assets = await loadThumbnailAssets(scene);
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;
  drawThumbnail(canvas, scene, assets);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("thumbnail canvas is empty")),
      "image/png",
    ),
  );
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export const thumbnailFilename = (match: ThumbnailMatch): string => {
  const parts = [
    `${slugify(match.sides[0].name)}-vs-${slugify(match.sides[1].name)}`,
    slugify(match.round),
  ].filter((part) => part && part !== "-vs-");
  return `${parts.join("-") || "thumbnail"}.png`;
};
