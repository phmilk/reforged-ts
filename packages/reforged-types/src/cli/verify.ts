// Usage: node build/cli/verify.js [patchDir]
// Recomputes the sha256 of the vendored Patch files against provenance.json.
// Without an argument, every Patch folder under vendor/ is verified.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runVerify } from "../vendor/index.js";

const VENDOR_ROOT = fileURLToPath(new URL("../../vendor/", import.meta.url));

async function vendoredPatchDirs(): Promise<string[]> {
  const entries = await readdir(VENDOR_ROOT, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => join(VENDOR_ROOT, entry.name));
}

const arg = process.argv[2];
process.exitCode = await runVerify(arg ? [arg] : await vendoredPatchDirs());
