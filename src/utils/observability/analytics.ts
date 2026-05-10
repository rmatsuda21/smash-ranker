// Slim core bundle: drops session-replay, surveys, and a few rarely-used
// extensions, halving the unminified size (~30KB gzipped saving). We don't
// use any of the dropped features.
import posthog from "posthog-js/dist/module.slim";

let initialized = false;

export const initAnalytics = () => {
  if (initialized) return;
  // Skip in local dev so `bun dev` doesn't ship events to the prod project.
  // Vercel preview deploys are PROD builds, so they'll still report.
  if (import.meta.env.DEV) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    // Opts into PostHog's modern defaults bundle: SPA-aware pageview capture
    // (`history_change`), head-injected external scripts, rageclick filtering,
    // strict minimum recording duration. Without this we'd be frozen on
    // legacy defaults that don't fire `$pageview` on wouter route changes.
    defaults: "2026-01-30",
    autocapture: false,
    capture_pageleave: "if_capture_pageview",
    persistence: "localStorage",
  });

  posthog.register({
    app_environment: import.meta.env.MODE,
    commit_sha: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || "local",
  });

  initialized = true;
};

export const capture = (
  name: string,
  props?: Record<string, string | number | boolean | null>,
) => {
  if (!initialized) return;
  posthog.capture(name, props);
};
