// How old data of something not finished may get before it is loaded again.
// Not shorter, and never on a timer: every visitor without a login shares
// start.gg's 80 requests a minute.
export const LIVE_MAX_AGE_MS = 60_000;
