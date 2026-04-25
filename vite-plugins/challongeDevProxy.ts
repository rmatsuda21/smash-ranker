import type { Plugin } from "vite";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";

export function challongeDevProxy(): Plugin {
  return {
    name: "challonge-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/challonge", async (req, res) => {
        const apiKey = process.env.CHALLONGE_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "CHALLONGE_API_KEY not set" }));
          return;
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const slug = url.searchParams.get("slug");

        if (!slug) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing slug param" }));
          return;
        }

        const apiUrl = `${CHALLONGE_API_BASE}/tournaments/${slug}.json?api_key=${encodeURIComponent(apiKey)}&include_participants=1`;

        try {
          const response = await fetch(apiUrl);
          const text = await response.text();
          res.statusCode = response.status;
          res.setHeader("Content-Type", "application/json");
          res.end(text);
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch from Challonge" }));
        }
      });
    },
  };
}
