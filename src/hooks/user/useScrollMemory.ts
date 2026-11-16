import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import {
  readUserPageMemory,
  writeUserPageMemory,
} from "@/utils/user/pageMemory";

const SAVE_DELAY_MS = 150;

// Remembers how far the profile page was scrolled and puts it back when the
// user returns with Back. `ready` is when the page has its final height
// (everything above the list has loaded); restoring earlier would land on
// the wrong tournament. If the user starts scrolling before then, their
// scrolling wins.
export const useScrollMemory = (
  ref: RefObject<HTMLElement | null>,
  ready: boolean,
) => {
  const pendingRef = useRef<number | null>(
    readUserPageMemory().scrollTop ?? null,
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timer = 0;
    const onScroll = () => {
      // Don't record positions on the way to the one being restored.
      if (pendingRef.current !== null) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => writeUserPageMemory({ scrollTop: element.scrollTop }),
        SAVE_DELAY_MS,
      );
    };
    const cancelRestore = () => {
      pendingRef.current = null;
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("wheel", cancelRestore, { passive: true });
    element.addEventListener("touchstart", cancelRestore, { passive: true });
    element.addEventListener("keydown", cancelRestore);
    return () => {
      window.clearTimeout(timer);
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("wheel", cancelRestore);
      element.removeEventListener("touchstart", cancelRestore);
      element.removeEventListener("keydown", cancelRestore);
    };
  }, [ref]);

  useLayoutEffect(() => {
    if (!ready || pendingRef.current === null || !ref.current) return;
    ref.current.scrollTop = pendingRef.current;
    pendingRef.current = null;
  }, [ready, ref]);
};
