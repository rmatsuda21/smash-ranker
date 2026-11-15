import { createServer, type ViteDevServer } from "vite";
import { chromium, type Browser } from "playwright";
import path from "path";

const TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;
const PORT = 5199;

export type CapturedPreview = { id: string; buffer: Buffer };

/**
 * Renders every built-in template in headless Chromium through
 * `preview-generator.html` and returns the captured images.
 *
 * - `"preview"` — lossy WebP thumbnails for the template picker.
 * - `"golden"` — lossless half-resolution PNGs for regression diffing.
 */
export async function capturePreviews(
  mode: "preview" | "golden",
): Promise<CapturedPreview[]> {
  let server: ViteDevServer | undefined;
  let browser: Browser | undefined;

  try {
    console.log("Starting Vite dev server...");
    server = await createServer({
      configFile: path.resolve(import.meta.dir, "../../vite.config.ts"),
      server: { port: PORT, strictPort: true },
    });
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : PORT;
    const baseUrl = `http://localhost:${port}`;

    console.log("Launching browser...");
    browser = await chromium.launch({ headless: true });
    // Pin the things that change rasterization so goldens are comparable
    // between machines.
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "UTC",
    });

    console.log("Rendering templates...");
    await page.goto(`${baseUrl}/preview-generator.html?mode=${mode}`, {
      waitUntil: "domcontentloaded",
    });

    const startTime = Date.now();
    let ready = false;
    while (Date.now() - startTime < TIMEOUT_MS) {
      // @ts-expect-error - window.__previewsReady is not typed
      ready = await page.evaluate(() => window.__previewsReady === true);
      if (ready) break;

      // @ts-expect-error - window.__previewError is not typed
      const error = await page.evaluate(() => window.__previewError);
      if (error) throw new Error(`Preview generation failed: ${error}`);

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    if (!ready) {
      throw new Error(`Timed out after ${TIMEOUT_MS}ms waiting for previews`);
    }

    const previews: { id: string; dataUrl: string }[] | undefined =
      // @ts-expect-error - window.__previews is not typed
      await page.evaluate(() => window.__previews);
    if (!previews || previews.length === 0) {
      throw new Error("No previews were generated");
    }

    return previews.map(({ id, dataUrl }) => ({
      id,
      buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
    }));
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
}
