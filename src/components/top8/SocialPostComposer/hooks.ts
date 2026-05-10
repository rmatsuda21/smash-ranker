import { useEffect, useState } from "react";
import { Stage } from "konva/lib/Stage";

import { exportCanvasToPngBlob } from "@/utils/top8/exportCanvas";

type ParseTweetFn = (text: string) => { weightedLength: number };

/**
 * Snapshots the Konva stage to a PNG once on mount and tracks an object
 * URL for it. Cleans up the URL on unmount.
 */
export const useCanvasImage = (stageRef: Stage | null) => {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stageRef) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let createdUrl: string | null = null;
    setLoading(true);
    void exportCanvasToPngBlob({ stageRef, pixelRatio: 2 })
      .then((next) => {
        if (cancelled || !next) return;
        createdUrl = URL.createObjectURL(next);
        setBlob(next);
        setUrl(createdUrl);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [stageRef]);

  return { blob, url, loading };
};

/**
 * Lazy-loads the `twitter-text` package and returns its `parseTweet`
 * function once the chunk arrives. Returns null until then so callers
 * know to fall back to a simple length count.
 */
export const useTwitterTextParser = (enabled: boolean) => {
  const [parseTweet, setParseTweet] = useState<ParseTweetFn | null>(null);

  useEffect(() => {
    if (!enabled || parseTweet) return;
    let cancelled = false;
    void import("twitter-text").then((m) => {
      if (cancelled) return;
      const mod = m as unknown as {
        parseTweet?: ParseTweetFn;
        default?: { parseTweet?: ParseTweetFn };
      };
      const fn = mod.parseTweet ?? mod.default?.parseTweet;
      if (typeof fn === "function") setParseTweet(() => fn);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, parseTweet]);

  return parseTweet;
};

