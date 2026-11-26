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
      "FiringContext",
      "Game",
      "GameExpect",
      "GameMatchers",
      "HandleTypes",
      "NativeAnswer",
      "NativeName",
      "afterEach",
      "beforeEach",
      "calls",
      "describe",
      "expect",
      "fn",
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

  // Each call of errorsOf type-checks a program with the Typings.
  // Measured 5.4 s with pnpm test on the windows CI leg of #1013, for a
  // test of four calls, 2026-11.
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

  it(
    "types a spy matcher's arguments and calls from the function's parameters",
    TYPED,
    () => {
      expect(
        errorsOf(`
        const { expect } = map;
        expect(TimerStart).toHaveBeenCalledWith(expect.anything(), 60, true, expect.anything());
        expect(TimerStart).not.toHaveBeenNthCalledWith(2, expect.anything(), 30, false, expect.anything());
        const spy = map.fn((wave: number, name: string) => name.length + wave);
        expect(spy).toHaveBeenLastCalledWith(1, "a");
        const handler: code = map.calls(TimerStart)[0][3];
        const name: string = map.calls(spy)[0][1];
        const plain: (...args: any[]) => any = map.fn();
        print(handler, name, plain);
      `),
      ).toEqual([]);
      expect(
        errorsOf(
          `map.expect(TimerStart).toHaveBeenCalledWith(1, 60, true, () => undefined);`,
        ),
      ).toEqual([
        expect.stringContaining(
          "Argument of type 'number' is not assignable to parameter of type 'timer'",
        ),
      ]);
      expect(
        errorsOf(`const timeout: string = map.calls(TimerStart)[0][1];`),
      ).toEqual([
        expect.stringContaining(
          "Type 'number' is not assignable to type 'string'",
        ),
      ]);
    },
  );

  it("has Vitest's focus and skip forms, and no other", () => {
    const members = (name: string) => {
      const symbol = exported.find((candidate) => candidate.name === name);
      if (symbol === undefined) throw new Error(`no ${name}`);
      return checker
        .getTypeOfSymbolAtLocation(symbol, source)
        .getProperties()
        .map((property) => property.name)
        .sort();
    };
    expect(members("it")).toEqual(["only", "skip", "todo"]);
    expect(members("describe")).toEqual(["only", "skip"]);
  });

  it("takes a name and no body in it.todo", TYPED, () => {
    expect(
      errorsOf(`
        map.it.todo("ends the game");
        map.it.skip("ends the game", () => undefined);
        map.describe.only("the end", () => undefined);
      `),
    ).toEqual([]);
    expect(errorsOf(`map.it.todo("ends the game", () => undefined);`)).toEqual([
      expect.stringContaining("Expected 1 arguments, but got 2"),
    ]);
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

  it(
    "types game.kill for a unit Handle or anything with .handle, never a bare number, with no createUnit",
    TYPED,
    () => {
      expect(
        errorsOf(`
        declare const footman: unit;
        declare const knight: unit;
        const game = map.startGame();
        const nothing: void = game.kill(footman);
        game.kill({ handle: footman }, { by: knight });
        game.kill(footman, { by: { handle: knight } });
        game.kill(footman, {});
        print(nothing);
      `),
      ).toEqual([]);
      expect(errorsOf(`map.startGame().kill(1);`)).toEqual([
        expect.stringContaining("Argument of type 'number'"),
      ]);
      expect(
        errorsOf(`
        declare const footman: unit;
        map.startGame().kill(footman, { by: 1 });
      `),
      ).toEqual([expect.stringContaining("Type 'number' is not assignable")]);
      expect(
        errorsOf(`
        declare const footman: unit;
        map.startGame().kill(footman, { killer: footman });
      `),
      ).toEqual([expect.stringContaining("'killer' does not exist")]);
      expect(errorsOf(`map.startGame().createUnit;`)).toEqual([
        expect.stringContaining("Property 'createUnit' does not exist"),
      ]);
    },
  );

  it(
    "types game.fire by the event families and the Firing context by the response Natives, with no emit",
    TYPED,
    () => {
      expect(
        errorsOf(`
        declare const caster: unit;
        const game = map.startGame();
        const context: map.FiringContext = {
          GetTriggerUnit: caster,
          GetSpellAbilityId: FourCC("AHtb"),
        };
        const nothing: void = game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, context);
        game.fire(EVENT_UNIT_DEATH, { GetTriggerUnit: caster });
        game.fire(EVENT_PLAYER_END_CINEMATIC, { GetTriggerPlayer: Player(0) });
        game.fire(EVENT_GAME_LOADED, {});
        print(nothing);
      `),
      ).toEqual([]);
      expect(errorsOf(`map.startGame().fire(EVENT_WIDGET_DEATH, {});`)).toEqual(
        [expect.stringContaining("Argument of type 'widgetevent'")],
      );
      expect(
        errorsOf(
          `map.startGame().fire(EVENT_GAME_LOADED, { GetTriggerUnit: 1 });`,
        ),
      ).toEqual([expect.stringContaining("Type 'number' is not assignable")]);
      expect(errorsOf(`map.startGame().emit;`)).toEqual([
        expect.stringContaining("Property 'emit' does not exist"),
      ]);
    },
  );
});
