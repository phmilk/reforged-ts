/**
 * What the `typings:generate` and `typings:check` commands share: their
 * arguments and defaults, the output streams, and writing generated files.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** The package root, from `src/cli` in tests and `build/cli` when built. */
export const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

export interface Folders {
  patchDir: string;
  overlayDir: string;
  /** Where the generated files live, by their output paths. */
  outDir: string;
}

/**
 * `[patchDir] [overlayDir] [outDir]`, by default the package's vendored
 * Patch named by `reforged.patch`, its Overlay and the package root.
 */
export async function folders(args: readonly string[]): Promise<Folders> {
  return {
    patchDir: args[0] ?? join(packageRoot, "vendor", await packagePatch()),
    overlayDir: args[1] ?? join(packageRoot, "overlay"),
    outDir: args[2] ?? packageRoot,
  };
}

/** Writes each file under `outDir` at its `/`-separated output path. */
export async function writeFiles(
  outDir: string,
  files: ReadonlyMap<string, string>
): Promise<void> {
  for (const [path, text] of files) {
    const target = join(outDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
}

async function packagePatch(): Promise<string> {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8")
  );
  return manifest.reforged.patch;
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv[1];
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}
