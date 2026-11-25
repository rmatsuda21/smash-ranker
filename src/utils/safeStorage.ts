import type { StateStorage } from "zustand/middleware";

import { logWarning } from "@/utils/observability/log";

// localStorage for the persisted stores. Storage can be full (quota) or
// unavailable (private mode, blocked): either way a store keeps working in
// memory and the failure is reported once per page load, not on every write.

type FailureKind = "quota" | "unavailable";

const reported = new Set<FailureKind>();

const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014);

const report = (
  op: "getItem" | "setItem" | "removeItem",
  key: string,
  error: unknown,
  size?: number,
) => {
  const kind: FailureKind = isQuotaError(error) ? "quota" : "unavailable";
  if (reported.has(kind)) return;
  reported.add(kind);
  logWarning(`localStorage ${kind}`, {
    area: "storage",
    op,
    key,
    ...(size !== undefined && { sizeKb: Math.round(size / 1024) }),
    error: error instanceof Error ? error.message : String(error),
  });
};

export const safeLocalStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      report("getItem", key, error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      report("setItem", key, error, value.length);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      report("removeItem", key, error);
    }
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sameKind = (value: unknown, initial: unknown): boolean => {
  // Nothing to compare against: a field that starts out empty.
  if (initial === null || initial === undefined) return true;
  if (Array.isArray(initial)) return Array.isArray(value);
  if (typeof initial === "object") return isRecord(value);
  return typeof value === typeof initial;
};

type Guards<S> = { [K in keyof S]?: (value: unknown) => boolean };

interface MergeOptions<S> {
  // Checks for fields whose shape matters past "array" or "object", or that
  // hold more than one kind of value. A guard replaces the default check.
  guards?: Guards<S>;
  // Fields that describe work in progress and never survive a reload.
  transient?: (keyof S)[];
}

// A `merge` for zustand's persist: a saved field replaces its default only
// when it is the same kind of value (or passes its guard), so state saved
// by an older build, or damaged, cannot put a string where render code
// expects an array. Anything else keeps today's default.
export const mergePersisted =
  <S extends object>(options: MergeOptions<S> = {}) =>
  <T extends S>(persisted: unknown, current: T): T => {
    if (!isRecord(persisted)) return current;
    const defaults = current as Record<string, unknown>;
    const merged = { ...defaults };
    const guards = (options.guards ?? {}) as Record<
      string,
      ((value: unknown) => boolean) | undefined
    >;
    const transient = new Set((options.transient ?? []) as string[]);

    for (const [key, value] of Object.entries(persisted)) {
      if (transient.has(key)) continue;
      if (typeof defaults[key] === "function") continue;
      const guard = guards[key];
      if (guard ? !guard(value) : !sameKind(value, defaults[key])) continue;
      merged[key] = value;
    }
    return merged as T;
  };

export const isRecordArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every(isRecord);

export { isRecord };
