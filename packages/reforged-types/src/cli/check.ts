/**
 * `typings:check [--vendor <dir>] [--overlay <dir>] [--out <dir>]`: the drift
 * gate. Runs Seam 1 over the same inputs as `typings:generate` without a tag
 * (every vendored Patch and the Overlay), writes the result into a
 * temporary folder, and compares it byte for byte with the committed output
 * under `outDir` (by default the package root). It fails naming each file
 * that differs, that is generated but not committed, and that is committed
 * in a generated folder but no longer generated. Exit codes as
 * `typings:generate`: 0 in sync, 1 on drift or failed generation, 2 on usage.
 */
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { patchList } from "../build.js";
import { REGENERATE_COMMAND } from "../emit.js";
import { generate } from "../generate.js";
import { byCodePoint } from "../order.js";
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

const USAGE = `Usage: typings:check ${FOLDER_OPTIONS}\n`;

export async function main(
  args: readonly string[],
  output: Output
): Promise<number> {
  const parsed = parseArgs(args);
  if (!parsed || parsed.positional.length > 0) {
    output.stderr(USAGE);
    return 2;
  }
  const { vendorDir, overlayDir, outDir } = parsed.folders;

  const patchDirs = await vendoredPatchDirs(vendorDir);
  const result = await generate({ patchDirs, overlayDir });
  if (!result.ok) {
    const counts = countDiagnostics(result.diagnostics);
    output.stderr(
      `Generation failed: ${counts}. Nothing was compared.\n\n` +
        formatChecklist(result.diagnostics)
    );
    return 1;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "reforged-types-check-"));
  try {
    await writeFiles(tempDir, result.files);
    const drift = await compare([...result.files.keys()], tempDir, outDir);
    if (drift.length > 0) {
      output.stderr(
        `Typings drift: ${drift.length} ${
          drift.length === 1 ? "file does" : "files do"
        } not match what the sources and the Overlay generate. ` +
          `Run \`${REGENERATE_COMMAND}\` and commit the result.\n\n` +
          drift.map((line) => `- [ ] ${line}\n`).join("")
      );
      return 1;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
  output.stdout(
    `Typings match: ${result.files.size} files of ${patchList(result.patches)} ` +
      "are exactly what the sources and the Overlay generate.\n"
  );
  return 0;
}

/**
 * One line per drifting file, by output path in code-point order. A folder
 * that holds generated files is compared whole, so a stale file left there
 * is reported; the package root is not, since it holds other files.
 */
async function compare(
  paths: readonly string[],
  generatedDir: string,
  committedDir: string
): Promise<string[]> {
  const drift = new Map<string, string>();
  for (const path of paths) {
    const committed = await readBytes(join(committedDir, path));
    if (committed === undefined) {
      drift.set(path, `${path}: generated but not committed`);
    } else if (!committed.equals((await readBytes(join(generatedDir, path)))!)) {
      drift.set(path, `${path}: differs from the generated file`);
    }
  }
  const generated = new Set(paths);
  const folders = new Set(
    paths.map((path) => posix.dirname(path)).filter((folder) => folder !== ".")
  );
  for (const folder of folders) {
    for (const item of await filesIn(join(committedDir, folder))) {
      const path = `${folder}/${item}`;
      if (!generated.has(path)) {
        drift.set(path, `${path}: committed but no longer generated`);
      }
    }
  }
  return [...drift.keys()].sort(byCodePoint).map((path) => drift.get(path)!);
}

async function readBytes(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch {
    return undefined;
  }
}

async function filesIn(folder: string): Promise<string[]> {
  try {
    const items = await readdir(folder, { withFileTypes: true });
    return items.filter((item) => item.isFile()).map((item) => item.name);
  } catch {
    return [];
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
