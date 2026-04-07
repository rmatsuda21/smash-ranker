import type { VercelRequest, VercelResponse } from "@vercel/node";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CHALLONGE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Challonge API key not configured" });
  }

  const slug = req.query.slug as string;
  if (!slug) {
    return res.status(400).json({ error: "Missing required query param: slug" });
  }

  const url = `${CHALLONGE_API_BASE}/tournaments/${slug}.json?api_key=${encodeURIComponent(apiKey)}&include_participants=1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Challonge API error: ${response.status}`,
        details: text,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Challonge proxy error:", error);
    return res.status(500).json({ error: "Failed to fetch from Challonge" });
  }
}
