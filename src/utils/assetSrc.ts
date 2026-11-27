// A stored image is shown through an address the image service worker
// answers (public/idb-image-sw.js, which has its own copy of this prefix):
// the prefix followed by the asset's id.
export const IDB_IMAGES_BASE_URL = "/idb-images/";

export const isIdbImageSrc = (src: string): boolean =>
  src.startsWith(IDB_IMAGES_BASE_URL);

export const assetSrc = (id: string): string => `${IDB_IMAGES_BASE_URL}${id}`;

// The id of the stored image an address points at, or null for any other
// address (a URL, a bundled file).
export const assetIdFromSrc = (src: string): string | null =>
  isIdbImageSrc(src) ? src.slice(IDB_IMAGES_BASE_URL.length) || null : null;
