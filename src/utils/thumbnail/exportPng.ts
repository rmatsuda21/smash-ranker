import { Stage as KonvaStage } from "konva/lib/Stage";
import { EXPORT_PIXEL_RATIO } from "@/consts/thumbnail/defaults";

export const downloadStageAsPng = (
  stage: KonvaStage,
  fileName: string,
): void => {
  const url = stage.toDataURL({
    pixelRatio: EXPORT_PIXEL_RATIO,
    mimeType: "image/png",
  });
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const stageToBlob = (
  stage: KonvaStage,
  pixelRatio: number,
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    stage.toBlob({
      pixelRatio,
      mimeType: "image/png",
      callback: (blob: Blob | null) => resolve(blob),
    });
  });
};
