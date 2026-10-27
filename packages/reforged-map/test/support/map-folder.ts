// Map folders for the tests: the committed fixtures, and folders built in a
// temporary directory from the files a test names.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The package's root folder: the nearest one above that holds a
 * package.json, from test/support or from its copy the measurement compiles
 * to build/test/support.
 */
export const PACKAGE_ROOT = packageRoot(
  path.dirname(fileURLToPath(import.meta.url)),
);

function packageRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, "package.json"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) throw new Error("reforged-map has no package.json");
  return packageRoot(parent);
}

/** A committed fixture map folder, under test/fixtures. */
export const fixtureMap = (name: string): string =>
  path.join(PACKAGE_ROOT, "test", "fixtures", name);

const temporary: string[] = [];

/** A new empty temporary directory, removed by `removeTemporary`. */
export function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reforged-map-"));
  temporary.push(dir);
  return dir;
}

/** A map folder (`test.w3m`) in a new temporary directory, holding these files by name. */
export function mapFolder(
  files: Readonly<Record<string, string | Uint8Array>>,
): string {
  const folder = path.join(makeTempDir(), "test.w3m");
  fs.mkdirSync(folder);
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(folder, name), contents);
  }
  return folder;
}

/**
 * Every file and folder under a folder, by relative path, as
 * `fs.readdirSync(folder, { recursive: true })` names them, without entering
 * a `node_modules`. The recursive `readdirSync` follows a Map project's
 * linked typescript and reforged-builtins on Windows, into the workspace's
 * packages: 20,000 names and near 1 s a walk (#754).
 */
export function listTree(folder: string): string[] {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.name !== "node_modules")
    .flatMap((entry) =>
      entry.isDirectory()
        ? [
            entry.name,
            ...listTree(path.join(folder, entry.name)).map((name) =>
              path.join(entry.name, name),
            ),
          ]
        : [entry.name],
    );
}

/** Removes every temporary directory the tests made. */
export function removeTemporary(): void {
  for (const dir of temporary.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
