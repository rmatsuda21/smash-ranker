import type { Plugin } from "vite";

export function resultsImageDevProxy(): Plugin {
  return {
    name: "results-image-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/results-image", async (req, res) => {
        if (req.method !== "GET" && req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const d = url.searchParams.get("d") ?? "";

        // Long payloads arrive as POST `{ d }` (see api/results-image.ts).
        let body: unknown = undefined;
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            body = undefined;
          }
        }

        try {
          const handler = (await import("../api/results-image")).default;

          const mockReq = {
            method: req.method,
            query: { d },
            body,
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
          console.error("results-image dev proxy error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Failed to generate image" }));
        }
      });
    },
  };
}
