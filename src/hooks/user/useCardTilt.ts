import { useEffect, type RefObject } from "react";

import {
  hasMotionAccess,
  onMotionAccess,
  requestMotionAccess,
} from "@/utils/motionAccess";

// How far the card turns at the edge of its range.
const MAX_ANGLE = 14;
// Degrees of phone tilt that take the light from the middle to an edge.
const MOTION_RANGE = 28;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Turns the element with the pointer (desktop) or the phone's tilt (mobile)
// and tells its CSS where the light is: `--px`/`--py` (0–100), `--rx`/`--ry`
// (angles) and `--hyp` (0 in the middle, 1 at a corner). Left alone it sways
// slowly so the shimmer is never still. Written straight to the element
// every frame; nothing here re-renders React.
export const useCardTilt = (ref: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const paint = (x: number, y: number) => {
      const dx = x - 0.5;
      const dy = y - 0.5;
      element.style.setProperty("--px", (x * 100).toFixed(2));
      element.style.setProperty("--py", (y * 100).toFixed(2));
      element.style.setProperty(
        "--ry",
        `${(dx * 2 * MAX_ANGLE).toFixed(2)}deg`,
      );
      element.style.setProperty(
        "--rx",
        `${(-dy * 2 * MAX_ANGLE).toFixed(2)}deg`,
      );
      element.style.setProperty(
        "--hyp",
        Math.min(1, Math.hypot(dx, dy) * 2).toFixed(3),
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // A still card with the light fixed off-centre.
      paint(0.35, 0.3);
      return;
    }

    let x = 0.35;
    let y = 0.3;
    let targetX = x;
    let targetY = y;
    let held = false;
    // The phone's tilt, relative to how it was held at the first reading.
    let motion: { x: number; y: number } | null = null;
    let origin: { beta: number; gamma: number } | null = null;

    const follow = (e: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      targetX = clamp((e.clientX - rect.left) / rect.width);
      targetY = clamp((e.clientY - rect.top) / rect.height);
    };
    const onEnter = (e: PointerEvent) => {
      held = true;
      follow(e);
    };
    const onMove = (e: PointerEvent) => {
      if (held) follow(e);
    };
    const onLeave = () => {
      held = false;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") held = false;
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      origin ??= { beta: e.beta, gamma: e.gamma };
      motion = {
        x: clamp(0.5 + (e.gamma - origin.gamma) / (MOTION_RANGE * 2)),
        y: clamp(0.5 + (e.beta - origin.beta) / (MOTION_RANGE * 2)),
      };
    };

    // iOS hands out motion data only after the user allows it, and only
    // asks from inside a tap: a tap on the card asks, and so can anything
    // earlier on the page (see `motionAccess`). Everywhere else it just works.
    let listening = false;
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("deviceorientation", onOrientation);
    };
    if (hasMotionAccess()) listen();
    const stopWaiting = onMotionAccess(listen);
    const onTap = () => requestMotionAccess();

    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerdown", onEnter);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointercancel", onLeave);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("click", onTap);

    let frame = 0;
    const tick = (time: number) => {
      if (!held) {
        if (motion) {
          targetX = motion.x;
          targetY = motion.y;
        } else {
          const phase = time / 1000;
          targetX = 0.5 + Math.sin(phase * 0.7) * 0.3;
          targetY = 0.42 + Math.cos(phase * 0.5) * 0.2;
        }
      }
      // Quick under a finger or the mouse, lazy when drifting.
      const ease = held || motion ? 0.18 : 0.06;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      paint(x, y);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      stopWaiting();
      window.removeEventListener("deviceorientation", onOrientation);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerdown", onEnter);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointercancel", onLeave);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("click", onTap);
    };
  }, [ref]);
};
