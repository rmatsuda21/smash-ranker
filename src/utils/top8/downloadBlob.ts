import { isIOS } from "@/utils/isIOS";

export const downloadBlob = async ({
  blob,
  filename,
  mimeType,
}: {
  blob: Blob;
  filename: string;
  mimeType: string;
}) => {
  if (navigator.share && isIOS()) {
    try {
      const file = new File([blob], filename, { type: mimeType });

      await navigator.share({
        files: [file],
        title: filename,
      });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  const blobURL = URL.createObjectURL(blob);

  if (isIOS()) {
    const newWindow = window.open(blobURL, "_blank");

    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => URL.revokeObjectURL(blobURL), 100);
      };
    } else {
      window.location.href = blobURL;
    }
    return;
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = blobURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobURL);
};
