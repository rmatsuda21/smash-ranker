import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { respondClientError } from "./_lib/errors.js";
import { assertSameOrigin } from "./_lib/origin.js";
import { parseSlug } from "./_lib/validate.js";
import { isTimeoutError } from "./_lib/fetchImage.js";
import { captureFnException, withLogging } from "./_lib/withLogging.js";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";
// Under the function's 10s limit, so a hung upstream is answered (and
// reported) by us instead of ending as a silent function timeout.
const UPSTREAM_TIMEOUT_MS = 8000;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let slug: string;
  try {
    assertSameOrigin(req);
    slug = parseSlug(req.query.slug);
  } catch (err) {
    if (respondClientError(res, err)) return;
    throw err;
  }

  const apiKey = process.env.CHALLONGE_API_KEY;
  if (!apiKey) {
    console.error(JSON.stringify({ fn: "challonge", missing: "api_key" }));
    return res.status(500).json({ error: "Challonge API key not configured" });
  }

  const url = `${CHALLONGE_API_BASE}/tournaments/${slug}.json?api_key=${encodeURIComponent(apiKey)}&include_participants=1`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    // The URL holds the API key, so report where it failed, not the error
    // text (which can quote the URL).
    const timedOut = isTimeoutError(err);
    captureFnException(
      new Error(
        timedOut ? "Challonge request timed out" : "Challonge request failed",
      ),
      { fn: "challonge" },
    );
    return res
      .status(timedOut ? 504 : 502)
      .json({ error: "Challonge did not respond" });
  }

  if (!response.ok) {
    console.warn(
      JSON.stringify({
        fn: "challonge",
        upstream: "challonge",
        status: response.status,
        slug,
      }),
    );
    // A slug that does not exist is the user's input; anything else (a bad
    // key is a 401) is ours to know about.
    if (response.status === 404) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    captureFnException(new Error(`Challonge API error: ${response.status}`), {
      fn: "challonge",
    });
    return res.status(502).json({ error: "Challonge API error" });
  }

  const data = await response.json();
  // CDN-cache successful responses; tournament data updates rarely and bursty
  // load (stream goes live) should fan out to a single upstream call.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400",
  );
  return res.status(200).json(data);
};

export default withLogging("challonge", handler);
