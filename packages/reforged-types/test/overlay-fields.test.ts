import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import {
  entry,
  writeFixture,
  type OverlayEntryFixture,
} from "./support/fixture.js";

async function run(...args: Parameters<typeof writeFixture>) {
  return generate(await writeFixture(...args));
}

async function generateOk(...args: Parameters<typeof writeFixture>) {
  const result = await run(...args);
  if (!result.ok) {
    throw new Error(
      "generation failed:\n" +
        result.diagnostics.map((d) => d.message).join("\n")
    );
  }
  return result;
}

/** The common.j output of a fixture with one Native and one Overlay entry. */
async function commonJ(jass: string, overlay: OverlayEntryFixture) {
  const result = await generateOk({ "common.j": jass }, [overlay]);
  return result.files.get("3.0.0/common.j.d.ts")!;
}

const getLocalPlayer = [
  "type player extends handle",
  "native GetLocalPlayer takes nothing returns player",
].join("\n");

describe("generate: Overlay header facts", () => {
  it("marks an async entry with @async", async () => {
    const text = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      async: true,
    });

    expect(text).toContain(
      [
        "/**",
        " * @returns player",
        " * @async",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/GetLocalPlayer}",
        " */",
        "declare function GetLocalPlayer(): player;",
      ].join("\n")
    );
  });

  it("emits no @async for async false or an absent field", async () => {
    const off = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      async: false,
    });
    const absent = await commonJ(
      getLocalPlayer,
      entry("common.j", "GetLocalPlayer")
    );

    expect(off).not.toContain("@async");
    expect(absent).toBe(off);
  });

  it("marks a deprecated entry with @deprecated and its text", async () => {
    const text = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      deprecated: "Use {@link GetPlayer} instead.",
    });

    expect(text).toContain(
      " * @deprecated Use {@link GetPlayer} instead.\n"
    );
  });

  it("renders notes as @remarks, one comment line per text line", async () => {
    const text = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      notes: "Differs per client.\n\nNever branch game state on it.",
    });

    expect(text).toContain(
      [
        " * @remarks Differs per client.",
        " *",
        " * Never branch game state on it.",
        " * @see",
      ].join("\n")
    );
  });

  it("renders since as @patch", async () => {
    const text = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      since: "3.0.0.24268",
    });

    expect(text).toContain(" * @returns player\n * @patch 3.0.0.24268\n");
  });

  it("orders the tags params, returns, patch, async, deprecated, remarks, see", async () => {
    const text = await commonJ(
      "type player extends handle\nnative GetPlayer takes integer id returns player",
      {
        ...entry("common.j", "GetPlayer", ["id"]),
        async: true,
        deprecated: "Gone soon.",
        notes: "A note.",
        since: "3.0.0.24268",
        origin: "war3-types-strict",
      }
    );

    expect(text).toContain(
      [
        "/**",
        " * @param id - integer (32-bit)",
        " * @returns player",
        " * @patch 3.0.0.24268",
        " * @async",
        " * @deprecated Gone soon.",
        " * @remarks A note.",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/GetPlayer}",
        " */",
        "declare function GetPlayer(id: number): player;",
      ].join("\n")
    );
  });

  it("has no visible effect for origin", async () => {
    const seeded = await commonJ(getLocalPlayer, {
      ...entry("common.j", "GetLocalPlayer"),
      origin: "war3-types-strict",
    });
    const handWritten = await commonJ(
      getLocalPlayer,
      entry("common.j", "GetLocalPlayer")
    );

    expect(seeded).toBe(handWritten);
  });

  it("uses only standard TSDoc tags and the four declared custom tags", async () => {
    const result = await generateOk(
      {
        "common.j": [
          "type player extends handle",
          "native GetPlayer takes integer id, code c returns player",
        ].join("\n"),
        "blizzard.j":
          "function Helper takes nothing returns nothing\nendfunction\n",
      },
      [
        {
          ...entry("common.j", "GetPlayer", ["id", "c?"], true),
          async: true,
          deprecated: "See {@link Helper}.",
          notes: "Line one.\nLine two.",
          since: "3.0.0.24268",
          origin: "war3-types-strict",
        },
        entry("blizzard.j", "Helper"),
      ]
    );

    const standard = ["param", "returns", "deprecated", "remarks", "see"];
    const custom = ["native", "patch", "async", "bug"];
    const inline = ["link"];
    const tags = new Set<string>();
    for (const text of result.files.values()) {
      // Every line of a header comment, the `@noSelfInFile` banner excepted.
      const headers = text
        .split("\n")
        .filter((line) => line.startsWith(" *"));
      for (const line of headers) {
        for (const [, tag] of line.matchAll(/@(\w+)/g)) tags.add(tag!);
      }
    }
    expect([...tags].sort()).toEqual(
      ["async", "deprecated", "link", "param", "patch", "remarks", "returns", "see"]
    );
    for (const tag of tags) {
      expect([...standard, ...custom, ...inline]).toContain(tag);
    }
  });
});

