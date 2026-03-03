import { createServer, type ViteDevServer } from "vite";
import { chromium, type Browser } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(import.meta.dir, "../src/assets/previews");
const TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

async function main() {
  let server: ViteDevServer | undefined;
  let browser: Browser | undefined;

  try {
    // 1. Start Vite dev server
    console.log("Starting Vite dev server...");
    server = await createServer({
      configFile: path.resolve(import.meta.dir, "../vite.config.ts"),
      server: { port: 5199, strictPort: true },
    });
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : 5199;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Vite dev server running at ${baseUrl}`);

    // 2. Launch Playwright browser
    console.log("Launching browser...");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 3. Navigate to preview generator page
    console.log("Navigating to preview generator...");
    await page.goto(`${baseUrl}/preview-generator.html`, {
      waitUntil: "networkidle",
    });

    // 4. Wait for previews to be ready
    console.log("Waiting for previews to render...");
    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT_MS) {
      // @ts-expect-error - window.__previewsReady is not typed
      const ready = await page.evaluate(() => window.__previewsReady === true);
      if (ready) break;

      // @ts-expect-error - window.__previewError is not typed
      const error = await page.evaluate(() => window.__previewError);
      if (error) throw new Error(`Preview generation failed: ${error}`);

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    // @ts-expect-error - window.__previewsReady is not typed
    const isReady = await page.evaluate(() => window.__previewsReady === true);
    if (!isReady) {
      throw new Error(`Timed out after ${TIMEOUT_MS}ms waiting for previews`);
    }

    // 5. Read preview data
    // @ts-expect-error - window.__previews is not typed
    const previews = await page.evaluate(() => window.__previews);
    if (!previews || previews.length === 0) {
      throw new Error("No previews were generated");
    }

    // 6. Save files
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const { id, dataUrl } of previews) {
      const base64 = dataUrl.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      const filePath = path.join(OUTPUT_DIR, `${id}.webp`);
      writeFileSync(filePath, buffer);
      console.log(
        `Saved ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`,
      );
    }

    // 7. Generate barrel file
    const ids = previews.map((p) => p.id);
    const imports = ids
      .map((id) => {
        const varName = id.replace(/-/g, "_");
        return `import ${varName} from "./${id}.webp";`;
      })
      .join("\n");
    const entries = ids
      .map((id) => {
        const varName = id.replace(/-/g, "_");
        return `  "${id}": ${varName},`;
      })
      .join("\n");
    const barrel = `${imports}\n\nexport const defaultPreviews: Record<string, string> = {\n${entries}\n};\n`;
    const barrelPath = path.join(OUTPUT_DIR, "index.ts");
    writeFileSync(barrelPath, barrel);
    console.log(`Generated ${barrelPath}`);

    console.log(`\nDone! Generated ${previews.length} preview images.`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
}

main();
