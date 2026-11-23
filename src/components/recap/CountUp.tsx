import { useEffect, useRef } from "react";

type Props = {
  value: number;
  /** Milliseconds before the count starts. */
  delay?: number;
  duration?: number;
  /** Shake and heat from white to red while counting, like a damage meter. */
  hot?: boolean;
};

const DAMAGE_STOPS: [number, [number, number, number]][] = [
  [0, [255, 255, 255]],
  [45, [255, 214, 10]],
  [75, [255, 138, 31]],
  [100, [255, 59, 59]],
];

const damageColor = (value: number): string => {
  for (let i = 1; i < DAMAGE_STOPS.length; i++) {
    const [to, toColor] = DAMAGE_STOPS[i];
    if (value > to) continue;
    const [from, fromColor] = DAMAGE_STOPS[i - 1];
    const t = (value - from) / (to - from);
    const channel = (k: number) =>
      Math.round(fromColor[k] + (toColor[k] - fromColor[k]) * t);
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }
  return "rgb(255, 59, 59)";
};

const format = (value: number) => value.toLocaleString("en-US");

// A number that counts up from zero when it mounts. Written straight to the
// element every frame; nothing here re-renders React.
export const CountUp = ({
  value,
  delay = 150,
  duration = 1100,
  hot = false,
}: Props) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = (shown: number, moving: boolean) => {
      element.textContent = format(shown);
      if (!hot) return;
      element.style.color = damageColor(shown);
      element.style.transform = moving
        ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
        : "";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(value, false);
      return;
    }

    paint(0, false);
    const start = performance.now() + delay;
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      paint(Math.round(value * (1 - (1 - progress) ** 3)), progress < 1);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, delay, duration, hot]);

  return (
    <span ref={ref} style={hot ? { display: "inline-block" } : undefined}>
      {format(value)}
    </span>
  );
};
