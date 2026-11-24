import { isAndroid } from "@/utils/isAndroid";
import { isIOS } from "@/utils/isIOS";

/**
 * What happened to the file: handed to the system share sheet, saved through
 * the browser's download, or dropped because the user closed the share sheet.
 */
export type SaveOutcome = "shared" | "downloaded" | "cancelled";

/** `share_method` for the export events, from what a save ended up doing. */
export const shareMethodFor = (outcome: "shared" | "downloaded") =>
  outcome === "shared" ? "share_sheet" : "download";

// Browsers differ on how soon after the click a download has read its blob
// URL; revoking straight away cancels the download in some of them.
const REVOKE_DELAY_MS = 40_000;

const canShareFile = (file: File): boolean => {
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

const downloadWithLink = (blob: Blob, filename: string) => {
  const blobURL = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = blobURL;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobURL), REVOKE_DELAY_MS);
};

/**
 * Saves a file the way the device expects.
 *
 * On a phone or tablet that is the system share sheet: the only route to the
 * photo library ("Save Image") on iOS, and to the gallery and other apps on
 * Android. Everywhere else, and whenever the share sheet is missing or
 * refuses the file (an in-app browser, a lost user gesture), it is a plain
 * download link, which every current browser supports for blob URLs.
 *
 * **Call it from a tap, with the blob already made**: the share sheet opens
 * only while the tap's user activation is alive.
 */
export const downloadBlob = async ({
  blob,
  filename,
  mimeType,
}: {
  blob: Blob;
  filename: string;
  mimeType: string;
}): Promise<SaveOutcome> => {
  if (isIOS() || isAndroid()) {
    const file = new File([blob], filename, { type: mimeType });
    if (canShareFile(file)) {
      try {
        // The file alone: a title or text travels to some share targets as
        // an extra item beside the image.
        await navigator.share({ files: [file] });
        return "shared";
      } catch (err) {
        if ((err as Error).name === "AbortError") return "cancelled";
        // Anything else (no user activation, a share already open): download.
      }
    }
  }

  downloadWithLink(blob, filename);
  return "downloaded";
};
