import { createContext } from "react";

export type ToastVariant = "error" | "info" | "success";

export type ShowToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastContextValue = {
  showToast: (message: string, opts?: ShowToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
