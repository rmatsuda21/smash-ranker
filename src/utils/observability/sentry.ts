import * as Sentry from "@sentry/react";

import { isChunkLoadError } from "@/utils/staleChunk";
import { getAppEnvironment, scrubUrl } from "./scrubUrl";

let initialized = false;

// Noise that says nothing about the app: layout-observer chatter, link
// scanners, and a share sheet or request the user closed.
const IGNORED_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  /Object Not Found Matching Id/,
  /^AbortError: Share canceled/,
  /^AbortError: The user aborted a request/,
  /^AbortError: Abort due to cancellation of share/,
];

// Scripts injected by browser extensions.
const DENIED_URLS = [
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  /^safari-(web-)?extension:\/\//,
];

export const initSentry = () => {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: getAppEnvironment(),
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    attachStacktrace: true,
    ignoreErrors: IGNORED_ERRORS,
    denyUrls: DENIED_URLS,
    beforeSend: (event, hint) => {
      // A page chunk gone after a deploy is handled by reloading the page
      // (utils/staleChunk.ts); it is not a bug to triage.
      if (isChunkLoadError(hint.originalException)) return null;
      if (event.request?.url) event.request.url = scrubUrl(event.request.url);
      return event;
    },
    beforeBreadcrumb: (breadcrumb) => {
      const data = breadcrumb.data;
      if (data) {
        for (const key of ["url", "from", "to"]) {
          if (typeof data[key] === "string") data[key] = scrubUrl(data[key]);
        }
      }
      return breadcrumb;
    },
    // Intentionally omitting `integrations` — passing [] would disable
    // GlobalHandlers (window.onerror / unhandledrejection), Breadcrumbs,
    // LinkedErrors, BrowserApiErrors, etc. Keep Sentry's defaults.
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

// Used by createRoot()'s onUncaughtError / onCaughtError / onRecoverableError
// hooks (React 19). Captures errors that escape <ErrorBoundary>.
export const reactErrorHandler = Sentry.reactErrorHandler();

export { Sentry };
