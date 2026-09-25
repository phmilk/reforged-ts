// The multiplayer guarantee of SyncedMap and SyncedSet is a property of the
// compiled artefact: their modules (and the key store they share) contain no
// `pairs` and no `next` call, whose order the game does not guarantee to be
// the same on every client. The library is compiled as `pnpm build` does,
// with its own tsconfig, the output captured in memory instead of written.

import { join } from "node:path";
import { DiagnosticCategory } from "typescript";
import { transpileProject } from "typescript-to-lua";
import { beforeAll, describe, expect, it } from "vitest";
import { packageRoot } from "./support/package-root";

/** The modules the guarantee covers, as their emitted paths end. */
const MODULES = [
  "system/syncedmap.lua",
  "system/syncedset.lua",
  "system/sortedkeys.lua",
];

/**
 * A use of `pairs` or `next` as a Lua name, not a field (`.next`, `:next`)
 * and not a longer name such as `ipairs`, which walks by index.
 */
const UNORDERED = /(?<![\w.:])(?:pairs|next)\b/;

/** The Lua text without its comments, which may name `pairs` in prose. */
function code(lua: string): string {
  return lua.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, "").replace(/--[^\n]*/g, "");
}

describe("the emitted Lua of the synced collections", () => {
  const emitted = new Map<string, string>();

  beforeAll(() => {
    const { diagnostics } = transpileProject(
      join(packageRoot, "tsconfig.json"),
      {},
      (fileName, text) => {
        emitted.set(fileName.replaceAll("\\", "/"), text);
      },
    );
    const errors = diagnostics.filter(
      (diagnostic) => diagnostic.category === DiagnosticCategory.Error,
    );
    expect(errors).toEqual([]);
  }, 60_000);

  it.each(MODULES)("%s calls neither pairs nor next", (module) => {
    const files = [...emitted.keys()].filter((name) =>
      name.endsWith(`/dist/${module}`),
    );
    expect(files).toHaveLength(1);
    const lua = emitted.get(files[0] ?? "") ?? "";
    expect(lua).not.toEqual("");
    expect(code(lua)).not.toMatch(UNORDERED);
  });

  it("recognises a pairs or next call, and ignores ipairs, fields and comments", () => {
    expect(code("for k, v in pairs(t) do end")).toMatch(UNORDERED);
    expect(code("local k = next(t)")).toMatch(UNORDERED);
    expect(code("for i, v in ipairs(t) do end")).not.toMatch(UNORDERED);
    expect(code("local v = it:next()")).not.toMatch(UNORDERED);
    expect(code("-- never pairs\nlocal x = 1")).not.toMatch(UNORDERED);
  });
});
