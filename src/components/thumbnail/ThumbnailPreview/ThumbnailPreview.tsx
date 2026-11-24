import { useEffect, useLayoutEffect, useRef } from "react";
import cn from "classnames";
import { useLingui } from "@lingui/react/macro";

import {
  MAX_ART_ZOOM,
  MIN_ART_ZOOM,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from "@/consts/thumbnail/thumbnail";
import { useLatestCallback } from "@/hooks/useLatestCallback";
import { selectCurrentMatch, useThumbnailStore } from "@/store/thumbnailStore";
import { drawThumbnail } from "@/utils/thumbnail/drawThumbnail";
import type {
  ThumbnailAssets,
  ThumbnailScene,
} from "@/utils/thumbnail/painter";
import { getThumbnailTemplate } from "@/utils/thumbnail/templates";

import styles from "./ThumbnailPreview.module.scss";

type Props = {
  scene: ThumbnailScene;
  assets: ThumbnailAssets;
  className?: string;
};

// Sharper than the saved image on a dense screen, where the preview is
// shown larger than 1280 device pixels.
const BACKING_SCALE = Math.min(window.devicePixelRatio || 1, 1.5);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type Drag = {
  index: 0 | 1;
  startX: number;
  startY: number;
  origin: { x: number; y: number };
};

// The live thumbnail. Each character can be dragged around its half and
// resized with the wheel.
export const ThumbnailPreview = ({ scene, assets, className }: Props) => {
  const { t } = useLingui();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const updateSide = useThumbnailStore((s) => s.updateSide);

  useLayoutEffect(() => {
    if (canvasRef.current) drawThumbnail(canvasRef.current, scene, assets);
  }, [scene, assets]);

  // Which player's art is under a point of the screen.
  const sideAt = (clientX: number, clientY: number): 0 | 1 => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * THUMBNAIL_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * THUMBNAIL_HEIGHT;
    const boxes = getThumbnailTemplate(scene.look.templateId).artBoxes;
    const hit = boxes.findIndex(
      (box) =>
        x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h,
    );
    if (hit === 0 || hit === 1) return hit;
    return x < THUMBNAIL_WIDTH / 2 ? 0 : 1;
  };

  const currentSide = (index: 0 | 1) =>
    selectCurrentMatch(useThumbnailStore.getState()).sides[index];

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const index = sideAt(e.clientX, e.clientY);
    dragRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      origin: currentSide(index).offset,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const box = getThumbnailTemplate(scene.look.templateId).artBoxes[
      drag.index
    ];
    const perPixel = THUMBNAIL_WIDTH / rect.width;
    updateSide(
      drag.index,
      {
        offset: {
          x: clamp(
            drag.origin.x + ((e.clientX - drag.startX) * perPixel) / box.w,
            -1,
            1,
          ),
          y: clamp(
            drag.origin.y + ((e.clientY - drag.startY) * perPixel) / box.h,
            -1,
            1,
          ),
        },
      },
      "offset",
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  // React's wheel listener is passive; this one has to stop the page
  // scrolling while the art is resized.
  const onWheel = useLatestCallback((e: WheelEvent) => {
    e.preventDefault();
    const index = sideAt(e.clientX, e.clientY);
    const zoom = currentSide(index).zoom * (e.deltaY < 0 ? 1.04 : 1 / 1.04);
    updateSide(
      index,
      { zoom: clamp(zoom, MIN_ART_ZOOM, MAX_ART_ZOOM) },
      "zoom",
    );
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(styles.canvas, className)}
      width={THUMBNAIL_WIDTH * BACKING_SCALE}
      height={THUMBNAIL_HEIGHT * BACKING_SCALE}
      role="img"
      aria-label={t`Thumbnail preview: ${scene.match.sides[0].name} vs ${scene.match.sides[1].name}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
};
