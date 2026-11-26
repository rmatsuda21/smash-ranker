import { PREF_KEYS } from "@/consts/prefKeys";
import { getPref, setPref } from "@/utils/prefs";

// The home page's tournaments are as tall as their names and places make
// them, which a fixed placeholder cannot match. So the height they took last
// time is kept, with the window width it was measured at (the text wraps
// differently at another), and the placeholder takes it on the next visit.

type Stored = { viewportWidth: number; height: number };

// The height the tournaments had last time at this window width.
export const readTournamentsHeight = (): number | undefined => {
  const raw = getPref(PREF_KEYS.HOME_TOURNAMENTS_HEIGHT);
  if (!raw) return;
  try {
    const { viewportWidth, height } = JSON.parse(raw) as Partial<Stored>;
    if (viewportWidth !== window.innerWidth) return;
    if (typeof height !== "number" || !(height > 0)) return;
    return height;
  } catch {
    return;
  }
};

// A ref callback for the tournaments' container: keeps its height up to date
// while it is on screen (fonts arriving, the window resized).
export const observeTournamentsHeight = (element: HTMLElement | null) => {
  if (!element) return;
  const observer = new ResizeObserver(() => {
    const stored: Stored = {
      viewportWidth: window.innerWidth,
      height: element.offsetHeight,
    };
    setPref(PREF_KEYS.HOME_TOURNAMENTS_HEIGHT, JSON.stringify(stored));
  });
  observer.observe(element);
  return () => observer.disconnect();
};
