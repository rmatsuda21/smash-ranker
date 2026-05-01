import { SNAP_THRESHOLD } from "@/consts/thumbnail/defaults";

export type BBox = { x: number; y: number; width: number; height: number };

export type SnapGuide = {
  axis: "x" | "y";
  position: number;
  start: number;
  end: number;
};

export type SnapResult = {
  dx: number;
  dy: number;
  guides: SnapGuide[];
};

const DEFAULT_RESULT: SnapResult = { dx: 0, dy: 0, guides: [] };

const EDGE_OFFSETS = [0, 0.5, 1] as const;

const getEdgeValue = (start: number, size: number, ratio: number) =>
  start + size * ratio;

const findClosestSnap = (
  active: number,
  candidates: number[],
  threshold: number,
): { delta: number; matched: number | null } => {
  let bestDelta = Infinity;
  let matched: number | null = null;
  for (const c of candidates) {
    const delta = c - active;
    if (Math.abs(delta) < Math.abs(bestDelta)) {
      bestDelta = delta;
      matched = c;
    }
  }
  if (Math.abs(bestDelta) > threshold) {
    return { delta: 0, matched: null };
  }
  return { delta: bestDelta, matched };
};

export type TransformBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type TransformSnapResult = {
  box: TransformBox;
  guides: SnapGuide[];
};

const findClosestEdgeSnap = (
  current: number,
  candidates: number[],
  threshold: number,
): { delta: number; matched: number | null } => {
  let bestDelta = 0;
  let bestAbs = Infinity;
  let matched: number | null = null;
  for (const c of candidates) {
    const d = c - current;
    const abs = Math.abs(d);
    if (abs < bestAbs && abs <= threshold) {
      bestDelta = d;
      bestAbs = abs;
      matched = c;
    }
  }
  return { delta: bestDelta, matched };
};

// Snap the edges of `newBox` to nearby targets. Only the edges that actually
// changed between oldBox and newBox are snapped — that way scaling from one
// side doesn't drift the opposite side. Skips snapping when the box is
// rotated (the bbox in that case isn't axis-aligned and edge-snapping would
// look wrong).
export const computeTransformSnap = ({
  oldBox,
  newBox,
  others,
  canvasSize,
  threshold = SNAP_THRESHOLD,
  snapToGrid = false,
  gridSize = 0,
  snapToElements = true,
}: {
  oldBox: TransformBox;
  newBox: TransformBox;
  others: BBox[];
  canvasSize: { width: number; height: number };
  threshold?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  snapToElements?: boolean;
}): TransformSnapResult => {
  const guides: SnapGuide[] = [];
  if (newBox.rotation !== 0 && Math.abs(newBox.rotation % 360) > 0.5) {
    return { box: newBox, guides };
  }
  if (!snapToElements && !snapToGrid) {
    return { box: newBox, guides };
  }

  const xTargets: number[] = [];
  const yTargets: number[] = [];
  if (snapToElements) {
    xTargets.push(0, canvasSize.width / 2, canvasSize.width);
    yTargets.push(0, canvasSize.height / 2, canvasSize.height);
    for (const o of others) {
      xTargets.push(o.x, o.x + o.width / 2, o.x + o.width);
      yTargets.push(o.y, o.y + o.height / 2, o.y + o.height);
    }
  }
  if (snapToGrid && gridSize > 0) {
    // Add nearby grid lines as candidates
    for (let v = 0; v <= canvasSize.width; v += gridSize) xTargets.push(v);
    for (let v = 0; v <= canvasSize.height; v += gridSize) yTargets.push(v);
  }

  const EPS = 0.5;
  const leftChanged = Math.abs(oldBox.x - newBox.x) > EPS;
  const rightChanged =
    Math.abs(oldBox.x + oldBox.width - (newBox.x + newBox.width)) > EPS;
  const topChanged = Math.abs(oldBox.y - newBox.y) > EPS;
  const bottomChanged =
    Math.abs(oldBox.y + oldBox.height - (newBox.y + newBox.height)) > EPS;

  let { x, y, width, height } = newBox;

  // Snap left edge (anchors right side)
  if (leftChanged) {
    const r = findClosestEdgeSnap(x, xTargets, threshold);
    if (r.matched !== null) {
      x += r.delta;
      width -= r.delta;
      guides.push({
        axis: "x",
        position: r.matched,
        start: 0,
        end: canvasSize.height,
      });
    }
  }
  // Snap right edge
  if (rightChanged) {
    const right = x + width;
    const r = findClosestEdgeSnap(right, xTargets, threshold);
    if (r.matched !== null) {
      width += r.delta;
      guides.push({
        axis: "x",
        position: r.matched,
        start: 0,
        end: canvasSize.height,
      });
    }
  }
  // Snap top edge
  if (topChanged) {
    const r = findClosestEdgeSnap(y, yTargets, threshold);
    if (r.matched !== null) {
      y += r.delta;
      height -= r.delta;
      guides.push({
        axis: "y",
        position: r.matched,
        start: 0,
        end: canvasSize.width,
      });
    }
  }
  // Snap bottom edge
  if (bottomChanged) {
    const bottom = y + height;
    const r = findClosestEdgeSnap(bottom, yTargets, threshold);
    if (r.matched !== null) {
      height += r.delta;
      guides.push({
        axis: "y",
        position: r.matched,
        start: 0,
        end: canvasSize.width,
      });
    }
  }

  return { box: { x, y, width, height, rotation: newBox.rotation }, guides };
};

