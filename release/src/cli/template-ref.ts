/**
 * `release:template-ref --branch <name>`: writes the Template ref of the
 * Release channel of the branch `<name>` the release runs from (`main` from
 * `master`, `next` from `next`, ADR 0031) into the Creation CLI's build
 * output, `packages/create-reforged-map/dist/template.js`, so the CLI packed
 * next downloads it. Run it after the build and before `changeset pack`,
 * and pack without the packages' scripts: `pnpm pack` runs their `prepare`,
 * which builds the CLI again from its source and its `main`. Refuses any
 * other branch, and a CLI that is not built.
 *
 * Exit codes: 0 written, 1 a branch with no channel or a build output that
 * cannot be read, 2 usage.
 */
import { CREATION_PACKAGE } from "../packages.js";
import { readReleaseChannel } from "../release-channel.js";
import { writeTemplateRef } from "../template-ref.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:template-ref --branch <name>\n";

export interface Context {
  /** The workspace, whose Creation CLI's build output is written. */
  root: string;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot },
): Promise<number> {
  const options = parseOptions(args, ["--branch"], ["--branch"]);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const branch = options["--branch"];

  try {
    const { templateRef } = await readReleaseChannel(branch, context.root);
    await writeTemplateRef(context.root, templateRef);
    output.stdout(
      `${CREATION_PACKAGE} downloads the Template at ${templateRef}, the Template ref of ${branch}'s Release channel.\n`,
    );
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
