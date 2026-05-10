import posthog from "posthog-js";

let initialized = false;

export const initAnalytics = () => {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    persistence: "localStorage",
    loaded: (instance) => {
      if (import.meta.env.DEV) instance.opt_out_capturing();
    },
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
