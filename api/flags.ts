import type { VercelRequest, VercelResponse } from "@vercel/node";
import { flagsClient } from "@vercel/flags-core";

// Vercel Flags evaluator. Uses @vercel/flags-core which reads the FLAGS env
// var (auto-provisioned when you create a flag in the Vercel dashboard).
//
// Defines the catalogue of flags exposed to the client. Add new keys here.
const FLAG_KEYS = ["thumbnail-enabled"] as const;
type FlagKey = (typeof FLAG_KEYS)[number];
type FlagValues = Record<FlagKey, boolean>;

const DEFAULTS: FlagValues = {
  "thumbnail-enabled": false,
};

// The flags client needs to load its datafile (via stream/poll) before
// evaluations return real values. Initialize once per warm container — it's
// cached and reused for subsequent requests.
let initPromise: Promise<unknown> | null = null;
const ensureInitialized = () => {
  if (!initPromise) {
    initPromise = flagsClient.initialize().catch((e) => {
      console.error("[flags] initialize failed", e);
      // Reset so the next request gets to retry.
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
};

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );

  if (!process.env.FLAGS) {
    console.warn("[flags] FLAGS env var is missing; returning defaults");
    return res.json(DEFAULTS);
  }

  try {
    await ensureInitialized();
    const out: FlagValues = { ...DEFAULTS };
    await Promise.all(
      FLAG_KEYS.map(async (key) => {
        const result = await flagsClient.evaluate<boolean>(key, DEFAULTS[key]);
        out[key] = Boolean(result.value);
        console.log(
          `[flags] ${key} = ${result.value} (reason: ${result.reason}${
            result.errorMessage ? `, error: ${result.errorMessage}` : ""
          })`,
        );
      }),
    );
    return res.json(out);
  } catch (e) {
    console.error("[flags] evaluation failed", e);
    return res.json(DEFAULTS);
  }
}
