export const buildXIntent = (text: string): string =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

export const buildBlueskyIntent = (text: string): string =>
  `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
