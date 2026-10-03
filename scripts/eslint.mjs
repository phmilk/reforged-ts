// ESLint over the whole workspace, one process per group of directories
// (#377): `pnpm lint:eslint` and `pnpm format` run it, with the arguments they
// pass on (`--max-warnings 0`, `--fix`). typescript-eslint's project service
// keeps the program of every tsconfig it opens until the process exits, so a
// single `eslint .` over all the workspace's tsconfigs outgrows the default
// heap of a machine with 7 GB of memory. Each group's process holds its own
// programs alone. Each group lints its directory less the groups before it,
// so every file is linted once, by the same configuration and with the same
// program as by `eslint .`. Every group runs even when one fails, so `--fix`
// reaches every file; the exit code is the first failing group's. Any other
// argument goes to every group: a path is linted by its own group and skipped
// silently by the others (`--no-warn-ignored`), and a format or output file
// option gives one report per group.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";

// The library, whose tests and examples hold the most tsconfigs; the other
// packages; the rest of the workspace (the private packages, the docs site
// and the root).
const GROUPS = ["packages/reforged-ts", "packages", "."];

const manifestPath = createRequire(import.meta.url).resolve(
  "eslint/package.json",
);
const bin = join(dirname(manifestPath), "bin", "eslint.js");
const root = join(import.meta.dirname, "..");

let status = 0;
GROUPS.forEach((group, index) => {
  const ignores = GROUPS.slice(0, index).flatMap((earlier) => [
    "--ignore-pattern",
    `${earlier}/`,
  ]);
  const result = spawnSync(
    process.execPath,
    [bin, ...process.argv.slice(2), "--no-warn-ignored", ...ignores, group],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (status === 0) status = result.status ?? 1;
});
process.exitCode = status;
