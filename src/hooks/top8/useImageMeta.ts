import { useState, useEffect } from "react";

type ImageMeta = {
  width: number;
  height: number;
};

export const useImageMeta = (blob: Blob | null): ImageMeta | null => {
  const [meta, setMeta] = useState<ImageMeta | null>(null);

  useEffect(() => {
    if (!blob) {
      setMeta(null);
      return;
    }

    let cancelled = false;
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setMeta({ width: img.naturalWidth, height: img.naturalHeight });
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return meta;
};
