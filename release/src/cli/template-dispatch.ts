/**
 * `release:template-dispatch --pack-dir <dir> --out <file> [--await-npm <minutes>]`:
 * writes to `<file>` the body of the `reforged-ts-release`
 * `repository_dispatch` the release in the `changeset pack` output `<dir>`
 * sends the Template, which the release workflow posts with `gh api`.
 * Prints the payload; in GitHub Actions (`GITHUB_STEP_SUMMARY` set) it also
 * goes to the job summary, so a dry run shows what a release would send.
 *
 * With `--await-npm`, the body is written only once the registry lists
 * every version of the payload, asked every 15 seconds for at most
 * `<minutes>`: the Template's sync installs them as soon as it starts.
 *
 * Relative paths resolve against the folder the command was started from.
 * Exit codes: 0 written, 1 the plan cannot be read or dispatched, or npm
 * does not list the release in time, 2 usage.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { TEMPLATE_REPOSITORY } from "../template-clone.js";
import {
  awaitOnNpm,
  templateDispatch,
  type NpmWait,
} from "../template-dispatch.js";
import { repositoryRoot } from "../workspace.js";
import {
  appendSummary,
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: release:template-dispatch --pack-dir <dir> --out <file> [--await-npm <minutes>]\n";

/** The pause between two rounds of registry requests. */
const NPM_INTERVAL_MS = 15_000;

export interface Context extends Pick<NpmWait, "fetcher" | "sleep"> {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, for the versions the plan does not publish. */
  root: string;
  env: Readonly<Record<string, string | undefined>>;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    root: repositoryRoot,
    env: process.env,
    fetcher: fetch,
    sleep: (ms) => sleep(ms),
  },
): Promise<number> {
  const options = parseOptions(
    args,
    ["--pack-dir", "--out", "--await-npm"],
    ["--pack-dir", "--out"],
  );
  const minutes =
    options?.["--await-npm"] === undefined
      ? undefined
      : Number(options["--await-npm"]);
  if (
    options === undefined ||
    (minutes !== undefined && !(Number.isInteger(minutes) && minutes > 0))
  ) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const body = await templateDispatch(
      resolve(context.cwd, options["--pack-dir"]),
      context.root,
    );
    if (minutes !== undefined) {
      await awaitOnNpm(body.client_payload.versions, {
        fetcher: context.fetcher,
        sleep: context.sleep,
        timeoutMs: minutes * 60_000,
        intervalMs: NPM_INTERVAL_MS,
      });
    }
    await writeFile(
      resolve(context.cwd, options["--out"]),
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
