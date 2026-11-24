export type CopyResult =
  { ok: true } | { ok: false; reason: "unsupported" | "permission" | "error" };

const PNG = "image/png";

// The clipboard takes images only as PNG.
const toPng = async (blob: Blob): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  try {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (png) => (png ? resolve(png) : reject(new Error("toBlob failed"))),
        PNG,
      ),
    );
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
};

/**
 * Copies an image of any format to the clipboard, as PNG.
 *
 * **Call it from a tap, with the blob already made.** `clipboard.write` runs
 * before anything is awaited: Safari refuses it once the tap's handler has
 * yielded. A conversion to PNG is handed over as a promise for that reason.
 */
export const copyImageToClipboard = async (blob: Blob): Promise<CopyResult> => {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.write !== "function" ||
    typeof ClipboardItem === "undefined"
  ) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const item = new ClipboardItem({
      [PNG]: blob.type === PNG ? blob : toPng(blob),
    });
    await navigator.clipboard.write([item]);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      return { ok: false, reason: "permission" };
    }
    return { ok: false, reason: "error" };
  }
};

export const canShareImage = (file: File): boolean => {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};
