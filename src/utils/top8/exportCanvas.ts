import { Stage } from "konva/lib/Stage";
import { SceneCanvas } from "konva/lib/Canvas";
import { Container } from "konva/lib/Container";
import { flushSync } from "react-dom";

import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";

type ExportOptions = {
  stageRef: Stage;
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
  /** When set and lower than `pixelRatio`, also encodes a smaller copy for
   *  on-screen preview so the UI doesn't have to decode the full-size image. */
  previewPixelRatio?: number;
};

export type ExportResult = {
  blob: Blob;
  previewBlob: Blob | null;
};

const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));

/**
 * Renders every layer straight into one output canvas.
 *
 * `stage.toCanvas()` allocates an output canvas plus a scene canvas *and* a
 * buffer canvas per layer, all at export size, and leaves them for GC — at
 * 2× on a 1920×1080 design that is ~33 MB each. Here we allocate one output
 * and one shared buffer, and release the buffer as soon as drawing is done.
 *
 * `Container.prototype.drawScene` is what `Layer.drawScene` delegates to
 * after clearing its target; calling it directly skips that clear so layers
 * composite onto each other.
 */
const renderStage = (stage: Stage, pixelRatio: number): SceneCanvas => {
  const width = stage.width();
  const height = stage.height();

  const output = new SceneCanvas({ width, height, pixelRatio });
  // Shapes that need an intermediate surface (e.g. fill + stroke + opacity)
  // would otherwise fall back to the stage's own buffer, which is sized for
  // the screen rather than for the export.
  const buffer = new SceneCanvas({ width, height, pixelRatio });

  try {
    for (const layer of stage.getLayers()) {
      Container.prototype.drawScene.call(layer, output, undefined, buffer);
    }
  } catch (error) {
    releaseCanvas(output._canvas);
    throw error;
  } finally {
    releaseCanvas(buffer._canvas);
  }

  return output;
};

const encodePreview = async (
  source: HTMLCanvasElement,
  scale: number,
  mimeType: string,
  quality: number,
): Promise<Blob | null> => {
  const preview = document.createElement("canvas");
  preview.width = Math.max(1, Math.round(source.width * scale));
  preview.height = Math.max(1, Math.round(source.height * scale));
  try {
    const ctx = preview.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, preview.width, preview.height);
    return await canvasToBlob(preview, mimeType, quality);
  } finally {
    releaseCanvas(preview);
  }
};

export const exportCanvas = async ({
  stageRef,
  pixelRatio = 2,
  mimeType = "image/png",
  quality = 1,
  previewPixelRatio,
}: ExportOptions): Promise<ExportResult | null> => {
  flushSync(() => {
    usePlayerStore.getState().dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    useTournamentStore.getState().dispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  });

  const canvas = renderStage(stageRef, pixelRatio)._canvas;

  try {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (!blob) return null;

    const previewBlob =
      previewPixelRatio && previewPixelRatio < pixelRatio
        ? await encodePreview(
            canvas,
            previewPixelRatio / pixelRatio,
            mimeType,
            quality,
          )
        : null;

    return { blob, previewBlob };
  } finally {
    releaseCanvas(canvas);
  }
};

export const exportCanvasToPngBlob = async (
  options: ExportOptions,
): Promise<Blob | null> => (await exportCanvas(options))?.blob ?? null;
