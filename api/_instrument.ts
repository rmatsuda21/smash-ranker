// Side-effect-only module that initializes Sentry for `api/*` functions.
//
// MUST be imported as the FIRST line of every function entry (before any
// other imports). `@sentry/node`'s OpenTelemetry-based auto-instrumentation
// patches modules at import time — initializing after `@vercel/node`,
// `node:fetch`, or third-party SDKs means those instruments never attach.
//
// Fluid Compute reuses instances across concurrent requests; init runs once
// at module-load time and is idempotent via `isInitialized()`.

import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN && !Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    // Intentionally omitting `integrations` — passing [] would disable
    // httpIntegration, nativeNodeFetchIntegration, consoleIntegration,
    // onUncaughtExceptionIntegration, onUnhandledRejectionIntegration.
  });
}
