/**
 * `release:template-dispatch --pack-dir <dir> --out <file>`: writes to
 * `<file>` the body of the `reforged-ts-release` `repository_dispatch` the
 * release in the `changeset pack` output `<dir>` sends the Template, which
 * the release workflow posts with `gh api`. Prints the payload; in GitHub
 * Actions (`GITHUB_STEP_SUMMARY` set) it also goes to the job summary, so a
 * dry run shows what a release would send.
 *
 * Relative paths resolve against the folder the command was started from.
 * Exit codes: 0 written, 1 the plan cannot be read or dispatched, 2 usage.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TEMPLATE_REPOSITORY } from "../template-clone.js";
import { templateDispatch } from "../template-dispatch.js";
import { repositoryRoot } from "../workspace.js";
import {
  appendSummary,
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: release:template-dispatch --pack-dir <dir> --out <file>\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, for the versions the plan does not publish. */
  root: string;
  env: Readonly<Record<string, string | undefined>>;
}

function parseArgs(
  args: readonly string[],
): { packDir: string; out: string } | undefined {
  const options = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const [option, value] = [args[i], args.at(i + 1)];
    if (
      (option !== "--pack-dir" && option !== "--out") ||
      options.has(option) ||
      value === undefined ||
      value === "" ||
      value.startsWith("--")
    ) {
      return undefined;
    }
    options.set(option, value);
  }
  const packDir = options.get("--pack-dir");
  const out = options.get("--out");
  return packDir === undefined || out === undefined
    ? undefined
    : { packDir, out };
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    root: repositoryRoot,
    env: process.env,
  },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const body = await templateDispatch(
      resolve(context.cwd, options.packDir),
      context.root,
    );
    await writeFile(
      resolve(context.cwd, options.out),
      `${JSON.stringify(body)}\n`,
    );
    const { tag } = body.client_payload;
    const payload = JSON.stringify(body.client_payload, null, 2);
    output.stdout(`${body.event_type}, tag ${tag}:\n${payload}\n`);
    await appendSummary(
      context.env,
      "## Template dispatch\n\n" +
        `\`${body.event_type}\` to ${TEMPLATE_REPOSITORY}, tag \`${tag}\`:\n\n` +
        `\`\`\`json\n${payload}\n\`\`\`\n`,
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
