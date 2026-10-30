/**
 * Seam 1 for creating and deleting objects in the Studio (#835), through
 * the HTTP API: the free Rawcode (the World Editor's prefixes, the seven
 * kinds, the Object manifest's removed Rawcodes, a placed Rawcode), the
 * live check of a Rawcode, a new object based on a Built-in object or
 * copying a Custom object, and the delete of a Custom object only, with
 * the objects that name it and its placement count.
 */
import fs from "node:fs";
import path from "node:path";
import { openObjectData } from "reforged-map";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type {
  CreateAnswer,
  DeleteAnswer,
  DeletionAnswer,
  ErrorAnswer,
  FreeRawcodeAnswer,
  RawcodeAnswer,
  RawcodeCheckAnswer,
  SessionCounts,
} from "../src/index.js";
import { doodadsFile, unitsFile } from "./support/placements.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  request,
  start,
  type Project,
} from "./support/studio.js";

afterEach(closeStudios);
afterAll(removeTemporary);

type Studio = Awaited<ReturnType<typeof start>>;

const SERGEANT = `import { defineUnit } from "reforged-map/objects";

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", uhpm: 500 },
});
`;

/** The Rawcode the Studio suggests for a new object. */
async function suggested(studio: Studio, query: string): Promise<string> {
  const answer = await request(studio, `/api/free-rawcode?${query}`);
  expect(answer.status).toBe(200);
  return (answer.body as FreeRawcodeAnswer).rawcode ?? "none";
}

/** Places objects on the terrain of a Map project's map folder. */
function place(
  project: Project,
  units: readonly string[],
  doodads: readonly string[] = [],
): void {
  fs.writeFileSync(
    path.join(project.mapFolder, "war3mapUnits.doo"),
    unitsFile(units.map((rawcode) => ({ rawcode }))),
  );
  fs.writeFileSync(
    path.join(project.mapFolder, "war3map.doo"),
    doodadsFile(doodads.map((rawcode) => ({ rawcode }))),
  );
}

/** The Rawcodes of a kind's objects in the map folder on disk. */
function onDisk(project: Project, kind: "unit" | "item"): string[] {
  return openObjectData(project.mapFolder, { projectRoot: project.root })
    .objects(kind)
    .map((object) => object.rawcode);
}

describe("the free Rawcode", () => {
  it("takes the World Editor's prefix of each kind and the lowest free number across the seven kinds", async () => {
    // The fixture holds h000 and h001, and I000, A000, B000 (a buff and a
    // destructable), D000 and R000.
    const studio = await start(mapProject());

    expect(await suggested(studio, "kind=unit&base=hfoo")).toBe("h002");
    expect(await suggested(studio, "kind=unit&base=Hpal")).toBe("H000");
    expect(await suggested(studio, "kind=unit&copyOf=h000")).toBe("h002");
    expect(await suggested(studio, "kind=item")).toBe("I001");
    expect(await suggested(studio, "kind=ability")).toBe("A001");
    expect(await suggested(studio, "kind=buff")).toBe("B001");
    expect(await suggested(studio, "kind=destructable")).toBe("B001");
    expect(await suggested(studio, "kind=doodad")).toBe("D001");
    expect(await suggested(studio, "kind=upgrade")).toBe("R001");

    const answer = (await request(studio, "/api/free-rawcode?kind=ability"))
      .body as FreeRawcodeAnswer;
    expect(answer).toEqual({ kind: "ability", prefix: "A", rawcode: "A001" });
    expect(
      (await request(studio, "/api/free-rawcode?kind=nothing")).status,
    ).toBe(400);
  });

  it("skips a Rawcode an object of another kind holds, and one an unsaved edit added", async () => {
    const studio = await start(mapProject());
    // An ability takes h002: a new unit cannot.
    const created = await request(studio, "/api/create", {
      json: { kind: "ability", rawcode: "h002", base: "AHhb" },
    });
    expect(created.status).toBe(200);

    expect(await suggested(studio, "kind=unit&base=hfoo")).toBe("h003");
  });

  it("skips the Rawcodes the Object manifest records as removed, and those placed on the terrain", async () => {
    const project = mapProject({
      "object-manifest.json": `${JSON.stringify(
        {
          format: 1,
          owned: [],
          removed: [
            { kind: "unit", rawcode: "h002", base: "hfoo", modifications: [] },
          ],
        },
        null,
        2,
      )}\n`,
    });
    // h003 is placed, I001 too, and D001 on the doodads file.
    place(project, ["h003", "I001", "sloc"], ["D001"]);
    const studio = await start(project);

    expect(await suggested(studio, "kind=unit&base=hfoo")).toBe("h004");
    expect(await suggested(studio, "kind=item")).toBe("I002");
    expect(await suggested(studio, "kind=doodad")).toBe("D002");

    const check = (await request(studio, "/api/rawcode-check?rawcode=h002"))
      .body as RawcodeCheckAnswer;
    expect(check).toEqual({
      rawcode: "h002",
      free: false,
      holders: [{ by: "removed", kind: "unit" }],
      message:
        "h002 is taken by the Object manifest, which records the unit h002 as removed.",
    });
    const placed = (await request(studio, "/api/rawcode-check?rawcode=h003"))
      .body as RawcodeCheckAnswer;
    expect(placed.holders).toEqual([
      { by: "placed", file: "war3mapUnits.doo", count: 1 },
    ]);
  });

  it("checks a Rawcode live, naming what holds a taken one", async () => {
    const studio = await start(mapProject());

    const shared = (await request(studio, "/api/rawcode-check?rawcode=B000"))
      .body as RawcodeCheckAnswer;
    expect(shared.free).toBe(false);
    expect(shared.holders).toEqual([
      expect.objectContaining({ by: "object", kind: "buff", origin: "custom" }),
      expect.objectContaining({
        by: "object",
        kind: "destructable",
        origin: "custom",
      }),
    ]);
    expect(shared.message).toMatch(/^B000 is taken by the Custom buff /);

    const builtin = (await request(studio, "/api/rawcode-check?rawcode=hfoo"))
      .body as RawcodeCheckAnswer;
    expect(builtin.message).toBe(
      "hfoo is taken by the modified Built-in unit Militia (hfoo).",
    );

    const free = (await request(studio, "/api/rawcode-check?rawcode=h00Z"))
      .body as RawcodeCheckAnswer;
    expect(free).toEqual({ rawcode: "h00Z", free: true, holders: [] });

    const malformed = (await request(studio, "/api/rawcode-check?rawcode=h0"))
      .body as RawcodeCheckAnswer;
    expect(malformed.free).toBe(false);
    expect(malformed.message).toContain("is not a Rawcode");
  });
});

