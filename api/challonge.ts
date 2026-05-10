import "./_instrument";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { respondClientError } from "./_lib/errors";
import { assertSameOrigin } from "./_lib/origin";
import { parseSlug } from "./_lib/validate";
import { withLogging } from "./_lib/withLogging";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";

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

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.warn(
      JSON.stringify({
        fn: "challonge",
        upstream: "challonge",
        status: response.status,
        slug,
      }),
    );
    return res.status(response.status).json({
      error: `Challonge API error: ${response.status}`,
      details: text,
    });
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
