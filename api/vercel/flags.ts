import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAccess, version } from "flags";

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
const DEFINITIONS = {
  "thumbnail-enabled": {
    description: "Enables the YouTube thumbnail editor at /thumbnail",
    options: [
      { value: false, label: "Off" },
      { value: true, label: "On" },
    ],
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const access = await verifyAccess(
    (req.headers["authorization"] as string | undefined) ?? null,
  );
  if (!access) {
    return res.status(401).json(null);
  }

  res.setHeader("x-flags-sdk-version", version);
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    definitions: DEFINITIONS,
    overrideEncryptionMode: "encrypted" as const,
  });
}
