import { useEffect } from "react";

import { useToast } from "@/components/Toast/useToast";
import { logWarning } from "@/utils/observability/log";

type DateEgg = {
  id: string;
  monthDay: string;
  message: string;
};

const EGGS: DateEgg[] = [
  {
    id: "sakurai-birthday",
    monthDay: "08-03",
    message: "🎂 Happy birthday, Sakurai!",
  },
  {
    id: "smash-ultimate-anniversary",
    monthDay: "12-07",
    message: "🎮 Smash Ultimate launched on this day.",
  },
];

const STORAGE_KEY_PREFIX = "smash-ranker:date-egg:";
const firedThisSession = new Set<string>();

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatMonthDay = (d: Date) =>
  `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const readLastFiredYear = (id: string): string | null => {
  try {
    return window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
  } catch {
    return null;
  }
};

const writeLastFiredYear = (id: string, year: string) => {
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, year);
  } catch (err) {
    logWarning("date-egg: localStorage write failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const isDevOverrideActive = () => {
  if (!import.meta.env.DEV) return false;
  try {
    return new URLSearchParams(window.location.search).get("egg") === "date";
  } catch {
    return false;
  }
};

export const useDateBasedEgg = (onFire: () => void) => {
  const { showToast } = useToast();

  useEffect(() => {
    const now = new Date();
    const year = String(now.getFullYear());
    const today = formatMonthDay(now);

    const devOverride = isDevOverrideActive();
    const match = devOverride
      ? EGGS[0]
      : EGGS.find((e) => e.monthDay === today);
    if (!match) return;

    if (firedThisSession.has(match.id)) return;

    if (!devOverride && readLastFiredYear(match.id) === year) return;

    firedThisSession.add(match.id);
    showToast(match.message, { variant: "success", durationMs: 5000 });
    onFire();

    if (!devOverride) {
      writeLastFiredYear(match.id, year);
    }
  }, [onFire, showToast]);
};
