/**
 * What the package's commands share: the folder options and defaults of
 * `typings:generate` and `typings:check`, the vendored Patch folders, the
 * output streams, and writing generated files.
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { byCodePoint } from "../order.js";

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
  /** Holds one folder per vendored Patch, named after its Build. */
  vendorDir: string;
  overlayDir: string;
  /** Where the generated files live, by their output paths. */
  outDir: string;
}

const FLAGS = {
  "--vendor": "vendorDir",
  "--overlay": "overlayDir",
  "--out": "outDir",
} as const;

export const FOLDER_OPTIONS =
  "[--vendor <dir>] [--overlay <dir>] [--out <dir>]";

/**
 * Splits the arguments into the folder options (by default the package's
 * `vendor` and `overlay` folders and the package root) and the positional
 * arguments. `undefined` when an option is unknown or lacks its value.
 */
export function parseArgs(
  args: readonly string[]
): { folders: Folders; positional: string[] } | undefined {
  const folders: Folders = {
    vendorDir: join(packageRoot, "vendor"),
    overlayDir: join(packageRoot, "overlay"),
    outDir: packageRoot,
  };
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = FLAGS[arg as keyof typeof FLAGS];
    const value = args[i + 1];
    if (key === undefined || value === undefined) return undefined;
    folders[key] = value;
    i++;
  }
  return { folders, positional };
}

/**
 * Every vendored Patch folder under `vendorDir`, in code-point order of its
 * name; none when `vendorDir` does not exist.
 */
export async function vendoredPatchDirs(vendorDir: string): Promise<string[]> {
  try {
    const items = await readdir(vendorDir, { withFileTypes: true });
    return items
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .sort(byCodePoint)
      .map((name) => join(vendorDir, name));
  } catch {
    return [];
  }
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

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv[1];
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}
