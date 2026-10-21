#!/usr/bin/env node
// The package's command, `create-reforged-map [<folder>] --template
// <archive or folder> [--name <name>] [--description <text>] [--yes]`: a
// thin shell over `create` (src/create.ts), which does every stage. It reads
// the arguments, asks for the answers they leave out (src/answers.ts), makes
// the Template source and runs the commands as processes.

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { askTerminal, gatherAnswers, type Ask } from "./answers.js";
import { create } from "./create.js";
import { runInherited, type Runner } from "./process.js";
import { localTemplate } from "./template.js";

export const USAGE =
  "Usage: create-reforged-map [<folder>] --template <archive or folder> [--name <name>] [--description <text>] [--yes] [--skip-install] [--skip-git]";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface Context {
  run: Runner;
  /**
   * Whether standard input is a terminal: the answers the arguments leave
   * out are asked only then, and are an error naming their option else.
   */
  interactive: boolean;
  ask: Ask;
}

interface Options {
  folder?: string;
  template: string;
  name?: string;
  description?: string;
  yes: boolean;
  skipInstall: boolean;
  skipGit: boolean;
}

/**
 * Runs the command with `args`, the arguments after the program's name, and
 * resolves with its exit code: 0 when the project is created, 1 when the
 * creation stops or the author cancels a prompt, 2 on arguments it does not
 * take, an answer missing without a terminal among them.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    run: runInherited,
    interactive: process.stdin.isTTY,
    ask: askTerminal,
  },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(`${USAGE}\n`);
    return 2;
  }
  const gathered = await gatherAnswers(options, {
    interactive: context.interactive,
    ask: context.ask,
    print: (line) => {
      output.stderr(`${line}\n`);
    },
  });
  if (!gathered.ok) {
    output.stderr(`${gathered.message}\n`);
    return gathered.reason === "usage" ? 2 : 1;
  }
  const result = await create({
    answers: gathered.answers,
    template: localTemplate(options.template),
    run: context.run,
    print: (line) => {
      output.stdout(`${line}\n`);
    },
  });
  if (result.ok) return 0;
  output.stderr(`${result.message}\n`);
  return 1;
}

/** The options that take a value. */
const VALUE_OPTIONS = ["--template", "--name", "--description"] as const;

type ValueOption = (typeof VALUE_OPTIONS)[number];

/** The options that take none. */
const FLAGS: readonly string[] = ["--yes", "--skip-install", "--skip-git"];

/**
 * The options of `args`: at most one folder, `--template` with its value,
 * `--name` and `--description` with theirs, the flags, and each option at
 * most once; `undefined` on anything else.
 */
function parseArgs(args: readonly string[]): Options | undefined {
  let folder: string | undefined;
  const values = new Map<ValueOption, string>();
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const option = VALUE_OPTIONS.find((name) => name === arg);
    if (option !== undefined) {
      const value = args.at(i + 1);
      if (values.has(option) || value === undefined || value === "") {
        return undefined;
      }
      if (value.startsWith("--")) return undefined;
      values.set(option, value);
      i++;
    } else if (FLAGS.includes(arg)) {
      if (flags.has(arg)) return undefined;
      flags.add(arg);
    } else if (arg.startsWith("-") || arg === "" || folder !== undefined) {
      return undefined;
    } else {
      folder = arg;
    }
  }
  const template = values.get("--template");
  if (template === undefined) return undefined;
  return {
    folder,
    template,
    name: values.get("--name"),
    description: values.get("--description"),
    yes: flags.has("--yes"),
    skipInstall: flags.has("--skip-install"),
    skipGit: flags.has("--skip-git"),
  };
}

/**
 * Whether this module is the script Node was started with, through the
 * link a package manager puts on the `PATH` too.
 */
function invokedDirectly(): boolean {
  const script = process.argv.at(1);
  if (script === undefined) return false;
  try {
    return (
      realpathSync(script) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  process.exitCode = await main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
}
