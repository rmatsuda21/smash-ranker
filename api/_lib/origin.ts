import type { VercelRequest } from "@vercel/node";

import { ForbiddenError } from "./errors.js";

// ---------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH for origins allowed to call same-origin-guarded API
// routes. Edit these three lists to add or remove allowed callers.
// ---------------------------------------------------------------------------

/** Exact-match origins (scheme + host, no trailing slash). */
const ALLOWED_ORIGINS: readonly string[] = [
  "https://smash-ranker.app",
  "https://www.smash-ranker.app",
  "https://smash-ranker.vercel.app",
  "https://www.smash-ranker.vercel.app",
];

/** Exact-match hostnames (any scheme/port). For local dev. */
const ALLOWED_HOSTNAMES: readonly string[] = ["localhost", "127.0.0.1"];

/**
 * Hostname suffixes accepted regardless of subdomain. Use sparingly — every
 * entry here is effectively a wildcard. `.vercel.app` covers every preview
 * deployment for any project on the team.
 */
const ALLOWED_HOSTNAME_SUFFIXES: readonly string[] = [".vercel.app"];

const ALLOWED_ORIGIN_SET = new Set(ALLOWED_ORIGINS);
const ALLOWED_HOSTNAME_SET = new Set(ALLOWED_HOSTNAMES);

const headerString = (
  raw: string | string[] | undefined,
): string | undefined => {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
};

const isAllowedOrigin = (origin: string): boolean => {
  if (ALLOWED_ORIGIN_SET.has(origin)) return true;

  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }

  if (ALLOWED_HOSTNAME_SET.has(host)) return true;
  if (ALLOWED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  return false;
};

/**
 * Soft same-origin filter for routes only meant to be called by our own
 * frontend. Allows missing Origin (server-to-server, search bots) but rejects
 * any non-empty Origin that doesn't match the lists above. Cheap first-line
 * filter; pair with WAF rate limit and (optionally) BotID for real defense.
 *
 * Do NOT apply to endpoints meant to be hot-linked into Discord/Twitter cards
 * (`prediction-image`, `og-image`, `tonamel-image`).
 */
export const assertSameOrigin = (req: VercelRequest): void => {
  const origin = headerString(req.headers.origin);
  if (!origin) return;
  if (isAllowedOrigin(origin)) return;
  throw new ForbiddenError("Origin not allowed");
};
