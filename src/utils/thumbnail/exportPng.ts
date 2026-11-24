import { Stage as KonvaStage } from "konva/lib/Stage";
import { EXPORT_PIXEL_RATIO } from "@/consts/thumbnail/defaults";
import { downloadBlob, type SaveOutcome } from "@/utils/top8/downloadBlob";

/**
 * Saves the stage as a PNG through the shared save path. Resolves to null
 * when the stage could not be encoded.
 */
export const downloadStageAsPng = async (
  stage: KonvaStage,
  fileName: string,
): Promise<SaveOutcome | null> => {
  const blob = await stageToBlob(stage, EXPORT_PIXEL_RATIO);
  if (!blob) return null;
  return downloadBlob({
    blob,
    filename: fileName.endsWith(".png") ? fileName : `${fileName}.png`,
    mimeType: "image/png",
  });
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
