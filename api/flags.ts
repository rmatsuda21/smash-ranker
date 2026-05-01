import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  // Cache at the edge briefly so we don't hammer the flags service on every
  // page load, but stay responsive to dashboard toggles.
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );

  if (!process.env.FLAGS) {
    // No SDK key configured (local dev without `vercel env pull`, or the
    // project hasn't created any flags yet). Fall back to defaults so the
    // client doesn't error.
    return res.json(DEFAULTS);
  }

  try {
    const { flagsClient } = await import("@vercel/flags-core");
    const out: FlagValues = { ...DEFAULTS };
    await Promise.all(
      FLAG_KEYS.map(async (key) => {
        const result = await flagsClient.evaluate<boolean>(key, DEFAULTS[key]);
        out[key] = Boolean(result.value);
      }),
    );
    return res.json(out);
  } catch (e) {
    console.error("[flags] evaluation failed", e);
    return res.json(DEFAULTS);
  }
}
