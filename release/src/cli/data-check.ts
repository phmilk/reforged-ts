/**
 * `data:check`: the rename map of `reforged-ts` against its built
 * declarations and the site's docs tree. It takes no arguments and reads the
 * declarations as built (the root script builds the library first). Each
 * violation goes on its own line, to stderr when one fails the check, else
 * to stdout. A missing migration page is reported without failing while pre
 * mode is active, as `release:gate` does. Exit codes: 0 pass, or only
 * missing pages reported in pre mode; 1 a violation, or the inputs cannot
 * be read; 2 usage.
 */
import { join, posix, relative, sep } from "node:path";
import { readPreMode } from "../changesets.js";
import {
  dataCheck,
  DOCS_DIR,
  failing,
  type DataCheckInput,
  type Violation,
} from "../data-check.js";
import { formatPair, RENAMES_FILE } from "../major-changeset-gate.js";
import { LIBRARY_PACKAGE } from "../packages.js";
import { readPublishablePackages, repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: data:check\n";

/** Where the command looks: the repository. */
export interface Context {
  root: string;
}

/** The inputs in the workspace at `root`, their paths absolute. */
async function workspaceInput(root: string): Promise<DataCheckInput> {
  const packages = await readPublishablePackages(root);
  const library = packages.find((pkg) => pkg.name === LIBRARY_PACKAGE);
  const types = library?.manifest.types;
  if (library === undefined || typeof types !== "string") {
    throw new Error(
      `The workspace has no publishable package ${LIBRARY_PACKAGE} with a "types" entry.`,
    );
  }
  return {
    renames: join(library.absoluteDir, RENAMES_FILE),
    declarations: join(library.absoluteDir, types),
    docs: join(root, DOCS_DIR),
    version: library.version,
  };
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot },
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  const shown = (path: string) =>
    relative(context.root, path).split(sep).join(posix.sep);
  let input: DataCheckInput;
  let violations: Violation[];
  let failed: Violation[];
  try {
    input = await workspaceInput(context.root);
    violations = await dataCheck(input);
    failed = failing(violations, await readPreMode(context.root));
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  if (violations.length === 0) {
    output.stdout(
      `${shown(input.renames)} agrees with ${shown(input.declarations)} and ${shown(input.docs)}.\n`,
    );
    return 0;
  }
  const lines = [
    `${shown(input.renames)} disagrees with the declarations or the docs tree:`,
    ...violations.map((violation) =>
      violation.kind === "old-name"
        ? `- \`${violation.old}\` (${formatPair(violation.versions)}) is still exported by ${shown(input.declarations)}: remove it, or deprecate it if it stays for a release.`
        : `- No migration page for ${formatPair(violation.versions)}: ${shown(violation.path)} (or .mdx).`,
    ),
  ];
  if (failed.length < violations.length) {
    lines.push(
      "Pre mode is active (`.changeset/pre.json`): a missing migration page is reported only, and fails once pre mode is exited.",
    );
  }
  const text = `${lines.join("\n")}\n`;
  if (failed.length > 0) {
    output.stderr(text);
    return 1;
  }
  output.stdout(text);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
