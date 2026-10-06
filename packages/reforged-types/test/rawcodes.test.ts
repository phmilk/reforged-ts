// Seam 1: the Rawcode types by Object kind (ADR 0012). A parameter takes its
// kind from the parameter-name table or from its Overlay `kind`, a return
// from its Overlay `returns.kind`; the signature carries the kind and the
// header keeps the Jass type.
import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import {
  entry,
  generatedFile,
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
        result.diagnostics.map((d) => d.message).join("\n"),
    );
  }
  return result;
}

/** An entry whose parameters carry the Overlay `kind` given by name. */
function withKinds(
  overlay: OverlayEntryFixture,
  kinds: Record<string, string>,
): OverlayEntryFixture {
  return {
    ...overlay,
    params: overlay.params.map((param) =>
      param.name in kinds ? { ...param, kind: kinds[param.name] } : param,
    ),
  };
}

const handles = ["type player extends handle", "type unit extends handle"];

describe("generate: Rawcode parameters classified by the parameter-name table", () => {
  const jass = [
    ...handles,
    "native CreateUnit takes player id, integer unitid, real x, real y, real face returns unit",
    "native SetPlayerTechResearched takes player whichPlayer, integer techid, integer setToLevel returns nothing",
    "native GetObjectName takes integer objectId returns string",
    "native SetTerrainType takes real x, real y, integer terrainType, integer variation, integer area, integer shape returns nothing",
    "native SetUnitName takes unit whichUnit, string unitId returns nothing",
  ].join("\n");
  const overlay = [
    entry(
      "common.j",
      "CreateUnit",
      ["id", "unitid", "x", "y", "face"],
      true,
      "constructor",
    ),
    entry("common.j", "SetPlayerTechResearched", [
      "whichPlayer",
      "techid",
      "setToLevel",
    ]),
    entry("common.j", "GetObjectName", ["objectId"]),
    entry("common.j", "SetTerrainType", [
      "x",
      "y",
      "terrainType",
      "variation",
      "area",
      "shape",
    ]),
    entry("common.j", "SetUnitName", ["whichUnit", "unitId"]),
  ];

  async function commonJ() {
    const result = await generateOk({ "common.j": jass }, overlay);
    expect(result.diagnostics).toEqual([]);
    return generatedFile(result, "3.0.0/common.j.d.ts");
  }

  it("types a parameter of one Object kind as its Rawcode and keeps the Jass type in the header", async () => {
    const text = await commonJ();

    expect(text).toContain(
      'declare function CreateUnit(id: player, unitid: Rawcode<"unit">, x: number, y: number, face: number): unit | undefined;',
    );
    expect(text).toContain(" * @param unitid - integer (32-bit)\n");
  });

  it("types a parameter of either kind as the union's Rawcode", async () => {
    const text = await commonJ();

    expect(text).toContain(
      'declare function SetPlayerTechResearched(whichPlayer: player, techid: Rawcode<"unit" | "upgrade">, setToLevel: number): void;',
    );
  });

  it("types a parameter of any kind as Rawcode alone", async () => {
    const text = await commonJ();

    expect(text).toContain(
      "declare function GetObjectName(objectId: Rawcode): string;",
    );
  });

  it("leaves a name the table says is not a Rawcode as number, without a diagnostic", async () => {
    const text = await commonJ();

    expect(text).toContain(
      "declare function SetTerrainType(x: number, y: number, terrainType: number, variation: number, area: number, shape: number): void;",
    );
  });

  it("leaves a parameter that is not an integer as its Jass type, whatever its name", async () => {
    const text = await commonJ();

    expect(text).toContain(
      "declare function SetUnitName(whichUnit: unit, unitId: string): void;",
    );
  });
});

describe("generate: Rawcode parameters classified by the Overlay kind", () => {
  it("lets the Overlay kind win over the table", async () => {
    const result = await generateOk(
      {
        "common.ai":
          "native SetBuildUpgr takes integer qty, integer unitid returns nothing",
      },
      [
        withKinds(entry("common.ai", "SetBuildUpgr", ["qty", "unitid"]), {
          unitid: "upgrade",
        }),
      ],
    );

    expect(generatedFile(result, "3.0.0/common.ai.d.ts")).toContain(
      'declare function SetBuildUpgr(qty: number, unitid: Rawcode<"upgrade">): void;',
    );
  });

  it("classifies a name the table does not know, and any kind", async () => {
    const result = await generateOk(
      {
        "common.j": [
          "type destructable extends handle",
          "native CreateDestructable takes integer objectid, real x, real y returns destructable",
        ].join("\n"),
        "common.ai":
          "native MergeUnits takes integer qty, integer a, integer b, integer make returns boolean\n" +
          "native SetBuildAll takes integer t, integer qty, integer unitid, integer town returns nothing",
      },
      [
        withKinds(
          entry(
            "common.j",
            "CreateDestructable",
            ["objectid", "x", "y"],
            true,
            "constructor",
          ),
          { objectid: "destructable" },
        ),
        withKinds(entry("common.ai", "MergeUnits", ["qty", "a", "b", "make"]), {
          a: "unit",
          b: "unit",
          make: "unit",
        }),
        withKinds(
          entry("common.ai", "SetBuildAll", ["t", "qty", "unitid", "town"]),
          { unitid: "any" },
        ),
      ],
    );

    expect(result.diagnostics).toEqual([]);
    expect(generatedFile(result, "3.0.0/common.j.d.ts")).toContain(
      'declare function CreateDestructable(objectid: Rawcode<"destructable">, x: number, y: number): destructable | undefined;',
    );
    const ai = generatedFile(result, "3.0.0/common.ai.d.ts");
    expect(ai).toContain(
      'declare function MergeUnits(qty: number, a: Rawcode<"unit">, b: Rawcode<"unit">, make: Rawcode<"unit">): boolean;',
    );
    expect(ai).toContain(
      "declare function SetBuildAll(t: number, qty: number, unitid: Rawcode, town: number): void;",
    );
  });

  it("keeps a classified parameter's nullability", async () => {
    const result = await generateOk(
      {
        "common.j":
          "native Pick takes integer abilityId, integer itemId returns nothing",
      },
      [entry("common.j", "Pick", ["abilityId", "itemId?"])],
    );

    expect(generatedFile(result, "3.0.0/common.j.d.ts")).toContain(
      'declare function Pick(abilityId: Rawcode<"ability">, itemId?: Rawcode<"item">): void;',
    );
  });
});

