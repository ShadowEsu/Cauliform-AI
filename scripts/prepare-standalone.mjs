/**
 * Copies static assets into the Next.js standalone output (required for `output: "standalone"`).
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

if (!fs.existsSync(standaloneDir)) {
  console.error("Missing .next/standalone — run `npm run build` first.");
  process.exit(1);
}

fs.cpSync(staticSrc, staticDest, { recursive: true });
fs.cpSync(publicSrc, publicDest, { recursive: true });
console.log("Standalone bundle prepared (.next/static + public).");
