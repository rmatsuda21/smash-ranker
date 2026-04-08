import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_HOSTS = ["assets.tonamel.com", "img.tonamel.com", "p1-c2db36b0.imageflux.jp"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Missing required query param: url" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(403).json({ error: "Host not allowed" });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Tonamel image proxy error:", error);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
}
