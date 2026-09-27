/**
 * `patch-watch:report`: the title and body of what the Patch watch opens for
 * the new Patch of a plan (`patch-watch:plan --json` saved to a file),
 * printed as one JSON object `{ "title", "body" }`.
 *
 * - `issue --plan <file>`: the "New Patch" issue.
 * - `pull-request --plan <file> --stdout <file> --stderr <file>
 *   --exit-code <n> [--issue <n>]`: the draft pull request, from what
 *   `typings:generate <tag>` printed and its exit code; `--issue` is the
 *   issue it closes (a dry run has none).
 *
 * Both take `--run-url <url>`, the workflow run to link. Relative paths
 * resolve against the folder the command was started from. Exit codes: 0
 * printed, 1 a file cannot be read or the plan has no new Patch, 2 usage.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  readReportedPlan,
  renderIssue,
  renderPullRequest,
  type Report,
} from "../patch-watch-report.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: patch-watch:report issue --plan <file> [--run-url <url>]\n" +
  "       patch-watch:report pull-request --plan <file> --stdout <file> --stderr <file> --exit-code <n> [--issue <n>] [--run-url <url>]\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
}

/** The options each command takes, the required ones first. */
const COMMANDS = {
  issue: { required: ["--plan"], optional: ["--run-url"] },
  "pull-request": {
    required: ["--plan", "--stdout", "--stderr", "--exit-code"],
    optional: ["--issue", "--run-url"],
  },
} as const;

type Command = keyof typeof COMMANDS;

/** A whole number, as the options `--exit-code` and `--issue` take. */
const INTEGER = /^\d+$/;

/** The command and its options; `undefined` on a usage error. */
function parseArgs(
  args: readonly string[],
): { command: Command; options: Map<string, string> } | undefined {
  const [command, ...rest] = args;
  if (command !== "issue" && command !== "pull-request") return undefined;
  const { required, optional } = COMMANDS[command];
  const known: readonly string[] = [...required, ...optional];
  const options = new Map<string, string>();
  for (let i = 0; i < rest.length; i += 2) {
    const option = rest[i];
    const value = rest.at(i + 1);
    if (!known.includes(option) || options.has(option)) return undefined;
    if (value === undefined || value === "") return undefined;
    options.set(option, value);
  }
  if (!required.every((option) => options.has(option))) return undefined;
  for (const option of ["--exit-code", "--issue"]) {
    const value = options.get(option);
    if (value !== undefined && !INTEGER.test(value)) return undefined;
  }
  return { command, options };
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
  },
): Promise<number> {
  const parsed = parseArgs(args);
  if (parsed === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const { command, options } = parsed;
  const read = (option: string) =>
    readFile(resolve(context.cwd, options.get(option) ?? ""), "utf8");
  const runUrl = options.get("--run-url");

  let report: Report;
  try {
    const plan = readReportedPlan(await read("--plan"));
    if (command === "issue") {
      report = renderIssue({
        plan,
        ...(runUrl === undefined ? {} : { runUrl }),
      });
    } else {
      const issue = options.get("--issue");
      report = renderPullRequest({
        plan,
        issue: issue === undefined ? null : Number(issue),
        run: {
          stdout: await read("--stdout"),
          stderr: await read("--stderr"),
          exitCode: Number(options.get("--exit-code")),
        },
        ...(runUrl === undefined ? {} : { runUrl }),
      });
    }
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  output.stdout(`${JSON.stringify(report)}\n`);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