describe("creating an object", () => {
  it("creates an object based on a Built-in object, as one undo step", async () => {
    const project = mapProject();
    const studio = await start(project);

    const answer = await request(studio, "/api/create", {
      json: { kind: "unit", rawcode: "h002", base: "hfoo" },
    });
    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({
      kind: "unit",
      rawcode: "h002",
      unsavedEdits: 1,
      undo: 1,
      redo: 0,
    } satisfies CreateAnswer);

    const found = (await request(studio, "/api/objects/h002?kind=unit"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(found.selected).toMatchObject({
      origin: "custom",
      base: { rawcode: "hfoo" },
    });

    const undone = (await request(studio, "/api/undo", { json: {} }))
      .body as SessionCounts;
    expect(undone.unsavedEdits).toBe(0);
    expect((await request(studio, "/api/objects/h002?kind=unit")).status).toBe(
      404,
    );
  });

  it("copies a Custom object with its base and every modification", async () => {
    const project = mapProject();
    const studio = await start(project);

    const answer = await request(studio, "/api/create", {
      json: { kind: "unit", rawcode: "h002", copyOf: "h000" },
    });
    expect(answer.status).toBe(200);
    expect((answer.body as CreateAnswer).undo).toBe(1);
    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);

    const editor = openObjectData(project.mapFolder, {
      projectRoot: project.root,
    });
    const units = editor.objects("unit");
    const source = units.find((object) => object.rawcode === "h000");
    const copy = units.find((object) => object.rawcode === "h002");
    expect(copy?.base).toBe(source?.base);
    const values = (object: typeof copy) =>
      (object?.modifications ?? []).map((modification) => [
        modification.field,
        modification.level,
        modification.value,
      ]);
    expect(values(copy)).toEqual(values(source));
    expect(onDisk(project, "unit")).toContain("h000");
  });

  it("refuses a Rawcode anything holds, a copy of what is no Custom object, and an unknown base", async () => {
    const studio = await start(mapProject());

    const taken = await request(studio, "/api/create", {
      json: { kind: "item", rawcode: "A000", base: "ratc" },
    });
    expect(taken.status).toBe(409);
    expect((taken.body as ErrorAnswer).error.reason).toBe("rawcode-taken");
    expect((taken.body as ErrorAnswer).error.message).toMatch(
      /^A000 is taken by the Custom ability /,
    );

    const notCustom = await request(studio, "/api/create", {
      json: { kind: "unit", rawcode: "h002", copyOf: "hfoo" },
    });
    expect(notCustom.status).toBe(409);
    expect((notCustom.body as ErrorAnswer).error.reason).toBe("not-custom");

    const unknownBase = await request(studio, "/api/create", {
      json: { kind: "unit", rawcode: "h002", base: "zzzz" },
    });
    expect(unknownBase.status).toBe(422);
    expect((unknownBase.body as ErrorAnswer).error.reason).toBe("unknown-base");

    const both = await request(studio, "/api/create", {
      json: { kind: "unit", rawcode: "h002", base: "hfoo", copyOf: "h000" },
    });
    expect(both.status).toBe(400);
    expect(
      ((await request(studio, "/api/session")).body as SessionCounts).undo,
    ).toBe(0);
  });
});

describe("deleting an object", () => {
  it("confirms the delete of a Custom object with what names it and its placement count", async () => {
    const project = mapProject();
    place(project, ["h000", "h000", "hfoo"]);
    const studio = await start(project);

    const deletion = (
      await request(studio, "/api/deletion?kind=unit&rawcode=h000")
    ).body as DeletionAnswer;
    expect(deletion).toMatchObject({
      kind: "unit",
      rawcode: "h000",
      deletable: true,
      placements: 2,
      placementFile: "war3mapUnits.doo",
    });
    expect(deletion.message).toContain(
      "It is placed 2 times on the terrain, in war3mapUnits.doo. The Studio leaves those placements there: the game already skips them, and the World Editor drops them without asking at its next save.",
    );

    const deleted = await request(studio, "/api/delete", {
      json: { kind: "unit", rawcode: "h000" },
    });
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({
      placements: 2,
      unsavedEdits: 1,
      undo: 1,
      redo: 0,
    } satisfies DeleteAnswer);

    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    expect(onDisk(project, "unit")).not.toContain("h000");
    // The placements stay: the Studio writes no placement file.
    expect(
      fs.readFileSync(path.join(project.mapFolder, "war3mapUnits.doo")),
    ).toEqual(
      Buffer.from(
        unitsFile(["h000", "h000", "hfoo"].map((rawcode) => ({ rawcode }))),
      ),
    );

    // After the save, h000 is placed still: it is not suggested again.
    const check = (await request(studio, "/api/rawcode-check?rawcode=h000"))
      .body as RawcodeCheckAnswer;
    expect(check.holders).toEqual([
      { by: "placed", file: "war3mapUnits.doo", count: 2 },
    ]);
  });

  it("lists the objects whose fields name the object deleted", async () => {
    const studio = await start(mapProject());
    // The unit h001 names the ability A000 in its list of abilities.
    const edited = await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h001",
            field: "uabi",
            value: "AHhb,A000",
          },
        ],
      },
    });
    expect(edited.status).toBe(200);

    const deletion = (
      await request(studio, "/api/deletion?kind=ability&rawcode=A000")
    ).body as DeletionAnswer;

    expect(deletion.referrers).toEqual([
      expect.objectContaining({
        kind: "unit",
        rawcode: "h001",
        fields: ["uabi"],
      }),
    ]);
    expect(deletion.message).toContain("1 object names it");
    expect(deletion.message).toContain("(h001) in uabi");
  });

  it("deletes a Custom object only: a Built-in object, a modified one and an Object definition are refused", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const studio = await start(project);

    for (const rawcode of ["hfoo", "hkni"]) {
      const deletion = (
        await request(studio, `/api/deletion?kind=unit&rawcode=${rawcode}`)
      ).body as DeletionAnswer;
      expect(deletion.deletable).toBe(false);
      const answer = await request(studio, "/api/delete", {
        json: { kind: "unit", rawcode },
      });
      expect(answer.status).toBe(409);
      expect((answer.body as ErrorAnswer).error.reason).toBe("not-custom");
    }

    const definition = (
      await request(studio, "/api/deletion?kind=unit&rawcode=h002")
    ).body as DeletionAnswer;
    expect(definition.deletable).toBe(false);
    expect(definition.message).toBe(
      "h002 is an Object definition's: delete it in the code.",
    );
    const refused = await request(studio, "/api/delete", {
      json: { kind: "unit", rawcode: "h002" },
    });
    expect(refused.status).toBe(409);
    expect((refused.body as ErrorAnswer).error).toEqual({
      reason: "object-definition",
      message:
        "h002 is an Object definition of src/objects/units.ts: delete it there.",
      file: "src/objects/units.ts",
    });
    expect(
      ((await request(studio, "/api/session")).body as SessionCounts).undo,
    ).toBe(0);
  });

  it("counts no placement for a kind nothing places", async () => {
    const project = mapProject();
    place(project, [], ["B000"]);
    const studio = await start(project);

    const buff = (await request(studio, "/api/deletion?kind=buff&rawcode=B000"))
      .body as DeletionAnswer;
    expect(buff.placements).toBe(0);
    expect(buff.placementFile).toBeUndefined();
    const destructable = (
      await request(studio, "/api/deletion?kind=destructable&rawcode=B000")
    ).body as DeletionAnswer;
    expect(destructable.placements).toBe(1);
    expect(destructable.message).toContain(
      "It is placed 1 time on the terrain, in war3map.doo. The Studio leaves that placement there",
    );
  });
});
