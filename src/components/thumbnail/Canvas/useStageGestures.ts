import { useEffect } from "react";

import { MAX_ZOOM, MIN_ZOOM } from "@/consts/thumbnail/defaults";

type Args = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
};

const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

export const useStageGestures = ({
  containerRef,
  zoom,
  pan,
  setZoom,
  setPan,
}: Args) => {
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let pinchStartDistance = 0;
    let pinchStartZoom = zoom;
    let pinchStartMid: { x: number; y: number } | null = null;
    let panStart: { x: number; y: number; panX: number; panY: number } | null =
      null;

    const distance = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const midpoint = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartDistance = distance(e.touches[0], e.touches[1]);
        pinchStartZoom = zoom;
        pinchStartMid = midpoint(e.touches[0], e.touches[1]);
        panStart = {
          x: pinchStartMid.x,
          y: pinchStartMid.y,
          panX: pan.x,
          panY: pan.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && panStart && pinchStartMid) {
        e.preventDefault();
        const newDistance = distance(e.touches[0], e.touches[1]);
        const ratio = newDistance / pinchStartDistance;
        const newZoom = clampZoom(pinchStartZoom * ratio);
        const newMid = midpoint(e.touches[0], e.touches[1]);
        setZoom(newZoom);
        setPan({
          x: panStart.panX + (newMid.x - panStart.x),
          y: panStart.panY + (newMid.y - panStart.y),
        });
      }
    };

    const onTouchEnd = () => {
      panStart = null;
      pinchStartMid = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const dz = e.deltaY < 0 ? 1.05 : 0.95;
        setZoom(clampZoom(zoom * dz));
      } else {
        e.preventDefault();
        setPan({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        });
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("wheel", onWheel);
    };
  }, [containerRef, zoom, pan, setZoom, setPan]);
};