describe("generate: parameter type override", () => {
  const jass = [
    "type unit extends handle",
    "native Pick takes unit a, integer n, unit b returns nothing",
  ].join("\n");

  it("replaces the parameter's type in the signature and keeps the Jass type in the header", async () => {
    const overlay = entry("common.j", "Pick", ["a", "n", "b"]);
    overlay.params[1]!.type = "0 | 1 | 2";
    const text = await commonJ(jass, overlay);

    expect(text).toContain(
      "declare function Pick(a: unit, n: 0 | 1 | 2, b: unit): void;"
    );
    expect(text).toContain(" * @param n - integer (32-bit)\n");
  });

  it("keeps nullability on an overridden parameter", async () => {
    const overlay = entry("common.j", "Pick", ["a?", "n", "b?"]);
    overlay.params[0]!.type = "(this: void) => boolean";
    overlay.params[2]!.type = "unit";
    const text = await commonJ(jass, overlay);

    expect(text).toContain(
      "declare function Pick(a: ((this: void) => boolean) | undefined, n: number, b?: unit): void;"
    );
  });
});

describe("generate: boolean callback alias", () => {
  const jass = [
    "type boolexpr extends handle",
    "type conditionfunc extends boolexpr",
    "type filterfunc extends boolexpr",
    "native Condition takes code func returns conditionfunc",
    "native Filter takes code func returns filterfunc",
    "native TimerStart takes code handlerFunc returns nothing",
  ].join("\n");

  function overridden(name: string): OverlayEntryFixture {
    const overlay = entry("common.j", name, ["func"]);
    overlay.params[0]!.type = "boolcode";
    return overlay;
  }

  it("types Condition and Filter through their override and declares both aliases once in common.j", async () => {
    const result = await generateOk(
      {
        "common.j": jass,
        "blizzard.j": "function Noop takes nothing returns nothing\nendfunction\n",
        "common.ai": "native AiNoop takes nothing returns nothing\n",
      },
      [
        overridden("Condition"),
        overridden("Filter"),
        entry("common.j", "TimerStart", ["handlerFunc"]),
        entry("blizzard.j", "Noop"),
        entry("common.ai", "AiNoop"),
      ]
    );

    const text = result.files.get("3.0.0/common.j.d.ts")!;
    expect(text).toContain(
      [
        "declare interface handle { __handle: never }",
        "type code = (this: void) => void;",
        "type boolcode = (this: void) => boolean;",
        "",
      ].join("\n")
    );
    expect(text.split("type code =").length - 1).toBe(1);
    expect(text.split("type boolcode =").length - 1).toBe(1);
    expect(text).toContain(
      "declare function Condition(func: boolcode): conditionfunc;"
    );
    expect(text).toContain(
      "declare function Filter(func: boolcode): filterfunc;"
    );
    expect(text).toContain(
      "declare function TimerStart(handlerFunc: code): void;"
    );
    expect(text).toContain(" * @param func - code\n");
    for (const other of ["3.0.0/blizzard.j.d.ts", "3.0.0/common.ai.d.ts"]) {
      expect(result.files.get(other)).not.toMatch(/type (code|boolcode) =/);
    }
  });

  it("leaves a code parameter without override on the void alias", async () => {
    const text = await commonJ(
      [
        "type boolexpr extends handle",
        "type conditionfunc extends boolexpr",
        "native Condition takes code func returns conditionfunc",
      ].join("\n"),
      entry("common.j", "Condition", ["func"])
    );

    expect(text).toContain(
      "declare function Condition(func: code): conditionfunc;"
    );
  });
});

describe("generate: Overlay field validation", () => {
  const jass = "native A takes integer x returns nothing\n";

  async function invalid(json: unknown) {
    return run({ "common.j": jass }, [], {
      rawOverlay: { "common.j/A.json": JSON.stringify(json) },
    });
  }

  it("fails on an unknown field, naming the file and the field", async () => {
    const result = await invalid({ ...entry("common.j", "A", ["x"]), asnyc: true });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/A.json",
        name: "A",
        message: 'common.j/A.json: unknown field "asnyc"',
      },
    ]);
  });

  it("fails on an unknown parameter field, naming the file and the field", async () => {
    const json = entry("common.j", "A", ["x"]);
    const result = await invalid({
      ...json,
      params: [{ ...json.params[0], typ: "number" }],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toBe(
      'common.j/A.json: unknown field "params[0].typ"'
    );
  });

  it.each([
    ["a non-boolean async", { async: "yes" }, "async must be a boolean"],
    ["an empty deprecated text", { deprecated: "" }, "deprecated must be"],
    ["a non-string notes", { notes: 3 }, "notes must be"],
    ["a since that is not a Patch build", { since: "3.0" }, "since must be"],
    ["an unknown origin", { origin: "jassdoc" }, "origin must be"],
    ["a notes text that closes the comment", { notes: "a */ b" }, "notes must not"],
    ["a notes text with a TSDoc tag", { notes: "see @note" }, "notes must not"],
    ["a deprecated text with a TSDoc tag", { deprecated: "@internal" }, "deprecated must not"],
  ])("fails on %s, naming the field", async (_case, patch, text) => {
    const result = await invalid({ ...entry("common.j", "A", ["x"]), ...patch });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      kind: "overlay-invalid",
      file: "common.j/A.json",
    });
    expect(result.diagnostics[0]?.message).toContain(`common.j/A.json: ${text}`);
  });

  it("fails on an empty or non-string parameter type override", async () => {
    for (const type of ["", 3]) {
      const json = entry("common.j", "A", ["x"]);
      const result = await invalid({
        ...json,
        params: [{ ...json.params[0], type }],
      });

      expect(result.diagnostics[0]?.message).toContain(
        "common.j/A.json: params[0].type must be"
      );
    }
  });
});
