/**
 * Seam 1 for bulk editing in the Studio (#836): the Table mode of an Object
 * kind, and set, add, multiply or reset of one field on a selection, each
 * one edit and one undo step, through the HTTP API.
 */
import { openObjectData } from "reforged-map";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type {
  BulkAnswer,
  ErrorAnswer,
  FieldRow,
  RawcodeAnswer,
  SessionCounts,
  TableAnswer,
} from "../src/index.js";
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

/** The field table row of an object's field, at a level for a field of levels. */
async function rowOf(
  studio: Studio,
  rawcode: string,
  field: string,
  kind = "unit",
  level?: number,
): Promise<FieldRow | undefined> {
  const found = (await request(studio, `/api/objects/${rawcode}?kind=${kind}`))
    .body as RawcodeAnswer;
  if (found.status !== "known") throw new Error(found.status);
  return found.selected?.fields.find(
    (row) => row.id === field && row.level === level,
  );
}

/** A unit's value in the map folder on disk. */
function onDisk(
  project: Project,
  rawcode: string,
  field: string,
): number | string | undefined {
  return openObjectData(project.mapFolder, { projectRoot: project.root })
    .objects("unit")
    .find((object) => object.rawcode === rawcode)
    ?.modifications.find((modification) => modification.field === field)?.value;
}

/** Sends a bulk edit of units' fields. */
function bulk(studio: Studio, body: Record<string, unknown>) {
  return request(studio, "/api/bulk", { json: { kind: "unit", ...body } });
}

/** An Object definition of the code: the unit h002. */
const SERGEANT = `import { defineUnit } from "reforged-map/objects";

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", uhpm: 500 },
});
`;

const counts = async (studio: Studio): Promise<SessionCounts> =>
  (await request(studio, "/api/session")).body as SessionCounts;

