import * as Sentry from "@sentry/react";

import { isChunkLoadError } from "@/utils/staleChunk";
import { getClientId } from "./clientId";
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
  // The same anonymous id PostHog knows this browser by: Sentry can count
  // the people an issue affects, and an event leads to that person's
  // PostHog history.
  Sentry.setUser({ id: getClientId() });
  initialized = true;
};

// Context keys sent as tags, which Sentry can search, filter and alert on
// ("area:export", "failure_kind:rate_limited"). Everything else stays extra
// data, readable on the event only. Keep to keys with few distinct values,
// plus `request_id`, which ties a failed API call to the function's log line.
const TAG_KEYS = new Set([
  "area",
  "surface",
  "export_surface",
  "stage",
  "failure_kind",
  "platform",
  "tournament_platform",
  "boundary",
  "status",
  "request_id",
]);

const splitContext = (context: Record<string, unknown>) => {
  const tags: Record<string, string> = {};
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    const isTag =
      TAG_KEYS.has(key) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean");
    if (isTag) tags[key] = String(value).slice(0, 200);
    else extra[key] = value;
  }
  return { tags, extra };
};

// Returns Sentry's id for the event (undefined when Sentry is off), which
// the error screen shows so a user's report can be matched to it.
export const captureException = (
  error: unknown,
  context?: Record<string, unknown>,
): string | undefined => {
  if (!initialized) return undefined;
  return Sentry.captureException(
    error,
    context ? splitContext(context) : undefined,
  );
};

export const captureMessage = (
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
) => {
  if (!initialized) return;
  Sentry.captureMessage(
    message,
    context ? { level, ...splitContext(context) } : { level },
  );
};

// Used by createRoot()'s onUncaughtError / onCaughtError / onRecoverableError
// hooks (React 19). Captures errors that escape <ErrorBoundary>.
export const reactErrorHandler = Sentry.reactErrorHandler();

export { Sentry };