export const computeSnap = ({
  active,
  others,
  canvasSize,
  threshold = SNAP_THRESHOLD,
  snapToGrid = false,
  gridSize = 0,
  snapToElements = true,
}: {
  active: BBox;
  others: BBox[];
  canvasSize: { width: number; height: number };
  threshold?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  snapToElements?: boolean;
}): SnapResult => {
  if (!snapToElements && !snapToGrid) return DEFAULT_RESULT;

  const xCandidates: number[] = [];
  const yCandidates: number[] = [];

  if (snapToElements) {
    xCandidates.push(0, canvasSize.width / 2, canvasSize.width);
    yCandidates.push(0, canvasSize.height / 2, canvasSize.height);
    for (const o of others) {
      for (const r of EDGE_OFFSETS) {
        xCandidates.push(getEdgeValue(o.x, o.width, r));
        yCandidates.push(getEdgeValue(o.y, o.height, r));
      }
    }
  }

  const activeXEdges = EDGE_OFFSETS.map((r) =>
    getEdgeValue(active.x, active.width, r),
  );
  const activeYEdges = EDGE_OFFSETS.map((r) =>
    getEdgeValue(active.y, active.height, r),
  );

  let bestDx = 0;
  let bestDy = 0;
  let dxSet = false;
  let dySet = false;
  const guides: SnapGuide[] = [];

  if (snapToGrid && gridSize > 0) {
    const leftSnap = Math.round(active.x / gridSize) * gridSize;
    const dxGrid = leftSnap - active.x;
    if (Math.abs(dxGrid) <= threshold) {
      bestDx = dxGrid;
      dxSet = true;
    }
    const topSnap = Math.round(active.y / gridSize) * gridSize;
    const dyGrid = topSnap - active.y;
    if (Math.abs(dyGrid) <= threshold) {
      bestDy = dyGrid;
      dySet = true;
    }
  }

  if (snapToElements) {
    let bestX: { delta: number; matched: number | null } = {
      delta: 0,
      matched: null,
    };
    let bestXAbs = Infinity;
    for (const edge of activeXEdges) {
      const r = findClosestSnap(edge, xCandidates, threshold);
      if (r.matched != null && Math.abs(r.delta) < bestXAbs) {
        bestX = r;
        bestXAbs = Math.abs(r.delta);
      }
    }
    if (bestX.matched != null) {
      bestDx = bestX.delta;
      dxSet = true;
      guides.push({
        axis: "x",
        position: bestX.matched,
        start: 0,
        end: canvasSize.height,
      });
    }

    let bestY: { delta: number; matched: number | null } = {
      delta: 0,
      matched: null,
    };
    let bestYAbs = Infinity;
    for (const edge of activeYEdges) {
      const r = findClosestSnap(edge, yCandidates, threshold);
      if (r.matched != null && Math.abs(r.delta) < bestYAbs) {
        bestY = r;
        bestYAbs = Math.abs(r.delta);
      }
    }
    if (bestY.matched != null) {
      bestDy = bestY.delta;
      dySet = true;
      guides.push({
        axis: "y",
        position: bestY.matched,
        start: 0,
        end: canvasSize.width,
      });
    }
  }

  return {
    dx: dxSet ? bestDx : 0,
    dy: dySet ? bestDy : 0,
    guides,
  };
};
