/**
 * Golden-image regression check for the Top 8 render pipeline.
 *
 *   bun run test:goldens          compare current rendering against goldens
 *   bun run test:goldens:update   accept current rendering as the new goldens
 *
 * Each built-in template is rendered with fixed sample data and compared
 * pixel-by-pixel with `tests/goldens/<id>.png`. On a mismatch the current
 * render and a diff image (changed pixels in red) are written to
 * `tests/goldens/.diff/`, which is gitignored.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

import { capturePreviews } from "./lib/capturePreviews";

const GOLDEN_DIR = path.resolve(import.meta.dir, "../tests/goldens");
const DIFF_DIR = path.join(GOLDEN_DIR, ".diff");

// A pixel counts as changed when any channel moves by more than this (0-255).
// Absorbs antialiasing noise between Chromium builds.
const CHANNEL_TOLERANCE = 24;
// A template fails when more than this fraction of its pixels changed.
const MAX_CHANGED_RATIO = 0.001;

type Raw = { data: Buffer; width: number; height: number };

const decode = async (png: Buffer): Promise<Raw> => {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const compare = (golden: Raw, actual: Raw) => {
  const pixelCount = golden.width * golden.height;
  const diff = Buffer.alloc(pixelCount * 4);
  let changed = 0;

  for (let i = 0; i < pixelCount * 4; i += 4) {
    const delta = Math.max(
      Math.abs(golden.data[i] - actual.data[i]),
      Math.abs(golden.data[i + 1] - actual.data[i + 1]),
      Math.abs(golden.data[i + 2] - actual.data[i + 2]),
      Math.abs(golden.data[i + 3] - actual.data[i + 3]),
    );

    if (delta > CHANNEL_TOLERANCE) {
      changed++;
      diff[i] = 255;
      diff[i + 3] = 255;
    } else {
      // Faded copy of the golden so the red has context.
      diff[i] =
        diff[i + 1] =
        diff[i + 2] =
          Math.round(255 - (255 - golden.data[i + 1]) * 0.25);
      diff[i + 3] = 255;
    }
  }

  return { ratio: changed / pixelCount, diff };
};

async function main() {
  const update = process.argv.includes("--update");
  const previews = await capturePreviews("golden");

  mkdirSync(GOLDEN_DIR, { recursive: true });
  rmSync(DIFF_DIR, { recursive: true, force: true });

  if (update) {
    for (const { id, buffer } of previews) {
      writeFileSync(path.join(GOLDEN_DIR, `${id}.png`), buffer);
      console.log(`updated  ${id} (${(buffer.length / 1024).toFixed(0)} KB)`);
    }
    return;
  }

  const failures: string[] = [];

  for (const { id, buffer } of previews) {
    const goldenPath = path.join(GOLDEN_DIR, `${id}.png`);
    if (!existsSync(goldenPath)) {
      failures.push(id);
      console.log(`MISSING  ${id} (run test:goldens:update to create it)`);
      continue;
    }

    const [golden, actual] = await Promise.all([
      decode(readFileSync(goldenPath)),
      decode(buffer),
    ]);

    if (golden.width !== actual.width || golden.height !== actual.height) {
      failures.push(id);
      console.log(
        `FAIL     ${id}: size ${actual.width}x${actual.height}, golden is ${golden.width}x${golden.height}`,
      );
      mkdirSync(DIFF_DIR, { recursive: true });
      writeFileSync(path.join(DIFF_DIR, `${id}.actual.png`), buffer);
      continue;
    }

    const { ratio, diff } = compare(golden, actual);
    const percent = (ratio * 100).toFixed(3);

    if (ratio > MAX_CHANGED_RATIO) {
      failures.push(id);
      mkdirSync(DIFF_DIR, { recursive: true });
      writeFileSync(path.join(DIFF_DIR, `${id}.actual.png`), buffer);
      await sharp(diff, {
        raw: { width: golden.width, height: golden.height, channels: 4 },
      })
        .png()
        .toFile(path.join(DIFF_DIR, `${id}.diff.png`));
      console.log(`FAIL     ${id}: ${percent}% of pixels changed`);
    } else {
      console.log(`ok       ${id} (${percent}% changed)`);
    }
  }

  if (failures.length > 0) {
    console.log(
      `\n${failures.length} of ${previews.length} templates differ. See ${path.relative(process.cwd(), DIFF_DIR)}/`,
    );
    process.exit(1);
  }

  console.log(`\nAll ${previews.length} templates match their goldens.`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
