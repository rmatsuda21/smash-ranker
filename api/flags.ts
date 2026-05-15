import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Reason, createClient } from "@vercel/flags-core";

import { respondClientError } from "./_lib/errors.js";
import { assertSameOrigin } from "./_lib/origin.js";
import { withLogging } from "./_lib/withLogging.js";

// Catalogue of flags exposed to the client. Add new keys here.
const FLAG_KEYS = ["thumbnail-enabled", "results-enabled"] as const;
type FlagKey = (typeof FLAG_KEYS)[number];
type FlagValues = Record<FlagKey, boolean>;

const DEFAULTS: FlagValues = {
  "thumbnail-enabled": false,
  "results-enabled": false,
};

type DebugEntry = {
  value: boolean;
  reason: string;
  errorMessage?: string;
};

const EVALUATE_TIMEOUT_MS = 2500;

// Hoisted to module scope so Fluid Compute reuses the in-memory datafile
// across requests on a warm instance — only the first call pays the fetch
// cost. `stream: false, polling: false` switches the controller to one-shot
// fetch mode, which is the right shape for a stateless serverless function.
const client = process.env.FLAGS
  ? createClient(process.env.FLAGS, { stream: false, polling: false })
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
