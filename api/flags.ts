import type { VercelRequest, VercelResponse } from "@vercel/node";
import { vercelAdapter } from "@flags-sdk/vercel";

// Catalogue of flags exposed to the client. Add new keys here.
const FLAG_KEYS = ["thumbnail-enabled"] as const;
type FlagKey = (typeof FLAG_KEYS)[number];
type FlagValues = Record<FlagKey, boolean>;

const DEFAULTS: FlagValues = {
  "thumbnail-enabled": false,
};

// The default Vercel adapter automatically reads the `FLAGS` env var that the
// dashboard auto-provisions, lazily initializes the underlying client, and
// reuses it across the warm container. No explicit `initialize()` needed.
const adapter = vercelAdapter<boolean, undefined>();

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  // Cache briefly at the edge so every page nav doesn't hammer the function,
  // but stay responsive to dashboard toggles.
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );

  if (!process.env.FLAGS) {
    console.warn("[flags] FLAGS env var missing; returning defaults");
    return res.json(DEFAULTS);
  }

  const out: FlagValues = { ...DEFAULTS };
  await Promise.all(
    FLAG_KEYS.map(async (key) => {
      try {
        const value = await adapter.decide({ key, entities: undefined });
        out[key] = Boolean(value);
        console.log(`[flags] ${key} = ${value}`);
      } catch (e) {
        console.error(
          `[flags] ${key} evaluation failed; using default ${DEFAULTS[key]}`,
          e,
        );
        // Keep DEFAULTS[key]
      }
    }),
  );

  return res.json(out);
}
