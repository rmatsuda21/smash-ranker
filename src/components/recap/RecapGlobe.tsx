import { useCallback, useEffect, useRef } from "react";

import type { RecapCity } from "@/types/recap/Recap";
import { logWarning } from "@/utils/observability/log";
import { loadRecapGlobe, type RecapGlobeGeo } from "@/utils/recap/loadGlobe";

import styles from "./recap.module.scss";

type Props = {
  cities: RecapCity[];
  // Rotation that shows as many cities as possible.
  restView: [number, number];
  // Drag to spin, pinch or scroll to zoom, tap a pin.
  exploring: boolean;
  selected: number;
  onSelect: (index: number) => void;
  label: string;
};

const SEA = "#1a1922";
const LAND = "#3d3a4d";
const RIM = "#2a2835";
const INK = "#0e0d13";
const PAPER = "#f6f2f5";
const ROUTE = "#ffd60a";
const HOME = "#e93d82";
// How close the globe opens on home before it pulls back.
const INTRO_ZOOM = 4.2;
const MAX_ZOOM = 8;
// Pins this far round the globe (radians) are over the horizon.
const HORIZON = 1.52;
// Every city gets a label from this zoom; below it, one per region.
const LABEL_ZOOM = 2.6;
// A tap within this many pixels of a pin selects it.
const TAP_RADIUS = 26;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// The player's cities on a globe, with routes from home. It opens zoomed on
// home while the nearby pins appear, then pulls back as the long routes arc
// out; in `exploring` mode the viewer takes over. Drawn on a canvas and
// repainted from refs: nothing here re-renders React per frame.
export const RecapGlobe = ({
  cities,
  restView,
  exploring,
  selected,
  onSelect,
  label,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<RecapGlobeGeo | null>(null);
  const view = useRef({
    rotation: [...restView] as [number, number],
    zoom: 1,
    // How much of each route is drawn and how big each pin is, 0–1.
    routes: cities.map(() => 1),
    pins: cities.map(() => 1),
  });
  const hits = useRef<{ index: number; x: number; y: number }[]>([]);
  const selectedRef = useRef(selected);
  const frameRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo = geoRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !geo || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const density = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * density);
    const height = Math.round(rect.height * density);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const { rotation, zoom, routes, pins } = view.current;
    const projection = geo.d3
      .geoOrthographic()
      .translate([width / 2, height / 2])
      .scale((Math.min(width, height) / 2) * 0.92 * zoom)
      .rotate(rotation)
      .clipAngle(90)
      .precision(0.3);
    const path = geo.d3.geoPath(projection, ctx);
    const home = cities[0];

    ctx.clearRect(0, 0, width, height);
    ctx.setLineDash([]);
    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = SEA;
    ctx.fill();
    ctx.beginPath();
    path(geo.d3.geoGraticule10());
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = density;
    ctx.stroke();
    ctx.beginPath();
    path(geo.land);
    ctx.fillStyle = LAND;
    ctx.fill();
    ctx.beginPath();
    path(geo.borders);
    ctx.strokeStyle = SEA;
    ctx.lineWidth = density * 0.8;
    ctx.stroke();
    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.strokeStyle = RIM;
    ctx.lineWidth = 2 * density;
    ctx.stroke();

    // Routes from home, as far as each has been drawn.
    ctx.setLineDash([5 * density, 5 * density]);
    ctx.strokeStyle = ROUTE;
    ctx.lineWidth = 2.2 * density;
    ctx.lineCap = "round";
    cities.forEach((city, index) => {
      if (index === 0 || routes[index] <= 0) return;
      const end = geo.d3.geoInterpolate(
        [home.lon, home.lat],
        [city.lon, city.lat],
      )(routes[index]);
      ctx.beginPath();
      path({ type: "LineString", coordinates: [[home.lon, home.lat], end] });
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const centre: [number, number] = [-rotation[0], -rotation[1]];
    const labels: {
      x: number;
      y: number;
      radius: number;
      text: string;
      rank: number;
      isHome: boolean;
    }[] = [];
    hits.current = [];
    cities.forEach((city, index) => {
      const size = pins[index];
      if (size <= 0) return;
      if (geo.d3.geoDistance([city.lon, city.lat], centre) > HORIZON) return;
      const point = projection([city.lon, city.lat]);
      if (!point) return;
      const isSelected = index === selectedRef.current;
      const radius =
        (city.isHome ? 7.5 : 4.6) * density * size * (isSelected ? 1.35 : 1);
      ctx.beginPath();
      ctx.arc(point[0], point[1], radius, 0, Math.PI * 2);
      ctx.fillStyle = city.isHome ? HOME : PAPER;
      ctx.fill();
      ctx.lineWidth = 2 * density;
      ctx.strokeStyle = isSelected ? ROUTE : INK;
      ctx.stroke();
      hits.current.push({
        index,
        x: point[0] / density,
        y: point[1] / density,
      });
      if (size >= 1 && (city.showLabel || zoom > LABEL_ZOOM || isSelected)) {
        labels.push({
          x: point[0],
          y: point[1],
          radius,
          text: `${city.name} · ${city.count}`,
          rank: (isSelected ? 2 : 0) + (city.isHome ? 1 : 0),
          isHome: city.isHome,
        });
      }
    });

    // Labels go beside their pin on the side with more room, then try other
    // spots, and are left out rather than drawn over one another.
    const boxes: [number, number, number, number][] = [];
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    labels
      .sort((a, b) => b.rank - a.rank)
      .forEach((item) => {
        ctx.font = `800 ${(item.isHome ? 13 : 11) * density}px "M PLUS Rounded 1c", sans-serif`;
        const textWidth = ctx.measureText(item.text).width;
        const line = 15 * density;
        const side = item.x > width / 2 ? -1 : 1;
        const spots = [
          [side, 0],
          [-side, 0],
          [side, 1],
          [side, -1],
          [-side, 1],
          [-side, -1],
          [side, 2],
          [side, -2],
        ];
        for (const [dir, row] of spots) {
          const gap = item.radius + 5 * density;
          const x = dir > 0 ? item.x + gap : item.x - gap - textWidth;
          const y = item.y + row * line - line / 2;
          const box: [number, number, number, number] = [
            x,
            y,
            x + textWidth,
            y + line,
          ];
          if (box[0] < 2 || box[2] > width - 2) continue;
          const overlaps = boxes.some(
            (other) =>
              box[0] < other[2] &&
              box[2] > other[0] &&
              box[1] < other[3] &&
              box[3] > other[1],
          );
          if (overlaps) continue;
          boxes.push(box);
          ctx.lineWidth = 4 * density;
          ctx.strokeStyle = INK;
          ctx.strokeText(item.text, x, y + line / 2);
          ctx.fillStyle = PAPER;
          ctx.fillText(item.text, x, y + line / 2);
          break;
        }
      });
  }, [cities]);

  // Usually in already: the recap asks for the map as it opens.
  useEffect(() => {
    let cancelled = false;
    loadRecapGlobe()
      .then((geo) => {
        if (cancelled) return;
        geoRef.current = geo;
        draw();
      })
      .catch((err: unknown) => {
        logWarning("recap globe failed to load", {
          area: "recap",
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [draw]);

  // The opening move, or the resting view once the viewer takes over.
  useEffect(() => {
    const state = view.current;
    const settle = () => {
      state.rotation = [...restView];
      state.zoom = 1;
      state.routes = cities.map(() => 1);
      state.pins = cities.map(() => 1);
      draw();
    };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (exploring || reduceMotion || cities.length === 0) {
      settle();
      return;
    }

    const home = cities[0];
    const from: [number, number] = [-home.lon, -home.lat];
    let near = 0;
    let far = 0;
    const plan = cities.map((city) =>
      city.isFar
        ? { at: 2 + far++ * 0.22, duration: 1 }
        : { at: 0.3 + near++ * 0.1, duration: 0.5 },
    );
    const end = Math.max(...plan.map((p) => p.at + p.duration), 3.5) + 0.3;
    const start = performance.now();
    frameRef.current = requestAnimationFrame(function step(now) {
      const t = (now - start) / 1000;
      const raw = clamp01((t - 1.5) / 1.8);
      const eased = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2;
      state.rotation = [
        from[0] + (restView[0] - from[0]) * eased,
        from[1] + (restView[1] - from[1]) * eased,
      ];
      state.zoom = INTRO_ZOOM + (1 - INTRO_ZOOM) * eased;
      cities.forEach((_, index) => {
        const { at, duration } = plan[index];
        const progress = clamp01((t - at) / duration);
        state.routes[index] = index ? 1 - (1 - progress) ** 3 : 0;
        state.pins[index] = index
          ? clamp01((t - at - duration * 0.7) / 0.25)
          : clamp01(t / 0.3);
      });
      draw();
      if (t < end) frameRef.current = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [cities, restView, exploring, draw]);

  useEffect(() => {
    selectedRef.current = selected;
    draw();
  }, [selected, draw]);

  // The canvas changes size when the slide makes room for exploring.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  // Dragging, pinching and tapping, while exploring.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !exploring) return;
    const state = view.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let lastSpread = 0;
    const zoomBy = (factor: number) => {
      state.zoom = Math.min(MAX_ZOOM, Math.max(1, state.zoom * factor));
    };

    const down = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved = 0;
      lastSpread = 0;
    };
    const move = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastSpread) zoomBy(spread / lastSpread);
        lastSpread = spread;
        moved = Infinity;
      } else {
        moved += Math.abs(dx) + Math.abs(dy);
        const rect = canvas.getBoundingClientRect();
        const radius =
          (Math.min(rect.width, rect.height) / 2) * 0.92 * state.zoom;
        const degrees = 180 / (Math.PI * radius);
        state.rotation = [
          state.rotation[0] + dx * degrees,
          Math.max(-85, Math.min(85, state.rotation[1] - dy * degrees)),
        ];
      }
      draw();
    };
    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      lastSpread = 0;
      if (moved >= 6) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let nearest = -1;
      let distance = TAP_RADIUS;
      for (const hit of hits.current) {
        const d = Math.hypot(hit.x - x, hit.y - y);
        if (d < distance) {
          distance = d;
          nearest = hit.index;
        }
      }
      onSelect(nearest);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(Math.exp(-event.deltaY * 0.0015));
      draw();
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [exploring, draw, onSelect]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.globe}
      role="img"
      aria-label={label}
    />
  );
};
