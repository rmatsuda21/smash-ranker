/**
 * Dev-only timings for the Top 8 render pipeline. Everything here is a no-op
 * in production builds.
 *
 * Measures show up in the DevTools Performance panel under "Timings", and
 * `window.__rankerPerf()` prints per-name totals to compare before and after a
 * change.
 */

const ENABLED = import.meta.env.DEV && typeof performance !== "undefined";
const PREFIX = "ranker:";

type PerfSummaryRow = { count: number; totalMs: number; maxMs: number };

declare global {
  interface Window {
    __rankerPerf?: () => Record<string, PerfSummaryRow>;
  }
}

/** Time a synchronous function. */
export const perfMeasure = <T>(name: string, fn: () => T): T => {
  if (!ENABLED) return fn();

  const start = performance.now();
  try {
    return fn();
  } finally {
    performance.measure(PREFIX + name, { start, end: performance.now() });
  }
};

/** Drop a named mark, e.g. when a canvas mounts. */
export const perfMark = (name: string): void => {
  if (!ENABLED) return;
  performance.mark(PREFIX + name);
};

/** Record the time from the latest `perfMark(startMark)` until now. */
export const perfMeasureSince = (name: string, startMark: string): void => {
  if (!ENABLED) return;

  const marks = performance.getEntriesByName(PREFIX + startMark, "mark");
  const start = marks[marks.length - 1]?.startTime;
  if (start === undefined) return;

  performance.measure(PREFIX + name, { start, end: performance.now() });
};

if (ENABLED && typeof window !== "undefined") {
  window.__rankerPerf = () => {
    const summary: Record<string, PerfSummaryRow> = {};

    for (const entry of performance.getEntriesByType("measure")) {
      if (!entry.name.startsWith(PREFIX)) continue;

      const name = entry.name.slice(PREFIX.length);
      const row = (summary[name] ??= { count: 0, totalMs: 0, maxMs: 0 });
      row.count += 1;
      row.totalMs += entry.duration;
      row.maxMs = Math.max(row.maxMs, entry.duration);
    }

    console.table(summary);
    return summary;
  };
}
