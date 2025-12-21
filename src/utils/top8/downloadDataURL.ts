import { isIOS } from "@/utils/isIOS";

const dataURLtoBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

export const downloadDataURL = async ({
  dataURL,
  filename,
  mimeType,
}: {
  dataURL: string;
  filename: string;
  mimeType: string;
}) => {
  if (navigator.share && isIOS()) {
    try {
      const blob = dataURLtoBlob(dataURL);
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

  if (isIOS()) {
    const blob = dataURLtoBlob(dataURL);
    const blobURL = URL.createObjectURL(blob);
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
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
