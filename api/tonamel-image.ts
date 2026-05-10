import "./_instrument";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { respondClientError } from "./_lib/errors";
import { parseImageUrl } from "./_lib/validate";
import { withLogging } from "./_lib/withLogging";

const ALLOWED_HOSTS = [
  "assets.tonamel.com",
  "img.tonamel.com",
  "p1-c2db36b0.imageflux.jp",
] as const;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let parsed: URL;
  try {
    parsed = parseImageUrl(req.query.url, ALLOWED_HOSTS);
  } catch (err) {
    if (respondClientError(res, err)) return;
    throw err;
  }

  const response = await fetch(parsed.toString());

  if (!response.ok) {
    console.warn(
      JSON.stringify({
        fn: "tonamel-image",
        upstream: parsed.hostname,
        status: response.status,
      }),
    );
    return res
      .status(response.status)
      .json({ error: `Upstream error: ${response.status}` });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader("Content-Type", contentType);
  // The URL is content-addressed (the upstream image at this exact URL
  // doesn't change), so the CDN can hold it for a year. Browsers see a
  // shorter TTL via the public Cache-Control header.
  res.setHeader(
    "Vercel-CDN-Cache-Control",
    "public, max-age=31536000, immutable",
  );
  res.setHeader("CDN-Cache-Control", "public, max-age=86400");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(buffer);
};

export default withLogging("tonamel-image", handler);
