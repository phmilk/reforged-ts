// The repository the conventions tests check: its root and its files.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root, two folders up from this file.
export const root = fileURLToPath(new URL("../../", import.meta.url));

// A file of the repository, by its path from the root.
export function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}
