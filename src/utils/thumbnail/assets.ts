import type { ThumbnailSide } from "@/types/thumbnail/Thumbnail";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import type {
  ThumbnailAssets,
  ThumbnailScene,
} from "@/utils/thumbnail/painter";

// Images stay in memory once loaded, so moving between sets and redrawing
// while typing never waits on the network twice. A failed load is kept as
// null: the painter draws without it.
const loaded = new Map<string, HTMLImageElement | null>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();

const readImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    // Drawn to a canvas that is exported, so it must not taint it.
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// A tournament icon the toolbar has already shown sits in the browser's
// cache without CORS headers, and a CORS request for it is refused from
// that copy. Fetching it afresh gets one that can be drawn.
const readImageAfresh = async (
  src: string,
): Promise<HTMLImageElement | null> => {
  try {
    const response = await fetch(src, { cache: "reload" });
    if (!response.ok) return null;
    return await readImage(URL.createObjectURL(await response.blob()));
  } catch {
    return null;
  }
};

// `afresh` is for files another part of the page may have loaded already
// without CORS (the logo).
const loadImage = (
  src: string,
  afresh = false,
): Promise<HTMLImageElement | null> => {
  if (loaded.has(src)) return Promise.resolve(loaded.get(src) ?? null);
  const inflight = pending.get(src);
  if (inflight) return inflight;

  const promise = (
    afresh && src.startsWith("http") ? readImageAfresh(src) : readImage(src)
  ).then((image) => {
    loaded.set(src, image);
    pending.delete(src);
    return image;
  });
  pending.set(src, promise);
  return promise;
};

export const hasCharacter = (side: ThumbnailSide): boolean =>
  !!side.characterId && isKnownCharacter(side.characterId);

const artUrl = (side: ThumbnailSide): string | null =>
  hasCharacter(side)
    ? getCharImgUrl({ characterId: side.characterId, alt: side.alt })
    : null;

const load = (src: string | null, afresh = false) =>
  src ? loadImage(src, afresh) : null;

export const loadThumbnailAssets = async (
  scene: ThumbnailScene,
): Promise<ThumbnailAssets> => {
  const [left, right, logo] = await Promise.all([
    load(artUrl(scene.match.sides[0])),
    load(artUrl(scene.match.sides[1])),
    load(scene.logoSrc, true),
    // The canvas falls back silently to another face if the font is not in.
    loadFamily(scene.look.font, [900]).catch(() => undefined),
  ]);
  return { art: [left, right], logo };
};

// What is already in memory, for a first paint that does not wait.
export const peekThumbnailAssets = (scene: ThumbnailScene): ThumbnailAssets => {
  const peek = (src: string | null) => (src ? (loaded.get(src) ?? null) : null);
  return {
    art: [
      peek(artUrl(scene.match.sides[0])),
      peek(artUrl(scene.match.sides[1])),
    ],
    logo: peek(scene.logoSrc),
  };
};
