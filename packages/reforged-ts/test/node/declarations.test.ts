// The declaration-fixture seam: fixture TypeScript type-checked against the
// library's emitted declarations, as a Map project sees the package. The test
// emits the declarations from the sources itself, so `vitest run` needs no
// prior `pnpm build`. A positive fixture must produce no diagnostic; a
// negative fixture states each error it expects on the offending line, as a
// trailing `// error TS2322` comment (several codes are separated by spaces),
// and must produce exactly those. The declarations carry the examples the
// build expands from their `{@includeCode}`, as the editor's hover shows them.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createMapProject,
  expectedErrors,
  fixtureFiles,
  hoverExamples,
  installedDeclarations,
  typecheck,
  type MapProject,
  type TypecheckResult,
} from "./support/declarations";
import { packageRoot } from "./support/package-root";

const positive = fixtureFiles("positive");
const negative = fixtureFiles("negative");

let project: MapProject;
let result: TypecheckResult;

beforeAll(async () => {
  project = await createMapProject();
  result = typecheck(project);
}, 120_000);

afterAll(async () => {
  await (project as MapProject | undefined)?.dispose();
});

describe("the library's emitted declarations in a Map project", () => {
  it("are what the Map project reads the library from", () => {
    expect(result.library).toContain("dist/index.d.ts");
    expect(result.library).toContain("dist/handles/unit.d.ts");
    expect(result.library.every((file) => file.endsWith(".d.ts"))).toBe(true);
  });

  it("type-check with no diagnostic outside the fixtures", () => {
    expect(result.outside).toEqual([]);
  });

  it("has fixtures of both kinds", () => {
    expect(positive.length).toBeGreaterThan(0);
    expect(negative.length).toBeGreaterThan(0);
  });
});

describe("the examples in the emitted declarations", () => {
  it("carry no {@includeCode}: the build expands every include", async () => {
    const declarations = await installedDeclarations(project);
    expect(declarations.size).toBeGreaterThan(0);
    const unexpanded = [...declarations]
      .filter(([, text]) => text.includes("@includeCode"))
      .map(([file]) => file);
    expect(unexpanded).toEqual([]);
  });

  it("show Trigger.addCondition's example code in the hover, as a fenced block", async () => {
    const code = await readFile(
      join(packageRoot, "examples/harness/trigger-add-condition.ts"),
      "utf8",
    );
    expect(
      await hoverExamples(
        project,
        "dist/handles/trigger.d.ts",
        "Trigger",
        "addCondition",
      ),
    ).toEqual(["```ts\n" + code.replaceAll("\r\n", "\n").trimEnd() + "\n```"]);
  });
});

describe.each(positive)("fixture %s", (fixture) => {
  it("expects no error", async () => {
    expect(await expectedErrors(fixture)).toEqual([]);
  });

  it("produces no diagnostic", () => {
    expect(result.byFixture(fixture)).toEqual([]);
  });
});

describe.each(negative)("fixture %s", (fixture) => {
  it("states at least one expected error", async () => {
    expect((await expectedErrors(fixture)).length).toBeGreaterThan(0);
  });

  it("produces exactly the errors it expects, by line and code", async () => {
    expect(result.byFixture(fixture)).toEqual(await expectedErrors(fixture));
  });
});
