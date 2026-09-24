/**
 * `typings:generate [patchDir] [overlayDir] [outDir]`: runs Seam 1 over a
 * Patch folder and an Overlay folder (by default the package's vendored Patch
 * named by `reforged.patch` and its Overlay), writes the files under `outDir`
 * (by default the package root), prints the diagnostics as a checklist, and
 * exits non-zero on any error, zero with warnings only.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generate } from "../generate.js";
import { countDiagnostics, formatChecklist } from "./checklist.js";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const USAGE = "Usage: typings:generate [patchDir] [overlayDir] [outDir]\n";

/** The package root, from `src/cli` in tests and `build/cli` when built. */
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

export async function main(
  args: readonly string[],
  output: Output
): Promise<number> {
  if (args.length > 3) {
    output.stderr(USAGE);
    return 2;
  }
  const patchDir = args[0] ?? join(packageRoot, "vendor", await packagePatch());
  const overlayDir = args[1] ?? join(packageRoot, "overlay");
  const outDir = args[2] ?? packageRoot;

  const result = await generate({ patchDir, overlayDir });
  if (!result.ok) {
    const counts = countDiagnostics(result.diagnostics);
    output.stderr(
      `Generation failed: ${counts}. No file was written.\n\n` +
        formatChecklist(result.diagnostics)
    );
    return 1;
  }

  for (const [path, text] of result.files) {
    const target = join(outDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  const summary = `Generated ${result.files.size} files for Patch ${result.patch}.\n`;
  output.stdout(
    result.diagnostics.length === 0
      ? summary
      : summary + "\n" + formatChecklist(result.diagnostics)
  );
  return 0;
}

async function packagePatch(): Promise<string> {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8")
  );
  return manifest.reforged.patch;
}

function invokedDirectly(): boolean {
  const script = process.argv[1];
  return (
    script !== undefined &&
    pathToFileURL(resolve(script)).href === import.meta.url
  );
}

if (invokedDirectly()) {
  process.exitCode = await main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
}
