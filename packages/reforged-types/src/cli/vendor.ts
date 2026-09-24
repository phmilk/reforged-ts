/**
 * `vendor <tag>`: vendors a jass-history tag without generating. Downloads
 * `common.j`, `blizzard.j` and `common.ai` at the tag into the package's
 * `vendor/<Build>/` with their provenance file, and prints the size and
 * sha256 of each. Exit codes: 0 vendored, 1 on a failed download, 2 on usage.
 */
import { join, relative } from "node:path";
import { httpFetcher, vendorTag, type Fetcher } from "../vendor/index.js";
import {
  invokedDirectly,
  packageRoot,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: vendor <jass-history tag>\n" +
  "  e.g. vendor Reforged-v3.0.0.24268-w3-3a9d8f2\n";

export async function main(
  args: readonly string[],
  output: Output,
  fetcher: Fetcher = httpFetcher,
): Promise<number> {
  const [tag] = args;
  if (!tag || args.length > 1) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const { patchDir, provenance } = await vendorTag({
      tag,
      vendorRoot: join(packageRoot, "vendor"),
      fetcher,
    });
    const { tag: vendored, commit } = provenance;
    const where = relative(process.cwd(), patchDir);
    output.stdout(
      `vendored ${vendored} (commit ${commit}) into ${where}\n` +
        Object.entries(provenance.files)
          .map(
            ([name, file]) =>
              `  ${name.padEnd(10)} ${String(file.bytes).padStart(8)} bytes` +
              `  sha256 ${file.sha256}\n`,
          )
          .join(""),
    );
  } catch (error) {
    output.stderr(`vendor failed: ${(error as Error).message}\n`);
    return 1;
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
