#!/usr/bin/env node
// The package's command, `create-reforged-map <folder> --template <archive
// or folder>`: a thin shell over `create` (src/create.ts), which does every
// stage. It reads the arguments, makes the Template source and runs the
// commands as processes.

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { create } from "./create.js";
import { runInherited, type Runner } from "./process.js";
import { localTemplate } from "./template.js";

export const USAGE =
  "Usage: create-reforged-map <folder> --template <archive or folder> [--skip-install] [--skip-git]";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface Context {
  run: Runner;
}

interface Options {
  folder: string;
  template: string;
  skipInstall: boolean;
  skipGit: boolean;
}

/**
 * Runs the command with `args`, the arguments after the program's name, and
 * resolves with its exit code: 0 when the project is created, 1 when the
 * creation stops, 2 on arguments it does not take.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { run: runInherited },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(`${USAGE}\n`);
    return 2;
  }
  const result = await create({
    answers: {
      folder: options.folder,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit,
    },
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

/**
 * The options of `args`: one folder, `--template` with its value, and each
 * flag at most once; `undefined` on anything else.
 */
function parseArgs(args: readonly string[]): Options | undefined {
  let folder: string | undefined;
  let template: string | undefined;
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--template") {
      const value = args.at(i + 1);
      if (template !== undefined || value === undefined || value === "") {
        return undefined;
      }
      if (value.startsWith("--")) return undefined;
      template = value;
      i++;
    } else if (arg === "--skip-install" || arg === "--skip-git") {
      if (flags.has(arg)) return undefined;
      flags.add(arg);
    } else if (arg.startsWith("-") || arg === "" || folder !== undefined) {
      return undefined;
    } else {
      folder = arg;
    }
  }
  if (folder === undefined || template === undefined) return undefined;
  return {
    folder,
    template,
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
