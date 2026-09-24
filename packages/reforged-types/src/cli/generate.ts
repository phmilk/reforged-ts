/**
 * `typings:generate [tag] [--vendor <dir>] [--overlay <dir>] [--out <dir>]`:
 * with a jass-history tag, vendors it first (downloads its three Patch files
 * into `<vendor>/<build>/` with their provenance); then runs Seam 1 over
 * every vendored Patch and the Overlay, writes the files under `--out`,
 * prints the declarations each Patch adds over the one before it and the
 * diagnostics as a checklist, and exits non-zero on any error, zero with
 * warnings only. The defaults are the package's `vendor` and `overlay`
 * folders and the package root.
 */
import type { Additions } from "../additions.js";
import { generate } from "../generate.js";
import { patchList } from "../provenance.js";
import { httpFetcher, vendorTag, type Fetcher } from "../vendor/index.js";
import { countDiagnostics, formatChecklist } from "./checklist.js";
import {
  FOLDER_OPTIONS,
  invokedDirectly,
  parseArgs,
  PROCESS_OUTPUT,
  vendoredPatchDirs,
  writeFiles,
  type Output,
} from "./common.js";

export type { Output } from "./common.js";

const USAGE = `Usage: typings:generate [tag] ${FOLDER_OPTIONS}\n`;

/** What vendoring reaches outside the process; tests replace both. */
export interface Network {
  fetcher: Fetcher;
  /** Clock for the download date of a newly vendored tag. */
  now?: Date;
}

export async function main(
  args: readonly string[],
  output: Output,
  network: Network = { fetcher: httpFetcher }
): Promise<number> {
  const parsed = parseArgs(args);
  if (!parsed || parsed.positional.length > 1) {
    output.stderr(USAGE);
    return 2;
  }
  const { vendorDir, overlayDir, outDir } = parsed.folders;
  const [tag] = parsed.positional;

  let report = "";
  if (tag !== undefined) {
    try {
      const vendored = await vendorTag({
        tag,
        vendorRoot: vendorDir,
        fetcher: network.fetcher,
        ...(network.now ? { now: network.now } : {}),
      });
      const { patch, commit } = vendored.provenance;
      report += vendored.unchanged
        ? `Vendored ${tag}: Patch ${patch} at commit ${commit}, unchanged.\n`
        : `Vendored ${tag}: Patch ${patch} at commit ${commit}.\n`;
    } catch (error) {
      output.stderr(`Vendoring ${tag} failed: ${(error as Error).message}\n`);
      return 1;
    }
  }

  const patchDirs = await vendoredPatchDirs(vendorDir);
  const result = await generate({ patchDirs, overlayDir });
  report += formatAdditions(result.additions);
  if (!result.ok) {
    const counts = countDiagnostics(result.diagnostics);
    output.stdout(report);
    output.stderr(
      `Generation failed: ${counts}. No file was written.\n\n` +
        formatChecklist(result.diagnostics)
    );
    return 1;
  }

  await writeFiles(outDir, result.files);
  report += `Generated ${result.files.size} files for ${patchList(result.patches)}.\n`;
  output.stdout(
    result.diagnostics.length === 0
      ? report
      : report + "\n" + formatChecklist(result.diagnostics)
  );
  return 0;
}

/**
 * Per pair of consecutive vendored Patches, the declarations only the newer
 * one has, each with its Patch file and line; the Overlay entries of these
 * functions and globals take `since` set to the newer build.
 */
export function formatAdditions(additions: readonly Additions[]): string {
  return additions
    .map(
      ({ patch, previous, declarations }) =>
        `In Patch ${patch} and not in Patch ${previous} (${declarations.length}):\n` +
        declarations
          .map((d) => `- ${d.source}:${d.line}: ${d.jass}\n`)
          .join("") +
        "\n"
    )
    .join("");
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
