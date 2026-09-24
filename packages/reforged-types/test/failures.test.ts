import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import { entry, writeFixture } from "./support/fixture.js";

async function run(...args: Parameters<typeof writeFixture>) {
  return generate(await writeFixture(...args));
}

describe("generate: missing Overlay entries", () => {
  it("fails listing each missing entry with source, name and signature", async () => {
    const result = await run(
      {
        "common.j": [
          "type unit extends handle",
          "constant native GetUnitX takes unit whichUnit returns real",
          "native Covered takes nothing returns nothing",
          "native DoNothing takes nothing returns nothing",
        ].join("\n"),
        "blizzard.j":
          "function BJDebugMsg takes string msg returns nothing\nendfunction",
      },
      [entry("common.j", "Covered")]
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "missing-entry",
        file: "common.j",
        line: 2,
        name: "GetUnitX",
        message:
          "common.j: no Overlay entry for constant native GetUnitX takes unit whichUnit returns real; expected common.j/functions/GetUnitX.json",
      },
      {
        severity: "error",
        kind: "missing-entry",
        file: "common.j",
        line: 4,
        name: "DoNothing",
        message:
          "common.j: no Overlay entry for native DoNothing takes nothing returns nothing; expected common.j/functions/DoNothing.json",
      },
      {
        severity: "error",
        kind: "missing-entry",
        file: "blizzard.j",
        line: 1,
        name: "BJDebugMsg",
        message:
          "blizzard.j: no Overlay entry for function BJDebugMsg takes string msg returns nothing; expected blizzard.j/functions/BJDebugMsg.json",
      },
    ]);
  });

  it("does not require entries for types", async () => {
    const result = await run({ "common.j": "type unit extends handle\n" });

    expect(result).toMatchObject({ ok: true, diagnostics: [] });
  });

  it("does not accept an entry from another source file's folder", async () => {
    const result = await run(
      { "common.j": "native A takes nothing returns nothing\n" },
      [entry("blizzard.j", "A")]
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => [d.severity, d.kind])).toEqual([
      ["error", "missing-entry"],
      ["warning", "orphan"],
    ]);
  });
});

describe("generate: parameter mismatch", () => {
  const commonJ =
    "type unit extends handle\nnative KillUnit takes unit whichUnit, real delay returns nothing\n";

  it.each([
    ["a different name", ["target", "delay"], "(target, delay)"],
    ["a missing parameter", ["whichUnit"], "(whichUnit)"],
    [
      "an extra parameter",
      ["whichUnit", "delay", "extra"],
      "(whichUnit, delay, extra)",
    ],
    ["a different order", ["delay", "whichUnit"], "(delay, whichUnit)"],
  ])("names both sides for %s", async (_case, params, overlaySide) => {
    const result = await run({ "common.j": commonJ }, [
      entry("common.j", "KillUnit", params),
    ]);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "param-mismatch",
        file: "common.j/functions/KillUnit.json",
        name: "KillUnit",
        message:
          "common.j/functions/KillUnit.json: parameters do not match the Patch: " +
          `native KillUnit takes unit whichUnit, real delay returns nothing; Overlay has ${overlaySide}`,
      },
    ]);
  });

  it("reports a function with no parameters against a non-empty Overlay list", async () => {
    const result = await run(
      { "common.j": "native Tick takes nothing returns nothing\n" },
      [entry("common.j", "Tick", ["x"])]
    );

    expect(result.diagnostics[0]?.message).toBe(
      "common.j/functions/Tick.json: parameters do not match the Patch: " +
        "native Tick takes nothing returns nothing; Overlay has (x)"
    );
  });
});

describe("generate: unknown lines", () => {
  it.each([
    ["a statement outside a function", "call DoNothing()"],
    ["a malformed type", "type unit extends"],
    ["a native without returns", "native Broken takes nothing"],
    ["a malformed parameter", "native Broken takes unit returns nothing"],
    [
      "a constant function",
      "constant function F takes nothing returns nothing",
    ],
    ["a stray endfunction", "endfunction"],
  ])("reports %s with file and line", async (_case, line) => {
    const result = await run({
      "common.j": `// header\ntype unit extends handle\n\n${line}\n`,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      severity: "error",
      kind: "parse",
      file: "common.j",
      line: 4,
      message: `common.j:4: unknown line: ${line}`,
    });
  });

  it("reports a function body that never ends at its header line", async () => {
    const result = await run({
      "blizzard.j":
        "\nfunction Open takes nothing returns nothing\n    call Foo()\n",
    });

    expect(result.diagnostics).toContainEqual({
      severity: "error",
      kind: "parse",
      file: "blizzard.j",
      line: 2,
      message: "blizzard.j:2: function Open has no endfunction",
    });
  });
});

describe("generate: orphan entries", () => {
  it("warns about an entry with no declaration and still generates", async () => {
    const result = await run(
      { "common.j": "native Kept takes nothing returns nothing\n" },
      [
        entry("common.j", "Kept"),
        entry("common.j", "RequestExtraBooleanData", ["a"], true),
      ]
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([
      {
        severity: "warning",
        kind: "orphan",
        file: "common.j/functions/RequestExtraBooleanData.json",
        name: "RequestExtraBooleanData",
        message:
          "common.j/functions/RequestExtraBooleanData.json: orphan Overlay entry, common.j of Patch 3.0.0.24268 declares no RequestExtraBooleanData",
      },
    ]);
  });
});

describe("generate: invalid inputs", () => {
  it("fails on an Overlay entry that is not valid JSON", async () => {
    const result = await run(
      { "common.j": "native A takes nothing returns nothing\n" },
      [],
      { rawOverlay: { "common.j/functions/A.json": "{ not json" } }
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      kind: "overlay-invalid",
      file: "common.j/functions/A.json",
    });
  });

  it.each([
    ["a name that differs from the file name", { name: "B" }, "name"],
    [
      "a source that differs from the folder",
      { source: "blizzard.j" },
      "source",
    ],
    ["a missing returns.nullable", { returns: {} }, "returns.nullable"],
    [
      "a non-boolean parameter nullable",
      { params: [{ name: "x", nullable: "no" }] },
      "params[0].nullable",
    ],
    ["a missing params list", { params: undefined }, "params"],
  ])(
    "fails on an entry with %s, naming the field",
    async (_case, patch, field) => {
      const json = { ...entry("common.j", "A"), ...patch };
      const result = await run(
        { "common.j": "native A takes nothing returns nothing\n" },
        [],
        { rawOverlay: { "common.j/functions/A.json": JSON.stringify(json) } }
      );

      expect(result.ok).toBe(false);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/functions/A.json",
      });
      expect(result.diagnostics[0]?.message).toContain(
        `common.j/functions/A.json: ${field}`
      );
    }
  );

  it("fails when the Patch folder has no provenance file", async () => {
    const result = await run({ "common.j": "" }, [], { provenance: null });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      kind: "patch-invalid",
      file: "provenance.json",
    });
  });
});
