/**
 * `skills:update`: updates the Upstream skills to upstream's current files,
 * with the install command of docs/agents/development-loop.md ("Installing
 * and updating the Upstream skills"), then prints what moved in
 * `skills-lock.json` and the Skill variants left to review. `--report
 * <file>` writes it as JSON for the weekly skills workflow, with the pull
 * request to open; `--run-url <url>` names the run in that pull request.
 * Run from the repository root; commit the folders with the lock. Exit
 * codes: 0 updated or nothing moved, 1 the install or the lock failed, 2
 * usage.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInherited, type Runner } from "../process.js";
import {
  INSTALL_ARGS,
  INSTALL_ENV,
  lockChanges,
  LOCK_FILE,
  readLock,
  SKILLS_CLI,
  staleVariants,
  updatePullRequest,
  type LockChange,
  type StaleVariant,
} from "../skills-update.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: skills:update [--report <file>] [--run-url <url>]\n";

export interface Context {
  root: string;
  /** Runs the skills CLI. */
  run: Runner;
}

/** The JSON `--report` writes. */
export interface UpdateReport {
  /** Whether upstream moved: the lock changed. */
  moved: boolean;
  changes: LockChange[];
  stale: StaleVariant[];
  pullRequest: { title: string; body: string };
}

/** `npx`, through a shell on Windows, whose `npx.cmd` needs one. */
export const runNpx: Runner = (command) =>
  runInherited(command, { shell: process.platform === "win32" });

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, run: runNpx },
): Promise<number> {
  const options = parseOptions(args, ["--report", "--run-url"], []);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  let report: UpdateReport;
  try {
    const lockPath = join(context.root, LOCK_FILE);
    const before = readLock(await readFile(lockPath, "utf8"));
    const code = await context.run({
      command: "npx",
      args: ["--yes", SKILLS_CLI, ...INSTALL_ARGS],
      cwd: context.root,
      env: INSTALL_ENV,
    });
    if (code !== 0) {
      output.stderr(`npx ${SKILLS_CLI} add exited with ${String(code)}.\n`);
      return 1;
    }
    const after = readLock(await readFile(lockPath, "utf8"));
    const changes = lockChanges(before, after);
    const stale = await staleVariants(context.root, after);
    report = {
      moved: changes.length > 0,
      changes,
      stale,
      pullRequest: updatePullRequest(changes, stale, options["--run-url"]),
    };
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  output.stdout(
    report.moved
      ? `Upstream moved:\n${report.changes.map(({ name, change }) => `  ${name}: ${change}\n`).join("")}`
      : `Upstream has not moved: ${LOCK_FILE} is unchanged.\n`,
  );
  for (const { folder, upstream } of report.stale) {
    output.stdout(
      `Skill variant to review: ${folder}, built from ${upstream} at another version than the lock's.\n`,
    );
  }
  const file = options["--report"];
  if (file !== undefined) {
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
