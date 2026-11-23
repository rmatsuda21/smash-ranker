import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaXmark } from "react-icons/fa6";

import { useMediaQuery } from "@/hooks/useMediaQuery";

import { RecapStoryContext } from "./RecapStoryContext";
import styles from "../recap.module.scss";

export type RecapGround = "ink" | "blue" | "yellow" | "pink" | "green";
export type RecapWipe = "slash" | "iris" | "shutter" | "drop";

export type RecapSlideDefinition = {
  id: string;
  // The slide's own colour: the wipe that brings it in is painted in it.
  ground: RecapGround;
  wipe: RecapWipe;
  render: () => ReactNode;
};

const GROUND_COLOR: Record<RecapGround, string> = {
  ink: "var(--rc-ink)",
  blue: "var(--rc-blue)",
  yellow: "var(--rc-yellow)",
  pink: "var(--rc-pink)",
  green: "var(--rc-green)",
};

// How long a slide stays before the story moves on.
const SLIDE_MS = 7500;
// Each half of a wipe; the slide changes under it in between.
const WIPE_MS = 380;
// A press shorter than this is a tap (navigate), longer is a hold (pause).
const TAP_MS = 280;
// Taps in the left part of the screen go back.
const BACK_ZONE = 0.3;

type Props = {
  slides: RecapSlideDefinition[];
  onClose: () => void;
  /** Called when a slide comes into view. */
  onSlide?: (id: string, index: number) => void;
  /** Open on this slide and stay on it: for working on one slide. */
  holdOn?: string | null;
};

// The story player: one slide at a time, progress bars along the top, tap
// right or left to move, hold to pause. A slide is mounted when it comes into
// view and unmounted when it leaves, so its entrance animations start over on
// every visit.
export const RecapStory = ({ slides, onClose, onSlide, holdOn }: Props) => {
  const { _ } = useLingui();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const first = Math.max(
    0,
    slides.findIndex((slide) => slide.id === holdOn),
  );
  const [index, setIndex] = useState(first);
  const [wipe, setWipe] = useState<{
    kind: RecapWipe;
    ground: RecapGround;
    phase: "in" | "out";
  } | null>(null);

  const barsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(first);
  const elapsedRef = useRef(0);
  const busyRef = useRef(false);
  const heldRef = useRef(false);
  const lockedRef = useRef(false);
  const downAtRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const show = useCallback((to: number) => {
    indexRef.current = to;
    elapsedRef.current = 0;
    lockedRef.current = false;
    setIndex(to);
  }, []);

  const go = useCallback(
    (to: number) => {
      if (busyRef.current || to < 0 || to >= slides.length) return;
      if (to === indexRef.current) return;
      if (reduceMotion) {
        show(to);
        return;
      }
      busyRef.current = true;
      const { wipe: kind, ground } = slides[to];
      setWipe({ kind, ground, phase: "in" });
      timersRef.current.push(
        window.setTimeout(() => {
          show(to);
          setWipe({ kind, ground, phase: "out" });
          timersRef.current.push(
            window.setTimeout(() => {
              setWipe(null);
              busyRef.current = false;
            }, WIPE_MS),
          );
        }, WIPE_MS),
      );
    },
    [slides, reduceMotion, show],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    onSlide?.(slides[index].id, index);
    // Only a change of slide is worth reporting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Progress bars and auto-advance, written straight to the DOM.
  useEffect(() => {
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const delta = now - last;
      last = now;
      const running =
        !holdOn &&
        !reduceMotion &&
        !busyRef.current &&
        !heldRef.current &&
        !lockedRef.current &&
        // A tab coming back from the background reports one huge frame.
        delta < 500;
      if (running) {
        elapsedRef.current += delta;
        if (elapsedRef.current >= SLIDE_MS) {
          if (indexRef.current < slides.length - 1) go(indexRef.current + 1);
          else elapsedRef.current = SLIDE_MS;
        }
      }
      const bars = barsRef.current?.children;
      if (bars) {
        for (let i = 0; i < bars.length; i++) {
          const fill = bars[i].firstElementChild as HTMLElement | null;
          if (!fill) continue;
          const share =
            i < indexRef.current
              ? 1
              : i > indexRef.current
                ? 0
                : reduceMotion
                  ? 1
                  : Math.min(1, elapsedRef.current / SLIDE_MS);
          fill.style.width = `${share * 100}%`;
        }
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [slides.length, reduceMotion, holdOn, go]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(indexRef.current + 1);
      else if (event.key === "ArrowLeft") go(indexRef.current - 1);
      else if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const controls = useMemo(
    () => ({
      setLocked: (locked: boolean) => {
        lockedRef.current = locked;
        heldRef.current = false;
      },
      replay: () => go(0),
    }),
    [go],
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    if (lockedRef.current) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    downAtRef.current = performance.now();
    heldRef.current = true;
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!heldRef.current) return;
    heldRef.current = false;
    if (performance.now() - downAtRef.current >= TAP_MS) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const back = event.clientX - rect.left < rect.width * BACK_ZONE;
    go(indexRef.current + (back ? -1 : 1));
  };
  const release = () => {
    heldRef.current = false;
  };

  return (
    <RecapStoryContext.Provider value={controls}>
      <div
        className={styles.phone}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={release}
        onPointerLeave={release}
      >
        <div className={styles.bars} ref={barsRef} aria-hidden="true">
          {slides.map((slide) => (
            <i key={slide.id}>
              <b />
            </i>
          ))}
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label={_(msg`Close`)}
          onClick={onClose}
        >
          <FaXmark aria-hidden="true" />
        </button>

        <Fragment key={slides[index].id}>{slides[index].render()}</Fragment>

        {wipe && (
          <div
            className={cn(styles.wipe, styles[wipe.kind], styles[wipe.phase])}
            style={{ "--c": GROUND_COLOR[wipe.ground] } as CSSProperties}
            aria-hidden="true"
          >
            <b />
            {[0, 1, 2, 3, 4].map((n) => (
              <i key={n} style={{ "--n": n } as CSSProperties} />
            ))}
          </div>
        )}
      </div>
    </RecapStoryContext.Provider>
  );
};
