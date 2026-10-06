// A throwaway Map project that type-checks the generated declarations as a
// Map project does: the fixture sources under test/fixtures/map-project
// copied to its src/, the generated declarations written next to them, and
// the workspace's reforged-types, reforged-ts and the typescript-to-lua
// language extensions linked into its node_modules. reforged-ts is read from
// its emitted declarations (dist/), so `pnpm build` runs first.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import * as ts from "typescript";
import { PACKAGE_ROOT, makeTempDir } from "./map-folder.js";
import type { GeneratedFile } from "../../src/index.js";

const fixturesRoot = path.join(PACKAGE_ROOT, "test", "fixtures", "map-project");

/** The `types` entries of a Map project (the Template's). */
const MAP_PROJECT_TYPES = [
  "reforged-types/3.0.0",
  "@typescript-to-lua/language-extensions",
];

/** What the Map project installs, linked from this package's installation. */
const LINKED_PACKAGES = [
  "reforged-types",
  "reforged-ts",
  "@typescript-to-lua/language-extensions",
];

/** The fixture files the Map project does not get: the editor's tsconfig, and the declarations the generated ones replace. */
export const FIXTURE_DECLARATIONS = "editor-globals.d.ts";
const NOT_COPIED = new Set(["tsconfig.json", FIXTURE_DECLARATIONS]);

/** The text of a committed fixture file. */
export function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesRoot, name), "utf8");
}

/**
 * A Map project in a new temporary directory, removed by `removeTemporary`:
 * the fixtures and `generated` in src/, a tsconfig.json in the shape of the
 * Template's. Returns the tsconfig's path.
 */
export function createMapProject(generated: readonly GeneratedFile[]): string {
  const dir = makeTempDir();
  const require = createRequire(path.join(PACKAGE_ROOT, "package.json"));
  for (const name of LINKED_PACKAGES) {
    const target = path.dirname(require.resolve(`${name}/package.json`));
    const link = path.join(dir, "node_modules", ...name.split("/"));
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(fs.realpathSync(target), link, "junction");
  }
  const library = path.join(
    dir,
    "node_modules",
    "reforged-ts",
    "dist",
    "index.d.ts",
  );
  if (!fs.existsSync(library)) {
    throw new Error(
      "reforged-ts has no emitted declarations: run `pnpm build` first.",
    );
  }

  const src = path.join(dir, "src");
  fs.mkdirSync(src);
  for (const name of fs.readdirSync(fixturesRoot)) {
    if (!NOT_COPIED.has(name)) {
      fs.copyFileSync(path.join(fixturesRoot, name), path.join(src, name));
    }
  }
  for (const file of generated) {
    fs.writeFileSync(path.join(src, file.name), file.contents);
  }

  const tsconfig = path.join(dir, "tsconfig.json");
  const config = {
    compilerOptions: {
      target: "ESNext",
      lib: ["ESNext"],
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      rootDir: "src",
      outDir: "dist",
      types: MAP_PROJECT_TYPES,
    },
    include: ["src"],
  };
  fs.writeFileSync(tsconfig, JSON.stringify(config, null, 2) + "\n");
  return tsconfig;
}

/**
 * The diagnostics of `tsc -p <tsconfig> --noEmit`, as
 * `src/<file>:<line> TS<code>`, with `/` separators, sorted; a diagnostic
 * without a file is `TS<code> <message>`.
 */
export function typecheck(tsconfig: string): string[] {
  const config = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    { noEmit: true },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (config === undefined) throw new Error(`${tsconfig} could not be read`);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  });
  const dir = path.dirname(tsconfig);
  return [...config.errors, ...ts.getPreEmitDiagnostics(program)]
    .map((diagnostic) => {
      const code = `TS${String(diagnostic.code)}`;
      if (diagnostic.file === undefined || diagnostic.start === undefined) {
        return `${code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
      }
      const file = path
        .relative(dir, path.resolve(diagnostic.file.fileName))
        .split(path.sep)
        .join("/");
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      return `${file}:${String(line + 1)} ${code}`;
    })
    .sort();
}
