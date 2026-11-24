import { THUMBNAIL_WIDTH } from "@/consts/thumbnail/thumbnail";
import {
  H,
  thumbnailFont,
  W,
  type ThumbnailAssets,
  type ThumbnailScene,
} from "@/utils/thumbnail/painter";
import { getThumbnailTemplate } from "@/utils/thumbnail/templates";

// The one painter for a thumbnail: the preview, the template pictures and
// the saved image all come from here, at whatever size the canvas has.
export const drawThumbnail = (
  canvas: HTMLCanvasElement,
  scene: ThumbnailScene,
  assets: ThumbnailAssets,
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = canvas.width / THUMBNAIL_WIDTH;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  getThumbnailTemplate(scene.look.templateId).draw({
    ctx,
    scene,
    assets,
    scale,
    ...thumbnailFont(scene.look.font),
  });
  ctx.restore();
};
