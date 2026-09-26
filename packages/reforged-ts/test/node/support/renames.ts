// The library's rename map, migration/renames.json, and its schema next to
// it. The rename map module the workspace's scripts share
// (release/src/rename-map.ts) reads and checks them; the published files are
// read from `pnpm pack`.

import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { packageRoot } from "./package-root";

export const mapFile = fileURLToPath(
  new URL("../../../migration/renames.json", import.meta.url),
);
export const schemaFile = fileURLToPath(
  new URL("../../../migration/renames.schema.json", import.meta.url),
);

/**
 * The files `pnpm pack` puts in the package, relative to its root. Under
 * `pnpm test` the pnpm that runs the script is reused through node;
 * otherwise `pnpm` is looked up by the shell (pnpm.cmd on Windows).
 */
export function publishedFiles(): string[] {
  const options = { cwd: packageRoot, encoding: "utf8" } as const;
  const execPath = process.env.npm_execpath;
  const output =
    execPath !== undefined && /pnpm\.c?js$/.test(execPath)
      ? execFileSync(
          process.execPath,
          [execPath, "pack", "--dry-run", "--json"],
          options,
        )
      : execSync("pnpm pack --dry-run --json", options);
  const packed = JSON.parse(output) as { files: { path: string }[] };
  return packed.files.map((file) => file.path);
}
