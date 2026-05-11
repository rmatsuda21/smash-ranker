import { useEffect, useRef, type MutableRefObject } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { useFontStore } from "@/store/fontStore";

export type StageBlobCacheEntry = { key: string; blob: Blob };

export type StageBlobCacheState = {
  entry: StageBlobCacheEntry | null;
  /** Bumped on every invalidation. Consumers capture the value before
   *  starting an async export and refuse to write the cache if the value
   *  has changed by the time the export resolves — protects against
   *  caching a blob that no longer reflects current state. */
  epoch: number;
};

export type StageBlobCache = MutableRefObject<StageBlobCacheState>;

/**
 * Builds a stable cache key from export settings. PNG ignores `quality`
 * (only jpeg/webp use it), so we omit it from the key for png to let the
 * social composer (no quality) and the export modal (quality slider)
 * share the same cached PNG bytes.
 */
export const buildStageBlobKey = (
  mimeType: string,
  pixelRatio: number,
  quality: number,
): string =>
  mimeType === "image/png"
    ? `${mimeType}|${pixelRatio}`
    : `${mimeType}|${pixelRatio}|${quality}`;

/**
 * Single-entry blob cache for snapshots of the Konva stage. Shared across
 * the export-preview modal and the social-post composer so reopening the
 * same graphic skips a full re-render.
 *
 * The cache holds blobs only — consumers create and revoke their own
 * object URLs from `entry.blob`. This keeps URL lifecycle local to the
 * consumer that's rendering, so a cache invalidation mid-display doesn't
 * yank the URL out from under a still-mounted <img>.
 *
 * Subscribes to the stores that drive canvas output and invalidates the
 * cache (clearing `entry`, bumping `epoch`) whenever any of them change.
 */
export const useStageBlobCache = (): StageBlobCache => {
  const ref = useRef<StageBlobCacheState>({ entry: null, epoch: 0 });

  useEffect(() => {
    const invalidate = () => {
      ref.current.entry = null;
      ref.current.epoch += 1;
    };

    const unsubscribers = [
      useCanvasStore.subscribe((state, prev) => {
        if (state.design !== prev.design || state.font !== prev.font) {
          invalidate();
        }
      }),
      usePlayerStore.subscribe((state, prev) => {
        if (state.players !== prev.players) invalidate();
      }),
      useTournamentStore.subscribe((state, prev) => {
        if (state.info !== prev.info) invalidate();
      }),
      useFontStore.subscribe((state, prev) => {
        if (state.displayedFont !== prev.displayedFont) invalidate();
      }),
    ];

    return () => {
      unsubscribers.forEach((u) => u());
      invalidate();
    };
  }, []);

  return ref;
};
