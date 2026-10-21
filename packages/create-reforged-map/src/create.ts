/**
 * Creating a Map project from the Template, every stage in order: the
 * checks, the Template written into a temporary folder next to the target,
 * the move into place, then git, the install, the Template's own
 * `template:detach` and the first commit. The CLI is a thin shell over it.
 */
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { commandLine, type Command, type Runner } from "./process.js";
import type { TemplateSource } from "./template.js";

/** What the author chose. */
export interface Answers {
  /**
   * The new Map project's folder, as the author gave it: absolute, or
   * relative to the working folder. It does not exist, or is empty.
   */
  folder: string;
  /** Leave `pnpm install` out: the author installs later. */
  skipInstall: boolean;
  /** Leave git out: no repository, no commit. */
  skipGit: boolean;
}

export interface CreateInput {
  answers: Answers;
  template: TemplateSource;
  run: Runner;
  /** Prints one line for the author, without its line break. */
  print: (line: string) => void;
}

/** A stage of the creation, as a failure names it. */
export type Stage =
  "check" | "template" | "move" | "git" | "install" | "detach" | "commit";

export type CreateResult =
  | {
      ok: true;
      /** The Map project's folder, absolute. */
      folder: string;
      /** Whether the first commit was made; `false` when git was skipped or has no identity. */
      committed: boolean;
    }
  | { ok: false; stage: Stage; message: string };

/** The message of the Map project's first commit. */
export const COMMIT_MESSAGE = "chore: create the Map project from the Template";

/** The Template's script that removes its maintenance files. */
export const DETACH_SCRIPT = "template:detach";

/**
 * What pnpm's commands add to the environment: pnpm switches to the version
 * the Template's `packageManager` pins, which `pnpm create` turns off in the
 * environment of the program it runs.
 */
const PNPM_ENV = { npm_config_manage_package_manager_versions: "true" };

const STAGE_NAMES: Record<Stage, string> = {
  check: "the checks",
  template: "writing the Template",
  move: "the move into place",
  git: "git init",
  install: "the install",
  detach: "the detach",
  commit: "the first commit",
};

const TOOLS = [
  {
    name: "pnpm",
    missing:
      "pnpm does not run here. Install it (https://pnpm.io/installation), then create the project again.",
  },
  {
    name: "git",
    missing:
      "git does not run here. Install it (https://git-scm.com/downloads), or create the project without git (--skip-git).",
  },
] as const;

/** A command of the stages after the move, run in the new project. */
interface Step {
  stage: Stage;
  /** What it does, for the line printed as it starts. */
  label: string;
  command: Command;
  /** Whether it makes the commit, which needs git to have an identity. */
  commits?: boolean;
}

/**
 * Creates a Map project in `answers.folder` from `template`. Everything that
 * can refuse the creation is checked before any write: the folder does not
 * exist or is empty; `pnpm` runs, and `git` unless skipped. The Template is
 * written into a temporary folder next to the target and moved into place
 * once it is read, so a failure before the move leaves nothing in the
 * target. A failure after it leaves the folder and names the stage and the
 * commands to finish by hand. `template:detach` runs whatever is skipped.
 * When git has no identity, the files stay staged, the commands to commit
 * are printed, and the creation still succeeds.
 */
export async function create(input: CreateInput): Promise<CreateResult> {
  const { answers, template, run, print } = input;
  const folder = resolve(answers.folder);
  const fail = (stage: Stage, reason: string): CreateResult => ({
    ok: false,
    stage,
    message: `The creation stopped at ${STAGE_NAMES[stage]}: ${reason}`,
  });

  print(`Checking the folder, pnpm${answers.skipGit ? "" : " and git"}`);
  const refusal = await folderRefusal(folder, answers.folder);
  if (refusal !== undefined) return fail("check", refusal);
  for (const tool of TOOLS) {
    if (tool.name === "git" && answers.skipGit) continue;
    const command = { command: tool.name, args: ["--version"], quiet: true };
    if ((await exitCode(run, command)) !== 0) {
      return fail("check", tool.missing);
    }
  }

  print(`Writing the Template from ${template.description}`);
  const parent = dirname(folder);
  let createdParent: string | undefined;
  let staging: string | undefined;
  try {
    createdParent = await mkdir(parent, { recursive: true });
    staging = await mkdtemp(join(parent, `.${basename(folder)}-`));
    await template.write(staging);
    await readTemplate(staging);
  } catch (error) {
    await removeAll(staging, createdParent);
    return fail("template", errorMessage(error));
  }

  print(`Moving it into ${answers.folder}`);
  try {
    await moveInto(staging, folder);
  } catch (error) {
    await removeAll(staging);
    return fail("move", errorMessage(error));
  }

  const steps = projectSteps(answers, folder);
  for (const [index, step] of steps.entries()) {
    if (step.commits === true && !(await hasIdentity(run, folder))) {
      printIdentityHelp(print, steps.slice(index));
      printNextSteps(print, answers, await mapFolders(folder));
      return { ok: true, folder, committed: false };
    }
    print(`${step.label}: ${commandLine(step.command)}`);
    let reason: string;
    try {
      const code = await run(step.command);
      if (code === 0) continue;
      reason = `\`${commandLine(step.command)}\` failed with exit code ${String(code)}.`;
    } catch (error) {
      reason = `\`${commandLine(step.command)}\` did not start: ${errorMessage(error)}`;
    }
    return fail(
      step.stage,
      [
        `${reason} The project is in ${folder}; to finish it by hand, run there:`,
        ...steps.slice(index).map(({ command }) => `  ${commandLine(command)}`),
      ].join("\n"),
    );
  }

  printNextSteps(print, answers, await mapFolders(folder));
  return { ok: true, folder, committed: !answers.skipGit };
}

