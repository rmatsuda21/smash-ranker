import { loadEnv, type Plugin } from "vite";

// Runs api/auth.ts under `bun dev`, so start.gg login works without
// `vercel dev`. Needs VITE_START_GG_CLIENT_ID and START_GG_OAUTH_SECRET.
export function authDevProxy(): Plugin {
  return {
    name: "auth-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/auth", async (req, res) => {
        // Read the OAuth settings from the env files on every request, so
        // editing .env.local takes effect without restarting the server
        // (the process environment is only filled in when it starts).
        const env = loadEnv(server.config.mode, server.config.envDir, "");
        for (const key of [
          "VITE_START_GG_CLIENT_ID",
          "START_GG_OAUTH_SECRET",
        ]) {
          if (env[key]) process.env[key] = env[key];
        }

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
          const handler = (await import("../api/auth")).default;
          const mockReq = {
            method: req.method,
            query: {},
            body,
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
          console.error("auth dev proxy error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Auth request failed" }));
        }
      });
    },
  };
}
