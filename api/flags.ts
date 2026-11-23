import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Reason, createClient } from "@vercel/flags-core";

import { respondClientError } from "./_lib/errors.js";
import { assertSameOrigin } from "./_lib/origin.js";
import { withLogging } from "./_lib/withLogging.js";

// Catalogue of flags exposed to the client. Add new keys here.
const FLAG_KEYS = [
  "thumbnail-enabled",
  "results-enabled",
  "recap-enabled",
] as const;
type FlagKey = (typeof FLAG_KEYS)[number];
type FlagValues = Record<FlagKey, boolean>;

const DEFAULTS: FlagValues = {
  "thumbnail-enabled": false,
  "results-enabled": false,
  "recap-enabled": false,
};

type DebugEntry = {
  value: boolean;
  reason: string;
  errorMessage?: string;
};

const EVALUATE_TIMEOUT_MS = 2500;

// Hoisted to module scope so a warm instance reuses the definitions it has
// already loaded.
//
// Do not pass `polling: false` together with `stream: false`: that is the
// client's offline mode, which loads the definitions once (from the copy
// embedded at build time when there is one) and never looks again, so a flag
// changed in the dashboard keeps its old value until the next deployment.
// With polling left on, the client on Vercel compares the config version
// Vercel sends with each request against what it holds and fetches when they
// differ; elsewhere it polls. Streaming stays off: a function has no use for
// an open connection, and it once made this route time out.
//
// Each `evaluate()` is also what the Vercel dashboard counts as the flag being
// used: the client reports evaluations in the background (through `waitUntil`)
// from @vercel/flags-core 1.6.0 on. Keep the package at or above that.
const client = process.env.FLAGS
  ? createClient(process.env.FLAGS, { stream: false })
  : null;

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`evaluate timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);

const handler = async (req: VercelRequest, res: VercelResponse) => {
  try {
    assertSameOrigin(req);
  } catch (err) {
    if (respondClientError(res, err)) return;
    throw err;
  }

  // Cache briefly at the edge so every page nav doesn't hammer the function,
  // but stay responsive to dashboard toggles.
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );

  const debug = req.query.debug === "1";

  if (!client) {
    console.warn("[flags] FLAGS env var missing; returning defaults");
    return res.json(
      debug
        ? {
            values: DEFAULTS,
            error: "FLAGS env var missing",
          }
        : DEFAULTS,
    );
  }

  const out: FlagValues = { ...DEFAULTS };
  const debugInfo: Record<FlagKey, DebugEntry> = {} as Record<
    FlagKey,
    DebugEntry
  >;

  await Promise.all(
    FLAG_KEYS.map(async (key) => {
      try {
        // Pass our own default so `evaluate()` returns it instead of leaving
        // value undefined when the flag can't be resolved (cold start, missing
        // from embedded snapshot, etc.). The returned object always carries
        // `reason` and optionally `errorMessage` for diagnostics.
        const result = await withTimeout(
          client.evaluate<boolean>(key, DEFAULTS[key]),
          EVALUATE_TIMEOUT_MS,
        );
        out[key] = Boolean(result.value);
        debugInfo[key] = {
          value: out[key],
          reason: String(result.reason ?? "UNKNOWN"),
          errorMessage: result.errorMessage,
        };
        const reason = result.reason ?? "UNKNOWN";
        const isError = reason === Reason.ERROR;
        const log = `[flags] ${key} = ${out[key]} (reason: ${reason}${
          result.errorMessage ? `, error: ${result.errorMessage}` : ""
        })`;
        if (isError) {
          console.error(log);
        } else {
          console.log(log);
        }
      } catch (e) {
        console.error(`[flags] ${key} evaluation threw; using default`, e);
        debugInfo[key] = {
          value: DEFAULTS[key],
          reason: "EXCEPTION",
          errorMessage: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  if (debug) {
    return res.json({ values: out, debug: debugInfo });
  }
  return res.json(out);
};

export default withLogging("flags", handler);
