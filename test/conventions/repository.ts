// The repository the conventions tests check: its root and its files.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root, two folders up from this file.
export const root = fileURLToPath(new URL("../../", import.meta.url));

// A file of the repository, by its path from the root.
export function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

// The files under `folder`, by their `/`-separated path from it, `.git`
// and `node_modules` skipped.
export function folderFiles(folder: string, current = folder): string[] {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      return entry.name === ".git" || entry.name === "node_modules"
        ? []
        : folderFiles(folder, path);
    }
    return entry.isFile() ? [relative(folder, path).split("\\").join("/")] : [];
  });
}
