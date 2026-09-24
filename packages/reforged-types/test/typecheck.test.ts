/**
 * The type-check the package build runs over its own output
 * (`tsconfig.typings.json`): the committed entry, the files it references and
 * the common.ai output, against lua-types/5.3. Also the hand-written Lua
 * runtime file, which declares FourCC and __jarray and nothing else.
 */
import { readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const TYPINGS_CONFIG = join(packageRoot, "tsconfig.typings.json");

/**
 * The diagnostics of the typings type-check, with `replace` substituting the
 * text of some files (by path relative to the package root).
 */
function typecheck(replace: Record<string, string> = {}): ts.Diagnostic[] {
  const config = ts.getParsedCommandLineOfConfigFile(
    TYPINGS_CONFIG,
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
  )!;
  expect(config.errors).toEqual([]);
  const replaced = new Map(
    Object.entries(replace).map(([path, text]) => [
      resolve(packageRoot, path).toLowerCase(),
      text,
    ]),
  );
  const host = ts.createCompilerHost(config.options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) => {
    const text = replaced.get(resolve(fileName).toLowerCase());
    return text === undefined
      ? getSourceFile(fileName, languageVersion, ...rest)
      : ts.createSourceFile(fileName, text, languageVersion);
  };
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    host,
  });
  return [...ts.getPreEmitDiagnostics(program)];
}

function format(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => packageRoot,
    getNewLine: () => "\n",
  });
}

describe("the typings type-check", () => {
  it("checks the entry and the common.ai output, not skipping declaration files", () => {
    const config = ts.getParsedCommandLineOfConfigFile(
      TYPINGS_CONFIG,
      {},
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
    )!;

    expect(
      config.fileNames.map((name) =>
        relative(packageRoot, name).replace(/\\/g, "/"),
      ),
    ).toEqual(["3.0.0.d.ts", "3.0.0/common.ai.d.ts"]);
    expect(config.options.noEmit).toBe(true);
    expect(config.options.skipLibCheck).toBeFalsy();
  });

  it("passes on the committed output, with lua-types/5.3 in the program", () => {
    const diagnostics = typecheck();

    expect(format(diagnostics)).toBe("");
  }, 60_000);

  it("fails when a generated file is broken", async () => {
    const path = "3.0.0/common.j.d.ts";
    const text = await readFile(join(packageRoot, path), "utf8");

    const diagnostics = typecheck({
      [path]: text + "declare function Broken(): notahandle;\n",
    });

    expect(diagnostics.map((d) => d.code)).toEqual([2304]);
    expect(diagnostics[0].file!.fileName).toMatch(/3\.0\.0\/common\.j\.d\.ts$/);
  }, 60_000);
});

describe("the Lua runtime file", () => {
  it("declares FourCC and __jarray and nothing else", async () => {
    const text = await readFile(join(packageRoot, "lua-runtime.d.ts"), "utf8");
    const file = ts.createSourceFile(
      "lua-runtime.d.ts",
      text,
      ts.ScriptTarget.Latest,
    );
    const printer = ts.createPrinter({ removeComments: true });

    const declarations = file.statements.map((statement) =>
      printer.printNode(ts.EmitHint.Unspecified, statement, file),
    );

    expect(text.startsWith("/** @noSelfInFile */\n")).toBe(true);
    expect(declarations).toEqual([
      "declare function FourCC(id: string): number;",
      "declare function __jarray<T>(defaultValue: T): Record<number, T>;",
    ]);
  });
});
