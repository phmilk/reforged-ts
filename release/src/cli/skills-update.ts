/**
 * `skills:update`: updates the Upstream skills to upstream's current files.
 * It reads the skills upstream's plugin ships (its
 * `.claude-plugin/plugin.json`), removes each skill of `skills-lock.json`
 * the plugin no longer ships, installs the plugin's with the command of
 * docs/agents/development-loop.md ("Installing and updating the Upstream
 * skills"), and rewrites that command when the set of names changed. Then
 * it prints what moved in the lock and the Skill variants left to review.
 * `--report <file>` writes it as JSON for the weekly skills workflow, with
 * the pull request to open; `--run-url <url>` names the run in that pull
 * request. Commit the folders with the lock and the doc. Exit codes: 0
 * updated or nothing moved, 1 the plugin (a path or a name of another
 * shape), a skills CLI run or the lock (a skill outside upstream's
 * engineering and productivity folders) failed, 2 usage.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { byCodePoint } from "../order.js";
import type { Report } from "../patch-watch-report.js";
import { runInherited, type Command, type Runner } from "../process.js";
import {
  docSkillNames,
  fetchPluginSkills,
  INSTALL_ENV,
  installArgs,
  lockChanges,
  LOCK_FILE,
  misplacedSkills,
  readLock,
  removeArgs,
  SETUP_DOC,
  SKILLS_CLI,
  staleVariants,
  updatePullRequest,
  withDocCommand,
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
  /** Reads upstream's plugin manifest. */
  fetcher: typeof fetch;
}

/** The JSON `--report` writes. */
export interface UpdateReport {
  /** Whether upstream moved: the lock changed. */
  moved: boolean;
  changes: LockChange[];
  stale: StaleVariant[];
  /** Whether the setup doc's command was rewritten: the set of names changed. */
  docUpdated: boolean;
  /** The plugin's paths outside upstream's engineering and productivity folders. */
  ignored: string[];
  pullRequest: Report;
}

/** `npx`, through a shell on Windows, whose `npx.cmd` needs one. */
export const runNpx: Runner = (command) =>
  runInherited(command, { shell: process.platform === "win32" });

const sameNames = (a: readonly string[], b: readonly string[]): boolean =>
  JSON.stringify(a.toSorted(byCodePoint)) ===
  JSON.stringify(b.toSorted(byCodePoint));

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, run: runNpx, fetcher: fetch },
): Promise<number> {
  const options = parseOptions(args, ["--report", "--run-url"], []);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  /** Runs the skills CLI with `cliArgs` from the root; throws on a failure. */
  const skillsCli = async (cliArgs: string[]): Promise<void> => {
    const command: Command = {
      command: "npx",
      args: ["--yes", SKILLS_CLI, ...cliArgs],
      cwd: context.root,
      env: INSTALL_ENV,
    };
    const code = await context.run(command);
    if (code !== 0) {
      throw new Error(
        `npx ${SKILLS_CLI} ${cliArgs[0] ?? ""} exited with ${String(code)}.`,
      );
    }
  };

  let report: UpdateReport;
  try {
    const lockPath = join(context.root, LOCK_FILE);
    const before = readLock(await readFile(lockPath, "utf8"));
    const { names, ignored } = await fetchPluginSkills(context.fetcher);
    const dropped = Object.keys(before).filter((name) => !names.includes(name));
    if (dropped.length > 0) await skillsCli(removeArgs(dropped));
    await skillsCli(installArgs(names));
    const after = readLock(await readFile(lockPath, "utf8"));
    const misplaced = misplacedSkills(after);
    if (misplaced.length > 0) {
      throw new Error(
        `${LOCK_FILE} names skills outside upstream's engineering and productivity folders after the install: ${misplaced.join(", ")}. Nothing is opened; see ${SETUP_DOC}, "Installing and updating the Upstream skills".`,
      );
    }

    const docPath = join(context.root, SETUP_DOC);
    const doc = await readFile(docPath, "utf8");
    const documented = docSkillNames(doc);
    if (documented === undefined) {
      throw new Error(
        `${SETUP_DOC} has no install command to keep: its "Installing and updating the Upstream skills" section lost its sh block.`,
      );
    }
    const docUpdated = !sameNames(documented, names);
    if (docUpdated) await writeFile(docPath, withDocCommand(doc, names));

    const changes = lockChanges(before, after);
    const stale = await staleVariants(context.root, after);
    report = {
      moved: changes.length > 0,
      changes,
      stale,
      docUpdated,
      ignored,
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
  if (report.docUpdated) {
    output.stdout(`The install command of ${SETUP_DOC} was rewritten.\n`);
  }
  for (const path of report.ignored) {
    output.stdout(
      `Left out: ${path}, which upstream's plugin ships from outside its engineering and productivity folders.\n`,
    );
  }
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