describe("bulk edits in the Studio", () => {
  it("sets one field on a selection as one undo step", async () => {
    const studio = await start(mapProject());

    const answer = await bulk(studio, {
      op: "set",
      rawcodes: ["h000", "h001", "hfoo"],
      field: "uhpm",
      value: 500,
    });

    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({
      edited: 3,
      unsavedEdits: 3,
      undo: 1,
      redo: 0,
    } satisfies BulkAnswer);
    for (const rawcode of ["h000", "h001", "hfoo"]) {
      expect((await rowOf(studio, rawcode, "uhpm"))?.value).toBe(500);
    }

    // One undo takes the whole selection back.
    expect((await request(studio, "/api/undo", { json: {} })).body).toEqual({
      unsavedEdits: 0,
      undo: 0,
      redo: 1,
    });
    for (const rawcode of ["h000", "h001", "hfoo"]) {
      expect((await rowOf(studio, rawcode, "uhpm"))?.modified).toBe(false);
    }
  });

  it("adds to a field from each object's own value, its modification over its base's", async () => {
    const studio = await start(mapProject());
    await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h000",
            field: "uhpm",
            value: 600,
          },
        ],
      },
    });

    const answer = await bulk(studio, {
      op: "add",
      rawcodes: ["h000", "hfoo"],
      field: "uhpm",
      value: 50,
    });

    expect(answer.body).toMatchObject({ edited: 2, undo: 2 });
    // h000 modifies it (600); the Footman holds its base's, 420.
    expect((await rowOf(studio, "h000", "uhpm"))?.value).toBe(650);
    expect((await rowOf(studio, "hfoo", "uhpm"))?.value).toBe(470);
  });

  it("multiplies a field, rounding an integer field to a whole number", async () => {
    const studio = await start(mapProject());

    await bulk(studio, {
      op: "multiply",
      rawcodes: ["h000", "hfoo"],
      field: "uhpm",
      value: 1.15,
    });

    // 420 × 1.15 = 483.
    expect((await rowOf(studio, "h000", "uhpm"))?.value).toBe(483);
    expect((await rowOf(studio, "hfoo", "uhpm"))?.value).toBe(483);
  });

  it("multiplies a real field of one level of abilities", async () => {
    const studio = await start(mapProject());
    const before = await rowOf(studio, "A000", "acdn", "ability", 2);
    expect(before?.base).toBeDefined();

    const answer = await request(studio, "/api/bulk", {
      json: {
        op: "multiply",
        kind: "ability",
        rawcodes: ["A000"],
        field: "acdn",
        level: 2,
        value: 0.5,
      },
    });

    expect(answer.status).toBe(200);
    expect((await rowOf(studio, "A000", "acdn", "ability", 2))?.value).toBe(
      Number(before?.base) * 0.5,
    );
    expect((await rowOf(studio, "A000", "acdn", "ability", 1))?.modified).toBe(
      false,
    );
  });

  it("resets one field on a selection as one undo step, skipping the objects that do not modify it", async () => {
    const studio = await start(mapProject());

    const answer = await bulk(studio, {
      op: "reset",
      rawcodes: ["h000", "h001", "hfoo"],
      field: "unam",
    });

    expect(answer.body).toEqual({
      edited: 3,
      unsavedEdits: 3,
      undo: 1,
      redo: 0,
    });
    expect((await rowOf(studio, "h000", "unam"))?.modified).toBe(false);
    expect((await rowOf(studio, "hfoo", "unam"))?.modified).toBe(false);

    const none = await bulk(studio, {
      op: "reset",
      rawcodes: ["h000", "hfoo"],
      field: "uhpm",
    });
    // Nothing to reset: no step taken.
    expect(none.body).toEqual({
      edited: 0,
      unsavedEdits: 3,
      undo: 1,
      redo: 0,
    });
  });

  it("refuses to add to a field that is no number, changing nothing", async () => {
    const studio = await start(mapProject());

    const answer = await bulk(studio, {
      op: "add",
      rawcodes: ["h000", "hfoo"],
      field: "unam",
      value: 1,
    });

    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error).toMatchObject({
      reason: "not-numeric",
      message: expect.stringContaining("unam") as unknown,
    });
    expect((await counts(studio)).undo).toBe(0);
  });

  it("refuses to multiply a field an object of the selection holds no value of", async () => {
    const studio = await start(mapProject());

    // The synthetic install holds no Knight: h001's base has no hit points.
    const answer = await bulk(studio, {
      op: "multiply",
      rawcodes: ["h000", "h001"],
      field: "uhpm",
      value: 2,
    });

    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error).toMatchObject({
      reason: "no-value",
      message: expect.stringContaining("h001") as unknown,
    });
    expect((await rowOf(studio, "h000", "uhpm"))?.modified).toBe(false);
  });

  it("refuses to multiply a field the field table of an object of the selection does not give", async () => {
    const studio = await start(mapProject());

    // Hbz1 is Blizzard's: A000, based on it, has it; AHhb does not.
    const answer = await request(studio, "/api/bulk", {
      json: {
        op: "multiply",
        kind: "ability",
        rawcodes: ["A000", "AHhb"],
        field: "Hbz1",
        level: 1,
        value: 2,
      },
    });

    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error).toMatchObject({
      reason: "no-field",
      message: expect.stringMatching(/^AHhb has no field Hbz1/) as unknown,
    });
    expect((await counts(studio)).undo).toBe(0);
  });

  it("applies every edit kind together as one undo step", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/edits", {
      json: {
        edits: [
          { op: "addObject", kind: "unit", rawcode: "h009", base: "hfoo" },
          {
            op: "setField",
            kind: "unit",
            rawcode: "h009",
            field: "uhpm",
            value: 300,
          },
          { op: "removeField", kind: "unit", rawcode: "h000", field: "unam" },
          { op: "removeObject", kind: "unit", rawcode: "h001" },
        ],
      },
    });

    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({ undo: 1, redo: 0 });
    expect((await rowOf(studio, "h009", "uhpm"))?.value).toBe(300);
    expect((await rowOf(studio, "h000", "unam"))?.modified).toBe(false);
    expect((await request(studio, "/api/objects/h001?kind=unit")).status).toBe(
      404,
    );

    expect((await request(studio, "/api/undo", { json: {} })).body).toEqual({
      unsavedEdits: 0,
      undo: 0,
      redo: 1,
    });
    expect((await rowOf(studio, "h000", "unam"))?.value).toBe("Captain");
    expect((await rowOf(studio, "h001", "unam"))?.value).toBe("Chevalier Élu");
    expect((await request(studio, "/api/objects/h009?kind=unit")).status).toBe(
      404,
    );
  });

  it("refuses a whole selection when the editor refuses one of its values", async () => {
    const studio = await start(mapProject());

    const answer = await bulk(studio, {
      op: "set",
      rawcodes: ["h000", "hfoo"],
      field: "uhpm",
      value: "many",
    });

    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error.reason).toBe("invalid-value");
    expect(await counts(studio)).toMatchObject({ unsavedEdits: 0, undo: 0 });
  });

  it("refuses a selection that holds an Object definition, naming its file", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const studio = await start(project);

    const answer = await bulk(studio, {
      op: "set",
      rawcodes: ["hfoo", "h002"],
      field: "uhpm",
      value: 500,
    });

    expect(answer.status).toBe(409);
    expect((answer.body as ErrorAnswer).error).toEqual({
      reason: "object-definition",
      message:
        "h002 is an Object definition of src/objects/units.ts: edit it there.",
      file: "src/objects/units.ts",
    });
    expect((await rowOf(studio, "hfoo", "uhpm"))?.modified).toBe(false);

    // The Table mode shows it among the map's objects, read-only.
    const table = (await request(studio, "/api/table?kind=unit"))
      .body as TableAnswer;
    const row = table.rows.find((candidate) => candidate.rawcode === "h002");
    expect(row?.origin).toBe("definition");
    expect(row?.cells.every((cell) => cell?.editable !== true)).toBe(true);
  });

  it("refuses an unknown object and a malformed body", async () => {
    const studio = await start(mapProject());

    const unknown = await bulk(studio, {
      op: "set",
      rawcodes: ["h000", "hzzz"],
      field: "uhpm",
      value: 500,
    });
    expect(unknown.status).toBe(404);
    expect((unknown.body as ErrorAnswer).error).toMatchObject({
      reason: "unknown-object",
      message: expect.stringContaining("hzzz") as unknown,
    });

    for (const body of [
      { op: "divide", rawcodes: ["h000"], field: "uhpm", value: 2 },
      { op: "set", rawcodes: "h000", field: "uhpm", value: 2 },
      { op: "add", rawcodes: ["h000"], field: "uhpm", value: "2" },
      { op: "set", rawcodes: ["h000"], field: "uhpm" },
      { op: "set", rawcodes: [], field: "uhpm", value: 2 },
    ]) {
      expect((await bulk(studio, body)).status).toBe(400);
    }
  });

  it("keeps a bulk edit's undo and redo across a save", async () => {
    const project = mapProject();
    const studio = await start(project);
    await bulk(studio, {
      op: "set",
      rawcodes: ["h000", "h001"],
      field: "uhpm",
      value: 900,
    });
    await request(studio, "/api/save", { json: {} });
    expect(onDisk(project, "h001", "uhpm")).toBe(900);

    expect((await request(studio, "/api/undo", { json: {} })).body).toEqual({
      unsavedEdits: 2,
      undo: 0,
      redo: 1,
    });
    await request(studio, "/api/save", { json: {} });
    expect(onDisk(project, "h000", "uhpm")).toBeUndefined();
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();

    await request(studio, "/api/redo", { json: {} });
    expect((await rowOf(studio, "h000", "uhpm"))?.value).toBe(900);
    expect((await rowOf(studio, "h001", "uhpm"))?.value).toBe(900);
  });
});

