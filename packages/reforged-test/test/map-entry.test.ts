import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

// Reads the declarations of reforged-test/map, as the runner's compile
// emits them, with the Typings and lua-types in `types` as a Map project's
// tsconfig has them, and checks what importing it makes visible to a test.

const entry = fileURLToPath(new URL("../map/index.d.ts", import.meta.url));

const program = ts.createProgram([entry], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  types: [
    "@typescript-to-lua/language-extensions",
    "lua-types/5.3",
    "reforged-types/3.0.1",
  ],
  lib: ["lib.esnext.d.ts"],
  strict: true,
  noEmit: true,
  // The runner's own compile type-checks the file; this reads its symbols.
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
if (source === undefined) throw new Error(`no ${entry}`);
const moduleSymbol = checker.getSymbolAtLocation(source);
if (moduleSymbol === undefined) throw new Error(`${entry} is not a module`);
// An export of another file of the entry point (natives.d.ts) is read as
// the declaration it names, as the editor's hover reads it.
const exported = checker
  .getExportsOfModule(moduleSymbol)
  .map((symbol) =>
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol,
  );

describe("reforged-test/map", () => {
  it("declares no __stub_* global", () => {
    const globals = checker
      .getSymbolsInScope(source, ts.SymbolFlags.Value | ts.SymbolFlags.Type)
      .map((symbol) => symbol.name)
      .filter((name) => name.startsWith("__stub_"));
    expect(globals).toEqual([]);
  });

  it("exports the test API, with no call log and no beforeAll or afterAll", () => {
    expect(exported.map((symbol) => symbol.name).sort()).toEqual([
      "DisplayedText",
      "Game",
      "GameExpect",
      "GameMatchers",
      "HandleTypes",
      "NativeAnswer",
      "NativeName",
      "afterEach",
      "beforeEach",
      "describe",
      "expect",
      "it",
      "newHandle",
      "startGame",
      "stubNative",
    ]);
  });

  it("shows each export's example in its hover, the included file's code", () => {
    const examples = exported.map((symbol) => {
      const tags = symbol
        .getJsDocTags(checker)
        .filter((tag) => tag.name === "example");
      return [symbol.name, ts.displayPartsToString(tags[0]?.text)] as const;
    });
    for (const [name, example] of examples) {
      expect(example, name).toMatch(
        /```ts\nimport \{[\w,\s]+\} from "reforged-test\/map";\n/,
      );
      expect(example, name).not.toContain("@includeCode");
    }
  });

  it("gives expect no toContainCall, negated or not", () => {
    const expectSymbol = exported.find((symbol) => symbol.name === "expect");
    if (expectSymbol === undefined) throw new Error("no expect");
    const signature = checker
      .getTypeOfSymbolAtLocation(expectSymbol, source)
      .getCallSignatures()
      .at(0);
    if (signature === undefined) throw new Error("expect is not callable");
    const matchers = checker.getReturnTypeOfSignature(signature);
    const not = matchers.getProperty("not");
    if (not === undefined) throw new Error("no not");
    const negated = checker.getTypeOfSymbolAtLocation(not, source);
    for (const type of [matchers, negated]) {
      const names = type.getProperties().map((symbol) => symbol.name);
      expect(names).toContain("toEqual");
      expect(names).not.toContain("toContainCall");
    }
  });

  // Each call of errorsOf type-checks a program with the Typings: about a
  // second here, and the windows CI leg took 5.4 s for four (#1013).
  const TYPED = { timeout: 30_000 };

  /**
   * The messages of the errors a test file holding `code` has, compiled as
   * a Map project compiles it, the entry point imported as `map`.
   */
  function errorsOf(code: string): string[] {
    const file = fileURLToPath(
      new URL("../map/typed.test.ts", import.meta.url),
    );
    const text = `import * as map from "./index";\n${code}\nexport {};\n`;
    const options = program.getCompilerOptions();
    const host = ts.createCompilerHost(options);
    const readFile = host.readFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    host.readFile = (name) => (resolve(name) === file ? text : readFile(name));
    host.fileExists = (name) => resolve(name) === file || fileExists(name);
    // `types` resolve from the package, where its dependencies are linked.
    host.getCurrentDirectory = () => dirname(dirname(entry));
    const typed = ts.createProgram([file], options, host);
    return ts
      .getPreEmitDiagnostics(typed, typed.getSourceFile(file))
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
  }

  it("types stubNative's answer by the Native's signature", TYPED, () => {
    expect(
      errorsOf(`
        map.stubNative("GetUnitName", (whichUnit) => {
          const typed: unit = whichUnit;
          return typed === undefined ? undefined : "Footman";
        });
        map.stubNative("PauseGame");
        map.stubNative("PauseGame", (flag) => {
          const typed: boolean = flag;
          print(typed);
        });
      `),
    ).toEqual([]);
    expect(errorsOf(`map.stubNative("GetUnitName", () => 1);`)).toEqual([
      expect.stringContaining(
        "Type 'number' is not assignable to type 'string'",
      ),
    ]);
  });

  it(
    "makes the answer optional only for a Native that returns nothing",
    TYPED,
    () => {
      expect(errorsOf(`map.stubNative("GetUnitName");`)).toEqual([
        expect.stringContaining("Expected 2 arguments, but got 1"),
      ]);
    },
  );

  it("takes the name of a Native of common.j only", TYPED, () => {
    const names = ["GetUnitNam", "BJDebugMsg", "print", "bj_MAX_PLAYERS"];
    // One program for the four calls: each is its own error.
    const errors = errorsOf(
      names
        .map((name) => `map.stubNative("${name}", () => undefined);`)
        .join("\n"),
    );
    expect(errors).toHaveLength(names.length);
    for (const [index, name] of names.entries()) {
      expect(errors[index]).toContain(`Argument of type '"${name}"'`);
    }
  });

  it("types newHandle's Handle from its kind", TYPED, () => {
    expect(
      errorsOf(`
        const unit: unit = map.newHandle("unit");
        const timer: timer = map.newHandle("timer");
        print(unit, timer);
      `),
    ).toEqual([]);
    expect(errorsOf(`const unit: unit = map.newHandle("timer");`)).toEqual([
      expect.stringContaining("Type 'timer' is missing"),
    ]);
    expect(errorsOf(`map.newHandle("footman");`)).toEqual([
      expect.stringContaining(`Argument of type '"footman"'`),
    ]);
  });

  it(
    "types game.setLocalPlayer for a player Handle or anything with .handle",
    TYPED,
    () => {
      expect(
        errorsOf(`
        declare const handle: player;
        const game = map.startGame();
        const nothing: void = game.setLocalPlayer(handle);
        game.setLocalPlayer({ handle });
        print(nothing);
      `),
      ).toEqual([]);
      expect(errorsOf(`map.startGame().setLocalPlayer(1);`)).toEqual([
        expect.stringContaining("Argument of type 'number'"),
      ]);
    },
  );
});
