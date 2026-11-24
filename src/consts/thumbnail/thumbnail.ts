// The size every template is drawn at, and the size of the saved image:
// what YouTube asks for, and small enough to stay under its 2 MB limit.
export const THUMBNAIL_WIDTH = 1280;
export const THUMBNAIL_HEIGHT = 720;

export const DEFAULT_THUMBNAIL_FONT = "Dela Gothic One";

export const MIN_ART_ZOOM = 0.4;
export const MAX_ART_ZOOM = 3;

// start.gg counts about 30 objects for a set with its players and picks, and
// refuses a request that returns more than 1000.
export const SETS_PER_PAGE = 18;
// Pages read at a time, newest sets first: three cover a top 8 and the
// streamed sets before it.
export const SET_PAGES_PER_LOAD = 3;