describe("generate: Rawcode returns classified by the Overlay returns.kind", () => {
  it("types the return as its Rawcode and keeps the Jass type in the header", async () => {
    const overlay = entry("common.j", "GetUnitTypeId", ["whichUnit"]);
    overlay.returns.kind = "unit";
    const result = await generateOk(
      {
        "common.j": [
          ...handles,
          "constant native GetUnitTypeId takes unit whichUnit returns integer",
        ].join("\n"),
      },
      [overlay],
    );

    const text = generatedFile(result, "3.0.0/common.j.d.ts");
    expect(text).toContain(
      'declare function GetUnitTypeId(whichUnit: unit): Rawcode<"unit">;',
    );
    expect(text).toContain(" * @returns integer (32-bit)\n");
  });
});

describe("generate: unclassified Rawcodes", () => {
  it("fails on an integer parameter that looks like a Rawcode and that neither the table nor the Overlay classifies, naming its Overlay path", async () => {
    const result = await run(
      {
        "common.j": [
          "type destructable extends handle",
          "native CreateDestructable takes integer objectid, real x, real y returns destructable",
        ].join("\n"),
      },
      [
        entry(
          "common.j",
          "CreateDestructable",
          ["objectid", "x", "y"],
          true,
          "constructor",
        ),
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "unclassified-rawcode",
        file: "common.j/functions/CreateDestructable.json",
        name: "CreateDestructable",
        message:
          "common.j/functions/CreateDestructable.json: CreateDestructable parameter objectid (integer) looks like a Rawcode " +
          'but has no Object kind; set params[0].kind to an Object kind or "any", ' +
          "or add objectid to the parameter-name table",
      },
    ]);
  });

  it("matches the names ending in id, code or type in any case, and only integers", async () => {
    const result = await run(
      {
        "common.ai":
          "native Paint takes integer colorCODE, integer x, integer brushTYPE, string nameId returns nothing",
      },
      [entry("common.ai", "Paint", ["colorCODE", "x", "brushTYPE", "nameId"])],
    );

    expect(result.ok).toBe(false);
    expect(
      result.diagnostics.map((d) => [d.kind, d.message.split(";")[0]]),
    ).toEqual([
      [
        "unclassified-rawcode",
        "common.ai/functions/Paint.json: Paint parameter colorCODE (integer) looks like a Rawcode but has no Object kind",
      ],
      [
        "unclassified-rawcode",
        "common.ai/functions/Paint.json: Paint parameter brushTYPE (integer) looks like a Rawcode but has no Object kind",
      ],
    ]);
  });
});

describe("generate: invalid Overlay kind", () => {
  const jass = "native A takes integer unitid, real x returns real\n";

  async function invalid(json: unknown) {
    return run({ "common.j": jass }, [], {
      rawOverlay: { "common.j/functions/A.json": JSON.stringify(json) },
    });
  }

  it.each([
    ["an unknown kind", "hero"],
    ["free TypeScript text", 'Rawcode<"unit">'],
    ["a union", "unit | upgrade"],
    ["a non-string", 3],
  ])("fails on %s in params[].kind", async (_case, kind) => {
    const json = entry("common.j", "A", ["unitid", "x"]);
    const result = await invalid({
      ...json,
      params: [{ ...json.params[0], kind }, json.params[1]],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/functions/A.json",
        name: "A",
        message:
          "common.j/functions/A.json: params[0].kind must be one of unit, item, ability, buff, destructable, doodad, upgrade, any, " +
          `found ${JSON.stringify(kind)}`,
      },
    ]);
  });

  it("fails on an unknown kind in returns.kind", async () => {
    const json = entry("common.j", "A", ["unitid", "x"]);
    const result = await invalid({
      ...json,
      returns: { ...json.returns, kind: "hero" },
    });

    expect(result.diagnostics.map((d) => d.message)).toEqual([
      'common.j/functions/A.json: returns.kind must be one of unit, item, ability, buff, destructable, doodad, upgrade, any, found "hero"',
    ]);
  });

  it("fails on a parameter with both kind and type", async () => {
    const json = entry("common.j", "A", ["unitid", "x"]);
    const result = await invalid({
      ...json,
      params: [
        { ...json.params[0], kind: "unit", type: "number" },
        json.params[1],
      ],
    });

    expect(result.diagnostics.map((d) => d.message)).toEqual([
      "common.j/functions/A.json: params[0] has both kind and type; keep one",
    ]);
  });

  it("fails on kind on a parameter or a return that is not an integer", async () => {
    const overlay = withKinds(entry("common.j", "A", ["unitid", "x"]), {
      x: "unit",
    });
    overlay.returns.kind = "unit";
    const result = await run({ "common.j": jass }, [overlay]);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/functions/A.json",
        name: "A",
        message:
          "common.j/functions/A.json: params[1].kind on A parameter x, which is real, not integer; remove it",
      },
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/functions/A.json",
        name: "A",
        message:
          "common.j/functions/A.json: returns.kind on A, which returns real, not integer; remove it",
      },
    ]);
  });
});
