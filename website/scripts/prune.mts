// docs:prune: applies the docs versions' retention rule, the last three
// minors of each major (#40), to the site's cut versions. docs:version runs
// it after every cut; the version-cut workflow (#48) can run it alone. Exit
// code 0 when done, 1 when the site's versions cannot be read, 2 on
// arguments.
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { type Output, PROCESS_OUTPUT } from "./collect.mts";
import { prune, VersionsError } from "./versions.mts";

/** The site folder, where Docusaurus keeps its versions. */
export const SITE = fileURLToPath(new URL("../", import.meta.url));

/** Prunes the site's versions and reports what it kept and removed. */
export async function pruneAndReport(
  site: string,
  output: Output,
): Promise<number> {
  try {
    const { kept, pruned } = await prune(site);
    const list = (labels: readonly string[]) =>
      labels.length === 0 ? "none" : labels.join(", ");
    output.stdout(`docs:prune: kept ${list(kept)}; removed ${list(pruned)}.\n`);
    return 0;
  } catch (error) {
    if (!(error instanceof VersionsError)) throw error;
    output.stderr(`docs:prune failed: ${error.message}\n`);
    return 1;
  }
}

export async function main(
  args: readonly string[],
  output: Output,
  site: string = SITE,
): Promise<number> {
  if (args.length > 0) {
    output.stderr("Usage: docs:prune (no arguments)\n");
    return 2;
  }
  return pruneAndReport(site, output);
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(resolve(script)).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
