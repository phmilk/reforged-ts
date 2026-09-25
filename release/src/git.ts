/**
 * What the release scripts ask git, and the git commands they run. Every
 * question goes through a `Git` function and every command through a
 * `GitRunner`, so a test answers them without a repository or a network.
 */
import { execFile } from "node:child_process";
import { runInherited } from "./process.js";

/** Runs git with `args` and resolves with its stdout; rejects on failure. */
export type Git = (args: readonly string[]) => Promise<string>;

/** A git command and the environment variables it adds. */
export interface GitCommand {
  args: readonly string[];
  env: Readonly<Record<string, string>>;
}

/**
 * Runs git to completion and resolves with its exit code, for a command
 * whose exit code is the answer (`ls-remote --exit-code`) or whose output
 * belongs in the job log (`clone`), where a `Git` would only reject.
 */
export type GitRunner = (command: GitCommand) => Promise<number>;

/** A `GitRunner` with the process's standard streams. */
export const runGit: GitRunner = ({ args, env }) =>
  runInherited({ command: "git", args, env });

/** A `Git` that runs the git executable in the folder `cwd`. */
export function gitIn(cwd: string): Git {
  return (args) =>
    new Promise((resolve, reject) => {
      execFile(
        "git",
        [...args],
        { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            const detail = stderr.trim();
            reject(
              new Error(
                `git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`,
                { cause: error },
              ),
            );
          } else {
            resolve(stdout);
          }
        },
      );
    });
}

/** The branch releases are cut from. */
export const MAIN_BRANCH = "master";

/**
 * The base ref a pull request is compared with when none is given: the main
 * branch, or its remote-tracking branch in a clone without a local one (a
 * CI checkout).
 */
export async function defaultBase(git: Git): Promise<string> {
  for (const ref of [MAIN_BRANCH, `origin/${MAIN_BRANCH}`]) {
    try {
      await git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
      return ref;
    } catch {
      // Try the next one.
    }
  }
  throw new Error(
    `Neither ${MAIN_BRANCH} nor origin/${MAIN_BRANCH} exists; name the base ref.`,
  );
}

/** How a file changed: git's status letter (`A`, `M`, `D`, `T`). */
export interface FileChange {
  status: string;
  /** `/`-separated, relative to the repository root. */
  path: string;
}

/**
 * The files `HEAD` changed since its merge base with `base`, in git's order.
 * Renames are split into a deletion and an addition, so both paths count.
 */
export async function changesSince(
  git: Git,
  base: string,
): Promise<FileChange[]> {
  const out = await git([
    "diff",
    "--name-status",
    "--no-renames",
    "-z",
    `${base}...HEAD`,
  ]);
  const fields = out.split("\0");
  const changes: FileChange[] = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    changes.push({ status: fields[i], path: fields[i + 1] });
  }
  return changes;
}
