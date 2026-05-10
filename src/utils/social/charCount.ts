let cachedSegmenter: Intl.Segmenter | null = null;

const getSegmenter = (): Intl.Segmenter | null => {
  if (cachedSegmenter) return cachedSegmenter;
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return null;
  }
  cachedSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return cachedSegmenter;
};

export const countBlueskyGraphemes = (text: string): number => {
  const segmenter = getSegmenter();
  if (!segmenter) {
    return [...text].length;
  }
  return [...segmenter.segment(text)].length;
};

export const X_CHAR_LIMIT = 280;
export const BLUESKY_CHAR_LIMIT = 300;
