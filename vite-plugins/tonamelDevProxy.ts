import type { Plugin } from "vite";

// Runs api/tonamel.ts under `bun dev`, so the real handler (validation,
// error mapping, timeouts) is what local loads go through.
export function tonamelDevProxy(): Plugin {
  return {
    name: "tonamel-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tonamel", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");

        try {
          const handler = (await import("../api/tonamel")).default;
          const mockReq = {
            method: req.method,
            query: Object.fromEntries(url.searchParams),
            headers: req.headers,
            url: req.url,
          } as any;
          let statusCode = 200;
          const headers: Record<string, string> = {};
          let responseData: string | null = null;
          const mockRes: any = {
            get statusCode() {
              return statusCode;
            },
            headersSent: false,
            status(code: number) {
              statusCode = code;
              return mockRes;
            },
            setHeader(key: string, value: string) {
              headers[key] = value;
            },
            removeHeader(key: string) {
              delete headers[key];
            },
            json(data: unknown) {
              headers["Content-Type"] = "application/json";
              responseData = JSON.stringify(data);
              return mockRes;
            },
            end() {
              return mockRes;
            },
          };

          await handler(mockReq, mockRes);

          res.statusCode = statusCode;
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
          res.end(responseData ?? undefined);
        } catch (err) {
          console.error("tonamel dev proxy error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "tonamel request failed" }));
        }
      });
    },
  };
}
