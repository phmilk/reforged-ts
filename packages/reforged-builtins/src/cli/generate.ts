/**
 * `builtins:generate [--install <folder>] [--out <folder>]`: finds the
 * install (`../install.ts`), refuses one whose Build is not
 * `reforged-types`' `reforged.patch`, then writes the index and the
 * provenance file of its Game version, and the artefacts emitted from the
 * index, under `--out` (the package root by default). Prints the counts,
 * then the warnings; on any error it writes nothing, prints the errors and
 * exits 1. A bad argument exits 2. A leading `--`, which
 * `pnpm builtins:generate -- …` passes through, is skipped.
 *
 * `isWsl` and `invokedDirectly` mirror the Probe runner's
 * (`probe/src/machine.ts`, `probe/src/cli/common.ts`), as `parseBuildInfo`
 * mirrors its `.build.info` reader: the packages share no code, and
 * `test/probe-parity.test.ts` pins each pair to the same behaviour.
 */
import { readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { KIND_CONSTANTS, list } from "../emit.js";
import { generate, type Diagnostic } from "../generate.js";
import type { ObjectKind } from "../model.js";
import {
  findInstall,
  INSTALL_OPTION,
  InstallNotFoundError,
  type InstallMachine,
} from "../install.js";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** The package root, from `src/cli` in tests and `build/cli` when built. */
export const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

const USAGE = `Usage: builtins:generate [${INSTALL_OPTION} <folder>] [--out <folder>]\n`;

/** The real machine. */
export const systemMachine: InstallMachine = {
  platform: process.platform,
  wsl: isWsl(
    process.platform,
    process.env,
    statSync("/proc/version", { throwIfNoEntry: false })?.isFile()
      ? readFileSync("/proc/version", "utf8")
      : undefined,
  ),
  env: process.env,
  isFile: (file) =>
    statSync(file, { throwIfNoEntry: false })?.isFile() ?? false,
};

/** The Build of the Typings: `reforged-types`' `reforged.patch`. */
export function typingsBuild(): string {
  const manifest = createRequire(import.meta.url).resolve(
    "reforged-types/package.json",
  );
  const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
    reforged?: { patch?: unknown };
  };
  const patch = parsed.reforged?.patch;
  if (typeof patch !== "string")
    throw new Error(`${manifest} has no reforged.patch.`);
  return patch;
}

export interface Context {
  machine: InstallMachine;
  /** What a relative argument resolves against. */
  cwd: string;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    machine: systemMachine,
    // pnpm runs the script in the package folder; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
  },
): Promise<number> {
  let install: string | undefined;
  let outDir = packageRoot;
  for (let i = args[0] === "--" ? 1 : 0; i < args.length; i += 2) {
    const value = args.at(i + 1);
    if (value === undefined) {
      output.stderr(USAGE);
      return 2;
    }
    if (args[i] === INSTALL_OPTION) install = value;
    else if (args[i] === "--out") outDir = resolve(context.cwd, value);
    else {
      output.stderr(USAGE);
      return 2;
    }
  }

  let installDir: string;
  try {
    installDir = findInstall(install, context.cwd, context.machine);
  } catch (error) {
    if (!(error instanceof InstallNotFoundError)) throw error;
    output.stderr(`${error.message}\n`);
    return 1;
  }

  const result = await generate({ installDir, build: typingsBuild() });
  if (!result.ok) {
    output.stderr(
      `Generation failed. No file was written.\n\n${formatDiagnostics(result.diagnostics)}`,
    );
    return 1;
  }
  for (const [path, text] of result.files) {
    const target = join(outDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  const counts = list(
    Object.entries(result.counts).map(
      ([kind, count]) =>
        `${String(count)} ${count === 1 ? kind : KIND_CONSTANTS[kind as ObjectKind].entry}`,
    ),
  );
  const written = list([...result.files.keys()]);
  output.stdout(
    `Read the install at ${installDir} (Build ${result.build}): ${counts}.\nWrote ${written}.\n` +
      (result.diagnostics.length === 0
        ? ""
        : `\n${formatDiagnostics(result.diagnostics)}`),
  );
  return 0;
}

/** One line per diagnostic, errors first. */
export function formatDiagnostics(diagnostics: readonly Diagnostic[]): string {
  return [...diagnostics]
    .sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
    )
    .map((d) => `- ${d.severity}: ${d.message}\n`)
    .join("");
}

/** Whether Linux runs under WSL: its distribution variable, else `/proc/version`. */
export function isWsl(
  platform: NodeJS.Platform,
  env: Readonly<Record<string, string | undefined>>,
  procVersion: string | undefined,
): boolean {
  if (platform !== "linux") return false;
  if (env.WSL_DISTRO_NAME !== undefined && env.WSL_DISTRO_NAME !== "") {
    return true;
  }
  return /microsoft/i.test(procVersion ?? "");
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
