export type CopyResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "permission" | "error" };

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
    const item = new ClipboardItem({ [blob.type || "image/png"]: blob });
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
