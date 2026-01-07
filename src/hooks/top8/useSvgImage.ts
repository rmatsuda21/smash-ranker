import { useState, useEffect } from "react";

export const useSvgImage = ({
  svgUrl,
  palette,
  crossOrigin,
  onReady,
  onError,
}: {
  svgUrl: string;
  palette: Record<string, string>;
  crossOrigin?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}): [HTMLImageElement | undefined] => {
  const [image, setImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (!svgUrl) {
      onError?.(new Error("SVG URL is required"));
      return;
    }

    setImage(undefined);

    let cancelled = false;

    const loadAndModifySvg = async () => {
      try {
        const response = await fetch(svgUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }

        const svgText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");

        const svgEl = doc.querySelector("svg");

        if (!svgEl) {
          throw new Error("SVG not found");
        }

        if (palette) {
          Object.entries(palette).forEach(([key, value]) => {
            const colorElements = svgEl.querySelectorAll(`.${key}`);
            colorElements.forEach((el) => {
              el.setAttribute("fill", value);
            });
          });
        }

        const serializer = new XMLSerializer();
        const modifiedSvgText = serializer.serializeToString(doc);

        const blob = new Blob([modifiedSvgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        if (crossOrigin) {
          img.crossOrigin = crossOrigin;
        }

        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            onReady?.();
          }
          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          if (!cancelled) {
            onError?.(new Error("Failed to load SVG"));
          }
          URL.revokeObjectURL(url);
        };

        img.src = url;
      } catch (error) {
        console.error("Error loading SVG:", error);
        if (!cancelled) {
          onError?.(new Error("Failed to load SVG"));
        }
      }
    };

    loadAndModifySvg();

    return () => {
      cancelled = true;
    };
  }, [svgUrl, palette, crossOrigin, onReady, onError]);

  return [image];
};
