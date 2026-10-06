// Map folders for the tests: the committed fixtures, and folders built in a
// temporary directory from the files a test names.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The package's root folder. */
export const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

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
export function mapFolder(files: Readonly<Record<string, string>>): string {
  const folder = path.join(makeTempDir(), "test.w3m");
  fs.mkdirSync(folder);
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(folder, name), contents);
  }
  return folder;
}

/** Removes every temporary directory the tests made. */
export function removeTemporary(): void {
  for (const dir of temporary.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
