/**
 * `typings:generate [patchDir] [overlayDir] [outDir]`: runs Seam 1 over a
 * Patch folder and an Overlay folder (by default the package's vendored Patch
 * named by `reforged.patch` and its Overlay), writes the files under `outDir`
 * (by default the package root), prints the diagnostics as a checklist, and
 * exits non-zero on any error, zero with warnings only.
 */
import { generate } from "../generate.js";
import { countDiagnostics, formatChecklist } from "./checklist.js";
import {
  folders,
  invokedDirectly,
  PROCESS_OUTPUT,
  writeFiles,
  type Output,
} from "./common.js";

export type { Output } from "./common.js";

const USAGE = "Usage: typings:generate [patchDir] [overlayDir] [outDir]\n";

export async function main(
  args: readonly string[],
  output: Output
): Promise<number> {
  if (args.length > 3) {
    output.stderr(USAGE);
    return 2;
  }
  const { patchDir, overlayDir, outDir } = await folders(args);

  const result = await generate({ patchDir, overlayDir });
  if (!result.ok) {
    const counts = countDiagnostics(result.diagnostics);
    output.stderr(
      `Generation failed: ${counts}. No file was written.\n\n` +
        formatChecklist(result.diagnostics)
    );
    return 1;
  }

  await writeFiles(outDir, result.files);
  const summary = `Generated ${result.files.size} files for Patch ${result.patch}.\n`;
  output.stdout(
    result.diagnostics.length === 0
      ? summary
      : summary + "\n" + formatChecklist(result.diagnostics)
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