/**
 * Why `folder` cannot hold a new project (`given` is how the author wrote
 * it), or `undefined` when it does not exist or is an empty folder.
 */
async function folderRefusal(
  folder: string,
  given: string,
): Promise<string | undefined> {
  const found = await stat(folder).catch(() => null);
  if (found === null) return undefined;
  if (!found.isDirectory()) return `${given} exists and is not a folder.`;
  if ((await readdir(folder)).length > 0) {
    return `${given} exists and is not empty: choose another folder, or empty this one.`;
  }
  return undefined;
}

/** The exit code of `command`, or `undefined` when it cannot start. */
async function exitCode(
  run: Runner,
  command: Command,
): Promise<number | undefined> {
  try {
    return await run(command);
  } catch {
    return undefined;
  }
}

/**
 * Reads the Template written into `folder`; throws when it is not one: its
 * `package.json` must name the `template:detach` script.
 */
async function readTemplate(folder: string): Promise<void> {
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(join(folder, "package.json"), "utf8"));
  } catch (error) {
    throw new Error("the Template has no readable package.json.", {
      cause: error,
    });
  }
  const scripts =
    typeof manifest === "object" && manifest !== null && "scripts" in manifest
      ? manifest.scripts
      : undefined;
  if (
    typeof scripts !== "object" ||
    scripts === null ||
    !(DETACH_SCRIPT in scripts)
  ) {
    throw new Error(
      `the Template's package.json has no \`${DETACH_SCRIPT}\` script, which removes its maintenance files.`,
    );
  }
}

/**
 * Moves the folder `staging` to `folder`: a rename when `folder` does not
 * exist, else a rename of each of its entries, so an empty folder the
 * author is in stays the same folder.
 */
async function moveInto(staging: string, folder: string): Promise<void> {
  const found = await stat(folder).catch(() => null);
  if (found === null) {
    await rename(staging, folder);
    return;
  }
  // Written between the check and now: refuse rather than mix.
  if ((await readdir(folder)).length > 0) {
    throw new Error(`${folder} is no longer empty.`);
  }
  for (const entry of await readdir(staging)) {
    await rename(join(staging, entry), join(folder, entry));
  }
  await rm(staging, { recursive: true });
}

/** Removes the folders that exist of `folders`, with what they hold. */
async function removeAll(...folders: (string | undefined)[]): Promise<void> {
  for (const folder of folders) {
    if (folder !== undefined)
      await rm(folder, { recursive: true, force: true });
  }
}

/** The commands run in the new project, in order, without the skipped ones. */
function projectSteps(answers: Answers, folder: string): Step[] {
  const git = (...args: string[]): Command => ({
    command: "git",
    args,
    cwd: folder,
  });
  const pnpm = (...args: string[]): Command => ({
    command: "pnpm",
    args,
    cwd: folder,
    env: PNPM_ENV,
  });
  const steps: Step[] = [];
  if (!answers.skipGit) {
    steps.push({
      stage: "git",
      label: "Initialising git",
      command: git("init"),
    });
  }
  if (!answers.skipInstall) {
    steps.push({
      stage: "install",
      label: "Installing the dependencies",
      command: pnpm("install"),
    });
  }
  steps.push({
    stage: "detach",
    label: "Removing the Template maintenance",
    command: pnpm(DETACH_SCRIPT),
  });
  if (!answers.skipGit) {
    steps.push(
      {
        stage: "commit",
        label: "Staging the files",
        command: git("add", "--all"),
      },
      {
        stage: "commit",
        label: "Committing",
        command: git("commit", "--quiet", "--message", COMMIT_MESSAGE),
        commits: true,
      },
    );
  }
  return steps;
}

/**
 * Whether git has an author and a committer for a commit in `folder`:
 * `git var` refuses an identity exactly when `git commit` does.
 */
async function hasIdentity(run: Runner, folder: string): Promise<boolean> {
  for (const variable of ["GIT_AUTHOR_IDENT", "GIT_COMMITTER_IDENT"]) {
    const command = { command: "git", args: ["var", variable], cwd: folder };
    if ((await exitCode(run, { ...command, quiet: true })) !== 0) return false;
  }
  return true;
}

function printIdentityHelp(
  print: (line: string) => void,
  remaining: readonly Step[],
): void {
  print("");
  print(
    "git has no identity yet, so the files are staged but not committed. Set one, then commit:",
  );
  print('  git config --global user.name "Your Name"');
  print('  git config --global user.email "you@example.com"');
  for (const { command } of remaining) print(`  ${commandLine(command)}`);
}

/** The map folders under `maps/` of the project in `folder`. */
async function mapFolders(folder: string): Promise<string[]> {
  const entries = await readdir(join(folder, "maps")).catch(() => []);
  return entries
    .filter((entry) => /\.w3[mx]$/i.test(entry))
    .sort()
    .map((entry) => `maps/${entry}`);
}

function printNextSteps(
  print: (line: string) => void,
  answers: Answers,
  maps: readonly string[],
): void {
  print("");
  print(`Created the Map project in ${answers.folder}. Next steps:`);
  if (relative(process.cwd(), resolve(answers.folder)) !== "") {
    print(`  cd ${answers.folder}`);
  }
  if (answers.skipInstall) print("  pnpm install");
  print(
    `  open ${maps.length === 1 ? maps[0] : "the map folder under maps/"} in the World Editor`,
  );
  print("  pnpm build");
  print("  pnpm test:map");
}

/** The message of a caught error, or the thrown value as text. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
