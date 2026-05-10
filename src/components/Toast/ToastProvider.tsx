import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import cn from "classnames";

import {
  ToastContext,
  type ShowToastOptions,
  type ToastVariant,
} from "./ToastContext";

import styles from "./Toast.module.scss";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_DURATION_MS = 5000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, opts?: ShowToastOptions) => {
      const id = ++idRef.current;
      const variant = opts?.variant ?? "info";
      const durationMs = opts?.durationMs ?? DEFAULT_DURATION_MS;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div
          className={styles.viewport}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              className={cn(styles.toast, styles[toast.variant])}
            >
              <span className={styles.indicator} aria-hidden="true" />
              <div className={styles.message}>{toast.message}</div>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
