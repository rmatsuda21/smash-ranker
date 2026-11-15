import { useMemo, useRef } from "react";

/** A function with a stable identity that always calls the latest `fn`.
 *  Lets ready callbacks sit outside `useMemo` dependency lists. */
export const useLatestCallback = <Args extends unknown[]>(
  fn: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) => {
  const ref = useRef(fn);
  ref.current = fn;
  return useMemo(
    () =>
      (...args: Args) =>
        ref.current?.(...args),
    [],
  );
};
