import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

import { capturePreviews } from "./lib/capturePreviews";

const OUTPUT_DIR = path.resolve(import.meta.dir, "../src/assets/previews");

async function main() {
  try {
    const previews = await capturePreviews("preview");

    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const { id, buffer } of previews) {
      const filePath = path.join(OUTPUT_DIR, `${id}.webp`);
      writeFileSync(filePath, buffer);
      console.log(
        `Saved ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`,
      );
    }

    // Generate barrel file
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
  }
}

main();
