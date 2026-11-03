/**
 * Seam 1 for the turns with the World Editor (#837), through the HTTP API
 * and the event stream: a change on disk with and without unsaved edits,
 * the unsaved edits replayed on top field by field, a conflict listed and
 * chosen, and a World Editor save that puts back fields the Studio saved,
 * detected and applied again or kept. Another editor's save is
 * `reforged-map`'s editor saving the map folder; a stale World Editor's is
 * the map folder's files written back as they were before the Studio's
 * save.
 */
import fs from "node:fs";
import path from "node:path";
import { openObjectData } from "reforged-map";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type {
  Conflict,
  ReloadFromDiskAnswer,
  RawcodeAnswer,
  TurnsAnswer,
  TurnsChangedAnswer,
} from "../src/index.js";
import {
  closeStudios,
  events,
  mapProject,
  removeTemporary,
  request,
  start,
  type Project,
} from "./support/studio.js";

afterEach(closeStudios);
afterAll(removeTemporary);

type Studio = Awaited<ReturnType<typeof start>>;

/** Sets fields of units through the API, as one step. */
async function setUnitFields(
  studio: Studio,
  fields: readonly (readonly [string, string, number | string])[],
): Promise<void> {
  const answer = await request(studio, "/api/edits", {
    json: {
      edits: fields.map(([rawcode, field, value]) => ({
        op: "setField",
        kind: "unit",
        rawcode,
        field,
        value,
      })),
    },
  });
  expect(answer.status).toBe(200);
}

/** Another editor saves fields of units to the map folder. */
function saveOnDisk(
  project: Project,
  fields: readonly (readonly [string, string, number | string])[],
): void {
  const other = openObjectData(project.mapFolder, {
    projectRoot: project.root,
  });
  for (const [rawcode, field, value] of fields) {
    other.setField({ kind: "unit", rawcode, field }, value);
  }
  other.save(undefined, { worldEditorCheck: false });
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

/** A unit's value as the Studio shows it, undefined when the map does not modify it. */
async function shown(
  studio: Studio,
  rawcode: string,
  field: string,
): Promise<number | string | undefined> {
  const found = (await request(studio, `/api/objects/${rawcode}?kind=unit`))
    .body as RawcodeAnswer;
  if (found.status !== "known") throw new Error(found.status);
  const row = found.selected?.fields.find(
    (candidate) => candidate.id === field,
  );
  return row?.modified === true ? row.value : undefined;
}

/** The map folder's Object data files, by name, to write back as a stale World Editor does. */
function objectFiles(project: Project): Map<string, Buffer> {
  return new Map(
    fs
      .readdirSync(project.mapFolder)
      .filter((name) =>
        /^war3map(Skin)?\.w3[abdhqtu]$|^war3map\.wts$/.test(name),
      )
      .map((name) => [
        name,
        fs.readFileSync(path.join(project.mapFolder, name)),
      ]),
  );
}

/** Writes files back into the map folder, as a World Editor that never reloaded saves. */
function writeBack(project: Project, files: ReadonlyMap<string, Buffer>): void {
  for (const [name, bytes] of files) {
    fs.writeFileSync(path.join(project.mapFolder, name), bytes);
  }
}

describe("a change on disk", () => {
  it("is read at once with no unsaved edit, nothing to choose", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");

    saveOnDisk(project, [["h001", "uhpm", 800]]);
    const reloaded = await stream.next("reloaded");
    stream.close();

    expect(reloaded.data).toMatchObject({
      unsavedEdits: 0,
      conflicts: 0,
      putBack: 0,
    });
    expect(await shown(studio, "h001", "uhpm")).toBe(800);
    expect((await request(studio, "/api/turns")).body).toEqual({
      conflicts: [],
      putBack: [],
    } satisfies TurnsAnswer);
  });

  it("keeps the unsaved edits, then reloads and replays them on top field by field", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");
    await setUnitFields(studio, [
      ["h001", "uhpm", 700],
      ["h000", "unam", "Major"],
    ]);

    saveOnDisk(project, [["h001", "umvs", 400]]);
    await stream.next("changed-on-disk");
    // Not read over until the author asks.
    expect(await shown(studio, "h001", "umvs")).toBeUndefined();

    const reloaded = await request(studio, "/api/reload-from-disk", {
      json: {},
    });
    const event = await stream.next("reloaded");
    stream.close();

    expect(reloaded.status).toBe(200);
    expect(reloaded.body).toEqual({
      unsavedEdits: 2,
      undo: 1,
      redo: 0,
      replayed: 2,
      notReplayed: [],
      conflicts: [],
      putBack: [],
    } satisfies ReloadFromDiskAnswer);
    expect(event.data).toMatchObject({ unsavedEdits: 2, conflicts: 0 });
    expect(await shown(studio, "h001", "umvs")).toBe(400);
    expect(await shown(studio, "h001", "uhpm")).toBe(700);
    expect(await shown(studio, "h000", "unam")).toBe("Major");

    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    expect(onDisk(project, "h001", "umvs")).toBe(400);
    expect(onDisk(project, "h001", "uhpm")).toBe(700);
    expect(onDisk(project, "h000", "unam")).toBe("Major");
  });

  it("takes a field both sides set to the same value without a conflict", async () => {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    saveOnDisk(project, [["h001", "uhpm", 700]]);

    const reloaded = (
      await request(studio, "/api/reload-from-disk", { json: {} })
    ).body as ReloadFromDiskAnswer;

    expect(reloaded).toMatchObject({ unsavedEdits: 0, conflicts: [] });
    expect(await shown(studio, "h001", "uhpm")).toBe(700);
  });
});

