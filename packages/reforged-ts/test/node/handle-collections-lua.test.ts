// HandleMap and HandleSet iterate in insertion order on every client: their
// emitted Lua, with the lualib features they use inlined, never calls `pairs`
// or `next`, whose order depends on a table's memory layout. The test
// compiles the library itself, with `luaLibImport: "inline"`, so the lualib
// code the modules rely on (`Map`, `Set`, `WeakMap`, the iterator helpers) is
// checked with them. `ipairs` walks an array by index and stays allowed.

import { fileURLToPath } from "node:url";
import { LuaLibImportKind, transpileProject } from "typescript-to-lua";
import { beforeAll, describe, expect, it } from "vitest";

const tsconfig = fileURLToPath(new URL("../../tsconfig.json", import.meta.url));

const modules = ["handlekeys", "handlemap", "handleset"] as const;

/** The emitted Lua of each module, by module name. */
const lua = new Map<string, string>();

beforeAll(() => {
  const { diagnostics } = transpileProject(
    tsconfig,
    { luaLibImport: LuaLibImportKind.Inline, declaration: false },
    (fileName, text) => {
      const match = /[\\/]system[\\/](\w+)\.lua$/.exec(fileName);
      if (match !== null) {
        lua.set(match[1], text);
      }
    },
  );
  expect(diagnostics).toEqual([]);
}, 120_000);

/** `code` without its Lua comments, which name `pairs` in the TSDoc. */
function withoutComments(code: string): string {
  return code.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, "").replace(/--.*$/gm, "");
}

describe.each(modules)("the emitted Lua of system/%s", (name) => {
  it("is emitted", () => {
    expect(lua.get(name)).toBeDefined();
  });

  it("calls neither pairs nor next", () => {
    const code = withoutComments(lua.get(name) ?? "");
    expect(code).not.toMatch(/\bpairs\b/);
    expect(code).not.toMatch(/(?<![.:\w])next\s*\(/);
  });
});
