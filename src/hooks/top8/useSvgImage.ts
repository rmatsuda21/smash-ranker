import { useState, useEffect } from "react";

type Status = "loading" | "loaded" | "failed";
export const useSvgImage = ({
  svgUrl,
  fillColorMain,
  fillColorSecondary,
  crossOrigin,
}: {
  svgUrl: string;
  fillColorMain?: string;
  fillColorSecondary?: string;
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

        if (fillColorMain) {
          const colorElements = doc.querySelectorAll(".color");
          colorElements.forEach((el) => {
            if (el.id === "outer") {
              el.setAttribute("fill", fillColorMain);
            } else if (el.id === "inner") {
              el.setAttribute("fill", fillColorSecondary ?? fillColorMain);
            } else if (el.id !== "center") {
              el.setAttribute("fill", fillColorMain);
            }
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
  }, [svgUrl, fillColorMain, fillColorSecondary, crossOrigin]);

  return [image, status];
};
