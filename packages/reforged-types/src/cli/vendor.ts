// Usage: node build/cli/vendor.js <jass-history tag>
// Downloads common.j, blizzard.j and common.ai at the tag into vendor/<patch>/ with provenance.json.
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { httpFetcher, vendorTag } from "../vendor/index.js";

const VENDOR_ROOT = fileURLToPath(new URL("../../vendor/", import.meta.url));

const tag = process.argv[2];
if (!tag || process.argv.length > 3) {
  console.error("usage: vendor <jass-history tag>   e.g. vendor Reforged-v3.0.0.24268-w3-3a9d8f2");
  process.exit(2);
}

try {
  const { patchDir, provenance } = await vendorTag({ tag, vendorRoot: VENDOR_ROOT, fetcher: httpFetcher });
  console.log(`vendored ${provenance.tag} (commit ${provenance.commit}) into ${relative(process.cwd(), patchDir)}`);
  for (const [name, file] of Object.entries(provenance.files)) {
    console.log(`  ${name.padEnd(10)} ${String(file.bytes).padStart(8)} bytes  sha256 ${file.sha256}`);
  }
} catch (error) {
  console.error(`vendor failed: ${(error as Error).message}`);
  process.exit(1);
}
