// Leonida Legend hands in the guide: it copies this repo's app/ and
// screenshots/ into the output folder the grader (or MAKEFUN_OUTPUT_DIR)
// names, then writes /output/dossier.json with the vendored make.fun
// library. Node 22, standard library only, no network, no build step.
// Outside the grader: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The folder this file lives in is the repository root.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));

// The grader gives us a writable /output; anywhere else, the caller can
// point MAKEFUN_OUTPUT_DIR at a folder of their own.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Start from a clean output folder so a stale file can never ride along.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// The whole guide: every static file under app/.
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });

// The screenshots, when the folder exists.
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), {
    recursive: true,
  });
}

// The dossier is the summary the judge reads: the screenshots, the first
// load's files and bytes, and the guide's own source. The vendored library
// writes it, so the scorer's own rebuild matches these bytes exactly.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);

// Say what was handed in, so a run's log shows the entry at a glance.
console.log(
  `Leonida Legend handed in: dossier.json is ${dossier.length} bytes in ${outputDir}`,
);