describe("a conflict", () => {
  /** A Studio whose unsaved edits and the disk both changed `uhpm` and `umvs` of `h001`, reloaded. */
  async function conflicted() {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [
      ["h001", "uhpm", 700],
      ["h001", "umvs", 300],
      ["h000", "unam", "Major"],
    ]);
    saveOnDisk(project, [
      ["h001", "uhpm", 800],
      ["h001", "umvs", 400],
    ]);
    const reloaded = (
      await request(studio, "/api/reload-from-disk", { json: {} })
    ).body as ReloadFromDiskAnswer;
    return { project, studio, reloaded };
  }

  it("is listed for each field both sides changed, mine held until the author chooses", async () => {
    const { studio, reloaded } = await conflicted();

    expect(reloaded.replayed).toBe(3);
    expect(reloaded.conflicts).toEqual([
      {
        id: expect.any(String) as string,
        kind: "unit",
        rawcode: "h001",
        field: "uhpm",
        mine: { is: "value", value: 700 },
        theirs: { is: "value", value: 800 },
      },
      {
        id: expect.any(String) as string,
        kind: "unit",
        rawcode: "h001",
        field: "umvs",
        mine: { is: "value", value: 300 },
        theirs: { is: "value", value: 400 },
      },
    ] satisfies Conflict[]);
    expect(await shown(studio, "h001", "uhpm")).toBe(700);
    expect(await shown(studio, "h000", "unam")).toBe("Major");
    expect(
      ((await request(studio, "/api/turns")).body as TurnsAnswer).conflicts,
    ).toHaveLength(2);
  });

  it("refuses a save until each is chosen, then saves mine or theirs as chosen", async () => {
    const { project, studio, reloaded } = await conflicted();
    const [hitPoints, speed] = reloaded.conflicts as [Conflict, Conflict];

    const refused = await request(studio, "/api/save", { json: {} });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({
      error: { reason: "conflicts" },
      conflicts: reloaded.conflicts,
    });
    expect(onDisk(project, "h001", "uhpm")).toBe(800);

    const chosen = await request(studio, "/api/conflicts", {
      json: {
        choices: [
          { id: hitPoints.id, take: "mine" },
          { id: speed.id, take: "theirs" },
        ],
      },
    });
    expect(chosen.status).toBe(200);
    expect(chosen.body).toMatchObject({
      conflicts: [],
      undo: 2,
    } satisfies Partial<TurnsChangedAnswer>);
    expect(await shown(studio, "h001", "umvs")).toBe(400);

    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    expect(onDisk(project, "h001", "uhpm")).toBe(700);
    expect(onDisk(project, "h001", "umvs")).toBe(400);
    expect(onDisk(project, "h000", "unam")).toBe("Major");
  });

  it("refuses a choice of no conflict left", async () => {
    const { studio } = await conflicted();

    const answer = await request(studio, "/api/conflicts", {
      json: { choices: [{ id: "unit:h000 unam 0 0", take: "theirs" }] },
    });

    expect(answer.status).toBe(409);
    expect(answer.body).toMatchObject({ error: { reason: "no-conflict" } });
  });

  it("stays one through a second change on disk until chosen", async () => {
    const { project, studio } = await conflicted();

    saveOnDisk(project, [["h000", "umvs", 250]]);
    const again = (await request(studio, "/api/reload-from-disk", { json: {} }))
      .body as ReloadFromDiskAnswer;

    expect(again.conflicts.map((conflict) => conflict.field)).toEqual([
      "uhpm",
      "umvs",
    ]);
    expect(await shown(studio, "h000", "umvs")).toBe(250);
  });

  it("is listed by a save refused for a change on disk", async () => {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    saveOnDisk(project, [["h001", "uhpm", 800]]);

    const refused = await request(studio, "/api/save", { json: {} });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({
      error: { reason: "changed-on-disk" },
      conflicts: [
        {
          rawcode: "h001",
          field: "uhpm",
          mine: { is: "value", value: 700 },
          theirs: { is: "value", value: 800 },
        },
      ],
    });
  });
});

