import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { RUN_GLOBAL, runTestModule } from "../src/lua-state.js";

// reforged-test/stubs declares every `__stub_*` global the Shipped stubs
// define, and nothing else: the helpers the Lua defines are read from a Lua
// state that ran the Shipped stubs, the names the declarations give from
// stubs/index.d.ts.

const stubsDir = fileURLToPath(new URL("../stubs/", import.meta.url));
const declarations = join(stubsDir, "index.d.ts");

/** The Shipped stubs in the order the glue runs them: base.lua first. */
function shippedStubs(): { name: string; source: string }[] {
  const files = readdirSync(stubsDir)
    .filter((file) => file.endsWith(".lua") && file !== "base.lua")
    .sort();
  return ["base.lua", ...files].map((file) => ({
    name: `reforged-test/stubs/${file}`,
    source: readFileSync(join(stubsDir, file), "utf8"),
  }));
}

// A module that answers, in place of the runner, the sorted names of the
// `__stub_*` globals.
const LISTER = `
${RUN_GLOBAL} = function()
  local names = {}
  for name in pairs(_G) do
    if type(name) == "string" and string.sub(name, 1, 7) == "__stub_" then
      names[#names + 1] = name
    end
  end
  table.sort(names)
  return table.concat(names, "\\n")
end
`;

function definedHelpers(): string[] {
  const listed = runTestModule(
    shippedStubs(),
    [{ moduleName: "lister", chunk: { name: "lister.lua", source: LISTER } }],
    "lister",
  );
  return listed.split("\n");
}

function declaredHelpers(): string[] {
  const source = ts.createSourceFile(
    declarations,
    readFileSync(declarations, "utf8"),
    ts.ScriptTarget.Latest,
  );
  const names = new Set<string>();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      names.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
  }
  return [...names].filter((name) => name.startsWith("__stub_")).sort();
}

describe("reforged-test/stubs", () => {
  const defined = definedHelpers();
  const declared = declaredHelpers();

  it("finds the helpers of the Shipped stubs", () => {
    expect(defined).toContain("__stub_fire_trigger");
    expect(defined).toContain("__stub_record");
  });

  it("declares every helper the Shipped stubs define", () => {
    expect(defined.filter((name) => !declared.includes(name))).toEqual([]);
  });

  it("declares no helper the Shipped stubs do not define", () => {
    expect(declared.filter((name) => !defined.includes(name))).toEqual([]);
  });
});
