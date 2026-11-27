import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { respondClientError } from "./_lib/errors.js";
import { parseImageUrl } from "./_lib/validate.js";
import {
  fetchExternalImage,
  isTimeoutError,
  readImageBody,
} from "./_lib/fetchImage.js";
import { captureFnException, withLogging } from "./_lib/withLogging.js";

const ALLOWED_HOSTS = [
  "assets.tonamel.com",
  "img.tonamel.com",
  "p1-c2db36b0.imageflux.jp",
] as const;

const SAFE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// Under the function's 10s limit.
const UPSTREAM_TIMEOUT_MS = 8000;

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

  let response: Response;
  try {
    // Every redirect has to stay on the allowed hosts.
    response = await fetchExternalImage(
      parsed.toString(),
      AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      ALLOWED_HOSTS,
    );
  } catch (err) {
    if (respondClientError(res, err)) return;
    const timedOut = isTimeoutError(err);
    captureFnException(err, { fn: "tonamel-image" });
    return res
      .status(timedOut ? 504 : 502)
      .json({ error: "Upstream did not respond" });
  }

  if (!response.ok) {
    console.warn(
      JSON.stringify({
        fn: "tonamel-image",
        upstream: parsed.hostname,
        status: response.status,
      }),
    );
    return res
      .status(response.status === 404 ? 404 : 502)
      .json({ error: `Upstream error: ${response.status}` });
  }

  // This answer is served from the site's own origin, so only pictures that
  // cannot carry script go through: an SVG or HTML file opened at this
  // address would run there.
  const contentType = (response.headers.get("content-type") || "image/jpeg")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!SAFE_IMAGE_TYPES.has(contentType)) {
    await response.body?.cancel().catch(() => {});
    return res.status(502).json({ error: "Not an image" });
  }
  const buffer = await readImageBody(response);
  if (!buffer) {
    return res.status(502).json({ error: "Image too large" });
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
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
