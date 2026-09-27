// The library's rename map, migration/renames.json, and its schema next to
// it. The rename map module the workspace's scripts share
// (release/src/rename-map.ts) reads and checks them; the published files are
// read from `pnpm pack`.

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { packageRoot } from "./package-root";

export const mapFile = fileURLToPath(
  new URL("../../../migration/renames.json", import.meta.url),
);
export const schemaFile = fileURLToPath(
  new URL("../../../migration/renames.schema.json", import.meta.url),
);

/**
 * The files `pnpm pack` puts in the package, relative to its root. `pnpm` is
 * looked up by the shell (pnpm.exe or pnpm.cmd on Windows).
 */
export function publishedFiles(): string[] {
  const output = execSync("pnpm pack --dry-run --json", {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const packed = JSON.parse(output) as { files: { path: string }[] };
  return packed.files.map((file) => file.path);
}
