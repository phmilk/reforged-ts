/**
 * The answers the binary gathers before `create`: each one given as an
 * argument, asked for when standard input is a terminal, or defaulted. A
 * missing answer without a terminal is an error naming its option, so an
 * Agent or a CI job never waits on a prompt. `create` takes the result and
 * asks nothing.
 */
import { builtinModules } from "node:module";
import { createInterface } from "node:readline/promises";
import { defaultProjectName, type Answers } from "./create.js";

/** The answers as the arguments give them, any of the three absent. */
export interface GivenAnswers {
  folder?: string;
  name?: string;
  description?: string;
  /** Accept every default without asking: only the folder, which has none, is asked. */
  yes: boolean;
  skipInstall: boolean;
  skipGit: boolean;
}

/**
 * Asks `question` and resolves with the line typed, or `undefined` when the
 * author ends the input (Ctrl+C or Ctrl+D).
 */
export type Ask = (question: string) => Promise<string | undefined>;

/** Where the answers not given come from. */
export interface Prompts {
  /** Whether standard input is a terminal: nothing is asked when it is not. */
  interactive: boolean;
  ask: Ask;
  /** Prints a line for the author, without its line break, such as why an answer is refused. */
  print: (line: string) => void;
}

export type GatherResult =
  | { ok: true; answers: Answers }
  | {
      ok: false;
      /** `usage` for an answer missing or refused, `cancelled` when the author ends the input. */
      reason: "usage" | "cancelled";
      message: string;
    };

/** Why nothing is asked, for the messages of a missing answer. */
const NO_TERMINAL = "standard input is not a terminal, so nothing is asked";

/**
 * The answers of `given`, the missing ones asked for when `prompts` is
 * interactive: the folder, until one is typed; the project name, the
 * folder's base name when left blank, asked again with the reason while it
 * is not a valid npm package name; the description, none when left blank.
 * With `yes`, or without a terminal, the name and the description take
 * their defaults; without a terminal a missing folder, or a name that is
 * not a valid package name, refuses the answers naming its option.
 */
export async function gatherAnswers(
  given: GivenAnswers,
  prompts: Prompts,
): Promise<GatherResult> {
  const { interactive, ask, print } = prompts;
  const cancelled: GatherResult = {
    ok: false,
    reason: "cancelled",
    message: "Cancelled: nothing was created.",
  };
  const answers = (folder: string, name: string, description?: string) => ({
    ok: true as const,
    answers: {
      folder,
      name,
      description,
      skipInstall: given.skipInstall,
      skipGit: given.skipGit,
    },
  });

  let folder = given.folder;
  if (folder === undefined) {
    if (!interactive) {
      return {
        ok: false,
        reason: "usage",
        message: `The folder is missing: pass it as the first argument, <folder> (${NO_TERMINAL}).`,
      };
    }
    while (folder === undefined) {
      const typed = await ask("Folder of the new Map project: ");
      if (typed === undefined) return cancelled;
      if (typed.trim() !== "") folder = typed.trim();
    }
  }

  const fallback = defaultProjectName(folder);
  if (given.name !== undefined) {
    const problem = packageNameProblem(given.name);
    if (problem !== undefined) {
      return {
        ok: false,
        reason: "usage",
        message: `The project name ${JSON.stringify(given.name)} of --name is not a valid npm package name: ${problem}.`,
      };
    }
  }
  let name = given.name;
  if (name === undefined && (!interactive || given.yes)) {
    const problem = packageNameProblem(fallback);
    if (problem !== undefined) {
      return {
        ok: false,
        reason: "usage",
        message: `The project name ${JSON.stringify(fallback)}, the folder's base name, is not a valid npm package name: ${problem}. Pass one with --name.`,
      };
    }
    name = fallback;
  }
  while (name === undefined) {
    const typed = await ask(`Project name (${fallback}): `);
    if (typed === undefined) return cancelled;
    const candidate = typed.trim() === "" ? fallback : typed.trim();
    const problem = packageNameProblem(candidate);
    if (problem === undefined) name = candidate;
    else {
      print(
        `${JSON.stringify(candidate)} is not a valid npm package name: ${problem}.`,
      );
    }
  }

  let description = given.description;
  if (description === undefined && interactive && !given.yes) {
    const typed = await ask("A one-line description of the map (optional): ");
    if (typed === undefined) return cancelled;
    if (typed.trim() !== "") description = typed.trim();
  }
  return answers(folder, name, description);
}

/** The names npm refuses whatever their characters. */
const RESERVED_NAMES = new Set(["node_modules", "favicon.ico"]);

/** The longest name npm takes. */
const MAX_NAME_LENGTH = 214;

/**
 * Why npm would refuse `name` as the name of a new package, or `undefined`
 * when it takes it: the rules of npm's `validate-npm-package-name`, its
 * warnings included, since a new package must pass those too.
 */
export function packageNameProblem(name: string): string | undefined {
  if (name.length === 0) return "it is empty";
  if (name.trim() !== name) {
    return "it starts or ends with a space";
  }
  if (name.startsWith(".")) return "it starts with a period";
  if (name.startsWith("_")) return "it starts with an underscore";
  if (RESERVED_NAMES.has(name.toLowerCase())) return "npm reserves it";
  if (builtinModules.includes(name)) return "it is the name of a Node module";
  if (name.length > MAX_NAME_LENGTH) {
    return `it is longer than ${String(MAX_NAME_LENGTH)} characters`;
  }
  if (name.toLowerCase() !== name) return "it has capital letters";
  // `@scope/base`, or `base` alone.
  const slash = name.indexOf("/");
  const parts = name.startsWith("@")
    ? [name.slice(1, slash === -1 ? 1 : slash), name.slice(slash + 1)]
    : [name];
  const base = parts[parts.length - 1];
  const urlSafe = parts.every(
    (part) => part !== "" && encodeURIComponent(part) === part,
  );
  if (!urlSafe) {
    return "it has characters a URL does not take as they are (only letters, digits, - . _ ~ and one @scope/ prefix)";
  }
  if (/[~'!()*]/.test(base)) {
    return "it has one of the characters ~'!()*";
  }
  return undefined;
}

/**
 * Asks `question` on the terminal, through Node's `readline`: the line
 * typed, or `undefined` when the input ends or the author presses Ctrl+C.
 */
export async function askTerminal(
  question: string,
): Promise<string | undefined> {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const aborted = new AbortController();
  terminal.on("SIGINT", () => {
    aborted.abort();
  });
  terminal.on("close", () => {
    aborted.abort();
  });
  try {
    return await terminal.question(question, { signal: aborted.signal });
  } catch (error) {
    if (aborted.signal.aborted) {
      process.stdout.write("\n");
      return undefined;
    }
    throw error;
  } finally {
    terminal.close();
  }
}
