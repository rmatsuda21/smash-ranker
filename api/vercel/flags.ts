import "../_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAccess, version } from "flags";

import { withLogging } from "../_lib/withLogging.js";

// Flag Discovery Endpoint for the Vercel Toolbar's Flags Explorer.
//
// Wired to the public path /.well-known/vercel/flags via a rewrite in
// vercel.json (Vercel Functions can't be served from a `.`-prefixed path
// directly with file-based routing).
//
// Requires the FLAGS_SECRET env var (set up via Toolbar → Flags Explorer →
// Start setup → Create secret, or manually with
// `node -e "console.log(crypto.randomBytes(32).toString('base64url'))"`).

// Flag metadata. Since these flags are managed in the Vercel Flags dashboard
// (not declared in code via the `flag()` SDK wrapper), we construct the
// definitions manually rather than using `getProviderData(flags)`.
//
// Every key in `FLAG_KEYS` (api/flags.ts) needs an entry here: the dashboard
// reads this list on each production deployment and marks a flag it does not
// find as "Unreferenced".
//
// It only counts a definition whose `origin` says it is a Vercel Flags flag of
// this project (what `getProviderData` from `@flags-sdk/vercel` writes for
// flags declared with the SDK). A bare description and options is shown in the
// toolbar but leaves the flag "Unreferenced".
const ON_OFF = [
  { value: false, label: "Off" },
  { value: true, label: "On" },
];

const DESCRIPTIONS = {
  "thumbnail-enabled": {
    description: "Enables the video thumbnail maker at /thumbnail",
  },
  "results-enabled": {
    description: "Enables the per-player tournament recap at /results",
  },
  "recap-enabled": {
    description: "Enables the yearly recap story at /recap",
  },
};

// VERCEL_PROJECT_ID is one of the system environment variables Vercel sets on
// every deployment.
const getDefinitions = () => {
  const projectId = process.env.VERCEL_PROJECT_ID;
  return Object.fromEntries(
    Object.entries(DESCRIPTIONS).map(([key, { description }]) => [
      key,
      {
        description,
        options: ON_OFF,
        defaultValue: false,
        declaredInCode: true,
        ...(projectId ? { origin: { provider: "vercel", projectId } } : {}),
      },
    ]),
  );
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const access = await verifyAccess(
    (req.headers["authorization"] as string | undefined) ?? null,
  );
  if (!access) {
    return res.status(401).json(null);
  }

  res.setHeader("x-flags-sdk-version", version);
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    definitions: getDefinitions(),
    overrideEncryptionMode: "encrypted" as const,
  });
};

export default withLogging("vercel-flags", handler);
