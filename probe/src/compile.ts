import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { AuthorError } from "./errors.js";

const diagnosticsHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (f) => f,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => "\n",
};

/** One Lua bundle to compile: its entry, what it maps, where it goes. */
export interface BundleProject {
  /** The typescript-to-lua tsconfig whose options the compile takes. */
  tsconfig: string;
  /** The entry module: the only root file, run when the bundle runs. */
  entry: string;
  /** Module specifiers mapped to one file each, on top of the tsconfig's `paths`. */
  paths: Readonly<Record<string, string>>;
  /**
   * A folder holding every source file: typescript-to-lua names the
   * bundle's modules by their paths from it.
   */
  rootDir: string;
  /** The folder the bundle is written to, as `bundle.lua`. */
  outDir: string;
}

/** A compiled bundle: its file and its bytes. */
export interface Bundle {
  file: string;
  bytes: Uint8Array;
}

/**
 * Compiles `entry` and every module it imports into one Lua bundle, with the
 * tsconfig's options, and returns the bundle's bytes as written. The tsconfig
 * is only read; its `include` and `files` play no part. A tsconfig that does
 * not parse, or any error diagnostic, is an AuthorError of one line: the
 * first error, and how many others there are.
 */
export function compileBundle(project: BundleProject): Bundle {
  const parsed = tstl.parseConfigFileWithSystem(project.tsconfig);
  const configErrors = errorsOf(parsed.errors);
  if (configErrors.length > 0) {
    throw new AuthorError(
      `${path.basename(project.tsconfig)} could not be read: ${summary(configErrors)}`,
    );
  }
  const file = path.join(project.outDir, "bundle.lua");
  const options: tstl.CompilerOptions = {
    ...parsed.options,
    noEmit: false,
    rootDir: project.rootDir,
    outDir: project.outDir,
    luaBundle: file,
    luaBundleEntry: project.entry,
    paths: {
      ...parsed.options.paths,
      ...Object.fromEntries(
        Object.entries(project.paths).map(([specifier, target]) => [
          specifier,
          [pathsTarget(project.tsconfig, target)],
        ]),
      ),
    },
  };
  const result = tstl.transpileFiles([project.entry], options);
  const errors = errorsOf(result.diagnostics);
  if (errors.length > 0) {
    throw new AuthorError(`typescript-to-lua failed: ${summary(errors)}`);
  }
  if (result.emitSkipped || !fs.existsSync(file)) {
    throw new AuthorError(`typescript-to-lua wrote no bundle at ${file}.`);
  }
  return { file, bytes: new Uint8Array(fs.readFileSync(file)) };
}

/**
 * `target` as a `paths` target of the tsconfig: relative to its folder, where
 * TypeScript resolves `paths` without a baseUrl, and starting with `./` or
 * `../` as it requires. typescript-to-lua joins each target to that folder,
 * so an absolute one would not resolve.
 */
function pathsTarget(tsconfig: string, target: string): string {
  const relative = path
    .relative(path.dirname(path.resolve(tsconfig)), target)
    .split(path.sep)
    .join("/");
  return relative.startsWith("../") ? relative : `./${relative}`;
}

function errorsOf(diagnostics: readonly ts.Diagnostic[]): ts.Diagnostic[] {
  return diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
}

/** The first error on one line, and the count of the others; "" for none. */
function summary(errors: readonly ts.Diagnostic[]): string {
  const first = errors.at(0);
  if (first === undefined) return "";
  const text = ts
    .formatDiagnostic(first, diagnosticsHost)
    .replace(/\s*\n\s*/g, " ")
    .trim();
  const others = errors.length - 1;
  return others > 0
    ? `${text} (and ${String(others)} more error${others === 1 ? "" : "s"})`
    : text;
}
