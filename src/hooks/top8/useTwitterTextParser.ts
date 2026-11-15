import { useEffect, useState } from "react";

type ParseTweetFn = (text: string) => { weightedLength: number };

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