describe("a World Editor save that puts back what the Studio saved", () => {
  /** A Studio that saved `uhpm` and `unam` of `h001`, then a World Editor that never reloaded saved its own state over it. */
  async function reverted() {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");
    const stale = objectFiles(project);
    await setUnitFields(studio, [
      ["h001", "uhpm", 700],
      ["h000", "unam", "Major"],
    ]);
    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    // The stale World Editor writes its war3map.w3u back: h001's hit points
    // are put back, h000's name, in the Skin file, stays the Studio's.
    writeBack(
      project,
      new Map([...stale].filter(([name]) => name === "war3map.w3u")),
    );
    const reloaded = await stream.next("reloaded");
    stream.close();
    return { project, studio, reloaded };
  }

  it("is detected and named", async () => {
    const { studio, reloaded } = await reverted();

    expect(reloaded.data).toMatchObject({ putBack: 1, unsavedEdits: 0 });
    expect((await request(studio, "/api/turns")).body).toEqual({
      conflicts: [],
      putBack: [
        {
          kind: "unit",
          rawcode: "h001",
          field: "uhpm",
          studio: { is: "value", value: 700 },
          worldEditor: { is: "unmodified" },
        },
      ],
    } satisfies TurnsAnswer);
    expect(await shown(studio, "h001", "uhpm")).toBeUndefined();
  });

  it("is applied again as unsaved edits, then saved", async () => {
    const { project, studio } = await reverted();

    const applied = await request(studio, "/api/put-back", {
      json: { action: "apply" },
    });

    expect(applied.status).toBe(200);
    expect(applied.body).toMatchObject({
      unsavedEdits: 1,
      // The reload emptied the stacks; applying them again is one step.
      undo: 1,
      putBack: [],
    } satisfies Partial<TurnsChangedAnswer>);
    expect(await shown(studio, "h001", "uhpm")).toBe(700);
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();

    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    expect(onDisk(project, "h001", "uhpm")).toBe(700);
    expect(onDisk(project, "h000", "unam")).toBe("Major");
  });

  it("is left as the World Editor saved it on request", async () => {
    const { studio } = await reverted();

    const kept = await request(studio, "/api/put-back", {
      json: { action: "keep" },
    });

    expect(kept.body).toMatchObject({
      unsavedEdits: 0,
      putBack: [],
    } satisfies Partial<TurnsChangedAnswer>);
    expect(await shown(studio, "h001", "uhpm")).toBeUndefined();
    expect(
      (await request(studio, "/api/put-back", { json: { action: "keep" } }))
        .body,
    ).toMatchObject({ error: { reason: "nothing-put-back" } });
  });

  it("is not detected when the World Editor sets a field the Studio saved to a third value", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    await request(studio, "/api/save", { json: {} });

    saveOnDisk(project, [["h001", "uhpm", 900]]);
    const reloaded = await stream.next("reloaded");
    stream.close();

    expect(reloaded.data).toMatchObject({ putBack: 0 });
    expect(await shown(studio, "h001", "uhpm")).toBe(900);
  });

  it("names a deleted object put back as a whole", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");
    const stale = objectFiles(project);
    await request(studio, "/api/delete", {
      json: { kind: "unit", rawcode: "h000" },
    });
    await request(studio, "/api/save", { json: {} });

    writeBack(project, stale);
    await stream.next("reloaded");
    stream.close();

    expect(
      ((await request(studio, "/api/turns")).body as TurnsAnswer).putBack,
    ).toEqual([
      {
        kind: "unit",
        rawcode: "h000",
        studio: { is: "absent" },
        worldEditor: { is: "present" },
      },
    ]);
    await request(studio, "/api/put-back", { json: { action: "apply" } });
    await request(studio, "/api/save", { json: {} });
    expect(
      openObjectData(project.mapFolder, { projectRoot: project.root })
        .objects("unit")
        .some((object) => object.rawcode === "h000"),
    ).toBe(false);
  });
});
