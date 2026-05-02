import type { Plugin } from "vite";

export function predictionImageDevProxy(): Plugin {
  return {
    name: "prediction-image-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/prediction-image", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const d = url.searchParams.get("d") ?? "";

        try {
          const handler = (await import("../api/prediction-image")).default;

          // Minimal mock of VercelRequest/VercelResponse
          const mockReq = {
            method: "GET",
            query: { d },
            headers: req.headers,
          } as any;
          let statusCode = 200;
          const headers: Record<string, string> = {};
          let responseData: Buffer | string | null = null;

          const mockRes = {
            status(code: number) {
              statusCode = code;
              return mockRes;
            },
            setHeader(key: string, value: string) {
              headers[key] = value;
            },
            json(data: unknown) {
              headers["Content-Type"] = "application/json";
              responseData = JSON.stringify(data);
              return mockRes;
            },
            send(data: Buffer) {
              responseData = data;
              return mockRes;
            },
            end() {
              return mockRes;
            },
          } as any;

          await handler(mockReq, mockRes);

          res.statusCode = statusCode;
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
          if (responseData === null) res.end();
          else res.end(responseData);
        } catch (err) {
          console.error("prediction-image dev proxy error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Failed to generate image" }));
        }
      });
    },
  };
}
