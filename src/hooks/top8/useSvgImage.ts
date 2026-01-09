import { useState, useEffect, useRef, useMemo } from "react";

const svgTextCache = new Map<string, string>();

const serializePalette = (palette: Record<string, string>): string => {
  const keys = Object.keys(palette).sort();
  return keys.map((key) => `${key}:${palette[key]}`).join("|");
};

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
  const [svgText, setSvgText] = useState<string | null>(
    () => svgTextCache.get(svgUrl) ?? null
  );
  const currentUrlRef = useRef<string | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const paletteKey = useMemo(() => serializePalette(palette), [palette]);

  useEffect(() => {
    if (!svgUrl) {
      onErrorRef.current?.(new Error("SVG URL is required"));
      return;
    }

    const cached = svgTextCache.get(svgUrl);
    if (cached) {
      setSvgText(cached);
      return;
    }

    setSvgText(null);
    let cancelled = false;

    const fetchSvg = async () => {
      try {
        const response = await fetch(svgUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }

        const text = await response.text();

        if (!cancelled) {
          svgTextCache.set(svgUrl, text);
          setSvgText(text);
        }
      } catch (error) {
        console.error("Error fetching SVG:", error);
        if (!cancelled) {
          onErrorRef.current?.(new Error("Failed to fetch SVG"));
        }
      }
    };

    fetchSvg();

    return () => {
      cancelled = true;
    };
  }, [svgUrl]);

  useEffect(() => {
    if (!svgText) {
      return;
    }

    let cancelled = false;

    const applyColorsAndLoad = () => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = doc.querySelector("svg");

        if (!svgEl) {
          throw new Error("SVG not found");
        }

        Object.entries(palette).forEach(([key, value]) => {
          const colorElements = svgEl.querySelectorAll(`.${key}`);
          colorElements.forEach((el) => {
            el.setAttribute("fill", value);
          });
        });

        const serializer = new XMLSerializer();
        const modifiedSvgText = serializer.serializeToString(doc);

        const blob = new Blob([modifiedSvgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        currentUrlRef.current = url;

        const img = new Image();
        if (crossOrigin) {
          img.crossOrigin = crossOrigin;
        }

        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            onReadyRef.current?.();
          }
        };

        img.onerror = () => {
          if (!cancelled) {
            onErrorRef.current?.(new Error("Failed to load SVG image"));
          }
        };

        img.src = url;
      } catch (error) {
        console.error("Error applying SVG colors:", error);
        if (!cancelled) {
          onErrorRef.current?.(new Error("Failed to process SVG"));
        }
      }
    };

    applyColorsAndLoad();

    return () => {
      cancelled = true;
    };
  }, [svgText, paletteKey, crossOrigin, palette]);

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
    };
  }, []);

  return [image];
};