describe("the Table mode of the Studio", () => {
  /** The table of units, with the query given. */
  async function table(studio: Studio, query = ""): Promise<TableAnswer> {
    const answer = await request(studio, `/api/table?kind=unit${query}`);
    expect(answer.status).toBe(200);
    return answer.body as TableAnswer;
  }

  /** A row's cell of a column, by the column's field and level. */
  function cell(
    answer: TableAnswer,
    rawcode: string,
    field: string,
    level?: number,
  ) {
    const column = answer.columns.findIndex(
      (candidate) => candidate.id === field && candidate.level === level,
    );
    if (column === -1) return undefined;
    return answer.rows.find((row) => row.rawcode === rawcode)?.cells[column];
  }

  it("shows the map's objects and the changed columns by default", async () => {
    const studio = await start(mapProject());

    const answer = await table(studio);

    expect(answer.kind).toBe("unit");
    expect(answer.rows.map((row) => [row.rawcode, row.origin])).toEqual([
      ["h000", "custom"],
      ["h001", "custom"],
      ["hfoo", "modified"],
    ]);
    expect(answer.columns.map((column) => column.id)).toEqual(["unam"]);
    expect(answer.columns[0]).toMatchObject({
      id: "unam",
      input: "text",
      valueType: "string",
    });
    expect(cell(answer, "h000", "unam")).toMatchObject({
      display: "Captain",
      value: "Captain",
      modified: true,
      unsaved: false,
      editable: true,
    });
  });

  it("shows every object and every column with the toggles", async () => {
    const studio = await start(mapProject());

    const everything = await table(studio, "&objects=all&fields=all");

    expect(everything.rows.map((row) => row.rawcode)).toEqual(
      expect.arrayContaining(["h000", "h001", "hfoo", "Hpal", "htow"]),
    );
    expect(everything.columns.map((column) => column.id)).toEqual(
      expect.arrayContaining(["unam", "uhpm", "ua1t", "uico"]),
    );
    expect(cell(everything, "Hpal", "uhpm")).toMatchObject({
      display: "650",
      value: "650",
      modified: false,
      editable: true,
    });
    // h001's base holds no hit points: a cell with no value.
    expect(cell(everything, "h001", "uhpm")).toMatchObject({
      modified: false,
    });
    expect(cell(everything, "h001", "uhpm")?.value).toBeUndefined();

    const columns = await table(studio, "&fields=all");
    expect(columns.rows).toHaveLength(3);
    expect(columns.columns.length).toBe(everything.columns.length);
  });

  it("follows the working state: a filled column shows, unsaved, as a changed column", async () => {
    const studio = await start(mapProject());

    // Filling a column is a set on the rows shown, one step.
    await bulk(studio, {
      op: "set",
      rawcodes: ["h000", "h001", "hfoo"],
      field: "uhpm",
      value: 777,
    });

    const answer = await table(studio);
    expect(answer.columns.map((column) => column.id)).toEqual(["unam", "uhpm"]);
    expect(cell(answer, "h001", "uhpm")).toMatchObject({
      value: 777,
      display: "777",
      modified: true,
      unsaved: true,
    });
    expect((await counts(studio)).undo).toBe(1);
  });

  it("refuses a table without its Object kind", async () => {
    const studio = await start(mapProject());

    for (const query of ["", "?kind=units"]) {
      const answer = await request(studio, `/api/table${query}`);
      expect(answer.status).toBe(400);
    }
  });
});
