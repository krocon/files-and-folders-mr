import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs";
import fse from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const angularDist = path.resolve(__dirname, "../../fnf/dist/fnf");
  const dest = path.resolve(__dirname, "../resources/renderer");

  if (!fs.existsSync(angularDist)) {
    console.error("Angular dist not found at", angularDist);
    process.exit(1);
  }

  await fse.remove(dest);
  await fse.ensureDir(dest);
  await fse.copy(angularDist, dest, {dereference: true});

  // Adjust base href in index.html for Electron file:// loading
  const indexFile = path.join(dest, "index.html");
  if (fs.existsSync(indexFile)) {
    try {
      const html = fs.readFileSync(indexFile, "utf8");
      const replaced = html.replace(/<base\s+href=["']\/["']\s*>/i, "<base href=\"./\">");
      if (replaced !== html) {
        fs.writeFileSync(indexFile, replaced, "utf8");
        console.log("Adjusted <base href> to ./ in", indexFile);
      } else {
        console.warn("No <base href=\"/\"> found in index.html; leaving as-is");
      }
    } catch (e) {
      console.warn("Failed to adjust base href in index.html:", e);
    }
  } else {
    console.warn("index.html not found in renderer destination at", indexFile);
  }

  console.log("Copied renderer from", angularDist, "to", dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
