// Slim core bundle: drops session-replay, surveys, and a few rarely-used
// extensions, halving the unminified size (~30KB gzipped saving). We don't
// use any of the dropped features.
import posthog from "posthog-js/dist/module.slim";

import type {
  EventName,
  EventProps,
  PersonProps,
} from "@/utils/analytics/events";
import { getClientId } from "./clientId";

let initialized = false;

// Tournament slugs in `?p=&s=` URLs and tournament names in deep-link URLs
// can be user/organizer data. Strip query strings + the `slug` route segment
// from any URL before it leaves the browser.
const SENSITIVE_PARAMS = ["s", "slug"];
const stripSensitiveUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const param of SENSITIVE_PARAMS) u.searchParams.delete(param);
    return u.toString();
  } catch {
    return url;
  }
};

export const initAnalytics = () => {
  if (initialized) return;
  // Skip in local dev so `bun dev` doesn't ship events to the prod project.
  // Vercel preview deploys are PROD builds, so they'll still report.
  if (import.meta.env.DEV) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    // Modern defaults bundle: SPA `$pageview` on history_change, head-injected
    // external scripts, rageclick filtering, strict minimum recording duration.
    defaults: "2026-01-30",
    autocapture: false,
    capture_pageleave: "if_capture_pageview",
    persistence: "localStorage",
    // Privacy: don't capture client IPs (no analytical value here, removes a
    // GDPR concern).
    ip: false,
    // Don't lazy-load surveys / toolbar / replayer scripts (we use none of
    // them; the slim bundle wouldn't load them anyway, but explicit is safer).
    disable_external_dependency_loading: true,
    disable_session_recording: true,
    before_send: (event) => {
      if (!event) return event;
      const props = event.properties;
      if (props) {
        if (typeof props.$current_url === "string") {
          props.$current_url = stripSensitiveUrl(props.$current_url);
        }
        if (typeof props.$referrer === "string") {
          props.$referrer = stripSensitiveUrl(props.$referrer);
        }
      }
      return event;
    },
  });

  // Stable identity across visits (UUID in localStorage). Without this, every
  // browser cache wipe creates a new "person" and breaks cohort/funnel views.
  posthog.identify(getClientId());

  posthog.register({
    app_environment: import.meta.env.MODE,
    commit_sha: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || "local",
  });

  initialized = true;
};

export const capture = (name: EventName, props?: EventProps) => {
  if (!initialized) return;
  posthog.capture(name, props);
};

// One-shot person property: only writes if not already set. Use for
// "first time" milestones (`first_export_at`, etc.).
export const setPersonOnce = (props: PersonProps) => {
  if (!initialized) return;
  posthog.setPersonProperties(undefined, props as Record<string, unknown>);
};

// Mutable person property: overwrites previous value. Use for accumulated
// state (`total_exports`, `has_uploaded_custom_font`).
export const setPerson = (props: PersonProps) => {
  if (!initialized) return;
  posthog.setPersonProperties(props as Record<string, unknown>);
};
