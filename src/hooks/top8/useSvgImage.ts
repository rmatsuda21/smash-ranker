import { useState, useEffect } from "react";

type Status = "loading" | "loaded" | "failed";
export const useSvgImage = ({
  svgUrl,
  palette,
  crossOrigin,
}: {
  svgUrl: string;
  palette: Record<string, string>;
  crossOrigin?: string;
}): [HTMLImageElement | undefined, Status] => {
  const [image, setImage] = useState<HTMLImageElement>();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!svgUrl) {
      setStatus("failed");
      return;
    }

    setStatus("loading");
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
            setStatus("loaded");
          }
          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          if (!cancelled) {
            setStatus("failed");
          }
          URL.revokeObjectURL(url);
        };

        img.src = url;
      } catch (error) {
        console.error("Error loading SVG:", error);
        if (!cancelled) {
          setStatus("failed");
        }
      }
    };

    loadAndModifySvg();

    return () => {
      cancelled = true;
    };
  }, [svgUrl, palette, crossOrigin]);

  return [image, status];
};
