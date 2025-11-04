import { useState, useEffect } from "react";

type Status = "loading" | "loaded" | "failed";
export const useSvgImage = (
  svgUrl: string,
  fillColor?: string,
  crossOrigin?: string
): [HTMLImageElement | undefined, Status] => {
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

        let svgText = await response.text();

        if (fillColor) {
          svgText = svgText.replace(
            /fill=["'][^"']*["']/gi,
            `fill="${fillColor}"`
          );

          svgText = svgText.replace(/fill:\s*[^;"}]+/gi, `fill: ${fillColor}`);
        }

        const blob = new Blob([svgText], { type: "image/svg+xml" });
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
  }, [svgUrl, fillColor, crossOrigin]);

  return [image, status];
};
