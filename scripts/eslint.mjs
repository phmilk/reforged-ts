// ESLint over the whole workspace, one process per group of directories
// (#377): `pnpm lint:eslint` and `pnpm format` run it, with the arguments they
// pass on (`--max-warnings 0`, `--fix`). typescript-eslint's project service
// keeps the program of every tsconfig it opens until the process exits, and
// the workspace has about forty, so a single `eslint .` outgrows the default
// heap of a machine with 7 GB of memory. Each group's process holds its own
// programs alone. Each group lints its directory less the groups before it,
// so every file is linted once, by the same configuration and with the same
// program as by `eslint .`. Every group runs even when one fails, so `--fix`
// reaches every file; the exit code is the first failing group's.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";

// The library, its fifteen tsconfigs alone; the other packages; the rest of
// the workspace (the private packages, the docs site and the root).
const GROUPS = ["packages/reforged-ts", "packages", "."];

const manifest = createRequire(import.meta.url).resolve("eslint/package.json");
const bin = join(dirname(manifest), "bin", "eslint.js");
const root = join(import.meta.dirname, "..");

let status = 0;
GROUPS.forEach((group, index) => {
  const ignores = GROUPS.slice(0, index).flatMap((earlier) => [
    "--ignore-pattern",
    `${earlier}/`,
  ]);
  const run = spawnSync(
    process.execPath,
    [bin, ...process.argv.slice(2), ...ignores, group],
    { cwd: root, stdio: "inherit" },
  );
  if (run.error) throw run.error;
  if (status === 0) status = run.status ?? 1;
});
process.exitCode = status;
