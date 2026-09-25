/**
 * `release:matrix`: generates the compatibility matrix. It appends the row
 * of the stable release the workspace holds, when that release has none,
 * and writes the matrix JSON, the docs site's table and the Template's README
 * fragment; a prerelease (pre mode) adds no row and leaves the files as they
 * are. It fails, writing nothing, when a `reforged.patch` breaks the
 * consistency check, when the systems list has no entry for the library's
 * minor, or when the release's row is already committed with other
 * contents. Exit codes: 0 generated, 1 a problem or inputs that cannot be
 * read, 2 usage.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateMatrix, type MatrixRow } from "../matrix.js";
import { repositoryRoot } from "../workspace.js";
import { invokedDirectly, PROCESS_OUTPUT, type Output } from "./common.js";

const USAGE = "Usage: release:matrix\n";

/** Where the command looks, and the clock that gives the cut date. */
export interface Context {
  root: string;
  now: () => Date;
}

export const DEFAULT_CONTEXT: Context = {
  root: repositoryRoot,
  now: () => new Date(),
};

/** Writes `text` at `path` under `root` unless the file already holds it. */
async function update(root: string, path: string, text: string) {
  const target = join(root, path);
  const current = await readFile(target, "utf8").catch(() => null);
  if (current === text) return false;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
  return true;
}

const named = (row: MatrixRow) =>
  `reforged-ts ${row.library}, reforged-types ${row.typings}, reforged-test ${row.harness}, eslint-plugin-reforged ${row.plugin} (Patch ${row.patch}, cut ${row.cutDate})`;

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = DEFAULT_CONTEXT,
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let result: Awaited<ReturnType<typeof generateMatrix>>;
  try {
    result = await generateMatrix(context.root, context.now());
  } catch (error) {
    output.stderr(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }

  if (!result.ok) {
    output.stderr(
      result.problems.map(({ message }) => `${message}\n`).join("") +
        "The compatibility matrix: docs/release.md#the-compatibility-matrix.\n",
    );
    return 1;
  }

  const written: string[] = [];
  for (const [path, text] of result.files) {
    if (await update(context.root, path, text)) written.push(path);
  }
  const summary =
    result.status === "appended" && result.row
      ? `Appended the row of ${named(result.row)}.`
      : result.status === "unchanged" && result.row
        ? `The matrix already has the row of ${named(result.row)}.`
        : `No row: ${String(result.reason)}`;
  output.stdout(
    `${summary} ${written.length === 0 ? "No file changed." : `Wrote ${written.join(", ")}.`}\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
