// The longest side a logo is kept at. It is drawn about 110px wide, and the
// file lives in localStorage with the rest of the look.
const MAX_LOGO_SIZE = 360;

// An uploaded logo as a small PNG data URL, or null when the file is not an
// image the browser can read.
export const readLogoFile = async (file: File): Promise<string | null> => {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => resolve(null);
      element.src = url;
    });
    if (!image || !image.width || !image.height) return null;

    const scale = Math.min(
      1,
      MAX_LOGO_SIZE / Math.max(image.width, image.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
};
