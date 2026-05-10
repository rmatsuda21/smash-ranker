import * as Sentry from "@sentry/react";

let initialized = false;

export const initSentry = () => {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [],
  });
  initialized = true;
};

export const captureException = (
  error: unknown,
  context?: Record<string, unknown>,
) => {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
};

export const captureMessage = (
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
) => {
  if (!initialized) return;
  Sentry.captureMessage(
    message,
    context ? { level, extra: context } : { level },
  );
};

export { Sentry };
