import { useEffect, useRef } from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { BackgroundLayer } from "@/components/thumbnail/Canvas/BackgroundLayer";
import { ElementsLayer } from "@/components/thumbnail/Canvas/ElementsLayer";

type Props = {
  design: ThumbnailDesign;
  onCapture: (dataUrl: string) => void;
  /** Time to wait for async image loads before capturing. */
  delayMs?: number;
};

// Mounts a fully off-screen Konva Stage that renders the given design, waits a
// moment for character images / SVG flags / asset URLs to load, then snapshots
// the stage to a data URL. Used to lazily generate preview thumbnails for
// built-in templates without bundling static images.
export const BuiltInTemplatePreview = ({
  design,
  onCapture,
  delayMs = 1500,
}: Props) => {
  const stageRef = useRef<KonvaStage>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const stage = stageRef.current;
      if (!stage) return;
      try {
        const url = stage.toDataURL({
          pixelRatio: 0.3,
          mimeType: "image/png",
        });
        onCapture(url);
      } catch (e) {
        // CORS-tainted canvas (e.g. CDN image without crossOrigin) → skip
        console.warn("Preview capture failed", e);
      }
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [design, delayMs, onCapture]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: -99999,
        top: -99999,
        width: design.canvasSize.width,
        height: design.canvasSize.height,
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      <Stage
        ref={stageRef}
        width={design.canvasSize.width}
        height={design.canvasSize.height}
      >
        <BackgroundLayer
          background={design.background}
          canvasSize={design.canvasSize}
        />
        <ElementsLayer elements={design.elements} draggable={false} />
      </Stage>
    </div>
  );
};
