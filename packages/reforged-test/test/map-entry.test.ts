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
const exported = checker.getExportsOfModule(moduleSymbol);

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
      "afterEach",
      "beforeEach",
      "describe",
      "expect",
      "it",
      "startGame",
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
        /```ts\nimport \{ [\w, ]+ \} from "reforged-test\/map";\n/,
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
});
