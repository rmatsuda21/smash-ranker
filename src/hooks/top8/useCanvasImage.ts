import { useEffect, useState } from "react";
import { Stage } from "konva/lib/Stage";

import { exportCanvasToPngBlob } from "@/utils/top8/exportCanvas";
import {
  buildStageBlobKey,
  type StageBlobCache,
} from "@/hooks/top8/useStageBlobCache";
import { getDeviceRenderProfile } from "@/utils/top8/renderProfile";

const SOCIAL_PIXEL_RATIO = getDeviceRenderProfile().socialPixelRatio;
const SOCIAL_CACHE_KEY = buildStageBlobKey("image/png", SOCIAL_PIXEL_RATIO, 1);

/**
 * Snapshots the Konva stage to a PNG once on mount and tracks an object
 * URL for it. If a shared cache is provided and already has a matching
 * entry, reuse the cached blob (creating a fresh local URL) instead of
 * re-rendering the stage.
 *
 * The local URL's lifecycle is owned by this hook — created when the
 * blob is acquired (from cache or fresh export) and revoked on cleanup.
 * The cached blob itself outlives this URL.
 */
export const useCanvasImage = (
  stageRef: Stage | null,
  cacheRef?: StageBlobCache,
) => {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stageRef) {
      setLoading(false);
      return;
    }

    let createdUrl: string | null = null;
    const adoptBlob = (next: Blob) => {
      createdUrl = URL.createObjectURL(next);
      setBlob(next);
      setUrl(createdUrl);
    };

    const cached = cacheRef?.current.entry;
    if (cached?.key === SOCIAL_CACHE_KEY) {
      adoptBlob(cached.blob);
      setLoading(false);
      return () => {
        if (createdUrl) URL.revokeObjectURL(createdUrl);
      };
    }

    let cancelled = false;
    setLoading(true);
    const startEpoch = cacheRef?.current.epoch ?? 0;

    void exportCanvasToPngBlob({ stageRef, pixelRatio: SOCIAL_PIXEL_RATIO })
      .then((next) => {
        if (cancelled || !next) return;

        // Only write to the shared cache if no invalidation happened
        // mid-flight — otherwise the blob is already stale.
        if (cacheRef && cacheRef.current.epoch === startEpoch) {
          cacheRef.current.entry = { key: SOCIAL_CACHE_KEY, blob: next };
        }
        adoptBlob(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [stageRef, cacheRef]);

  return { blob, url, loading };
};
