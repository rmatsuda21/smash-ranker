import type { Plugin } from "vite";

const ALLOWED_HOSTS = [
  "assets.tonamel.com",
  "img.tonamel.com",
  "p1-c2db36b0.imageflux.jp",
];

export function tonamelImageProxy(): Plugin {
  return {
    name: "tonamel-image-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tonamel-image", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const imageUrl = url.searchParams.get("url");

        if (!imageUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing url param" }));
          return;
        }

        let parsed: URL;
        try {
          parsed = new URL(imageUrl);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid URL" }));
          return;
        }

        if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: "Host not allowed" }));
          return;
        }

        try {
          const response = await fetch(imageUrl);
          const contentType = response.headers.get("content-type") || "image/jpeg";
          const buffer = Buffer.from(await response.arrayBuffer());

          res.statusCode = response.status;
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(buffer);
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch image" }));
        }
      });
    },
  };
}
