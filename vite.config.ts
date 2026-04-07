import path from "path";
import { defineConfig, type Plugin } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";

function challongeDevProxy(): Plugin {
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

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";

  return {
    plugins: [
      react({
        plugins: [["@lingui/swc-plugin", {}]],
      }),
      lingui(),
      challongeDevProxy(),
      shouldAnalyze && analyzer(),
    ].filter(Boolean),
    optimizeDeps: {
      force: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
