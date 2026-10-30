/**
 * Seam 1 for editing in the Studio (#834): edits, resets, undo and redo,
 * the save behind the World Editor check, the reload in the World Editor
 * and the diffs, through the HTTP API. The World Editor check and the
 * reload are driven through the options `reforged-map`'s editor and Object
 * sync tests take: a stand-in for the windows' titles and a stand-in
 * launcher.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { openObjectData } from "reforged-map";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type {
  DiffAnswer,
  ErrorAnswer,
  FieldRow,
  RawcodeAnswer,
  SaveAnswer,
  SaveRefusedAnswer,
  SessionCounts,
} from "../src/index.js";
import {
  closeStudios,
  LOCALES_FIXTURE,
  makeTempDir,
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
  kind?: string,
  level?: number,
): Promise<FieldRow | undefined> {
  const found = (
    await request(
      studio,
      `/api/objects/${rawcode}${kind === undefined ? "" : `?kind=${kind}`}`,
    )
  ).body as RawcodeAnswer;
  if (found.status !== "known") throw new Error(found.status);
  return found.selected?.fields.find(
    (row) => row.id === field && (level === undefined || row.level === level),
  );
}

/** Sets fields of units through the API, as one step. */
function setUnitFields(
  studio: Studio,
  fields: readonly (readonly [string, string, number | string])[],
) {
  return request(studio, "/api/edits", {
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
}

/** A unit's value in the map folder on disk, read with `reforged-map`'s editor. */
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

/** The title of a World Editor window holding the map folder, with unsaved edits or not. */
const title = (project: Project, modified: boolean): string =>
  `Warcraft III World Editor - [${project.mapFolder}${modified ? " *" : ""}]`;

/** A World Editor stand-in: the titles the check reads, and the reloads launched. */
function worldEditor(project: Project) {
  const state = {
    titles: [] as string[],
    launched: [] as (readonly [string, readonly string[]])[],
    executable: path.join(makeTempDir("world-editor"), "World Editor.exe"),
  };
  fs.writeFileSync(state.executable, "");
  return {
    state,
    options: {
      worldEditorCheck: { readWindowTitles: () => state.titles },
      worldEditorExecutable: state.executable,
      worldEditorReload: {
        system: "windows" as const,
        launch: (executable: string, args: readonly string[]) => {
          state.launched.push([executable, args]);
        },
      },
    },
    open: () => {
      state.titles = [title(project, false)];
    },
    modified: () => {
      state.titles = [title(project, true)];
    },
  };
}

describe("editing in the Studio", () => {
  it("refuses an invalid value at once with the editor's reason and message", async () => {
    const studio = await start(mapProject());

    const answer = await setUnitFields(studio, [["h000", "uhpm", "many"]]);

    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error).toMatchObject({
      reason: "invalid-value",
      message: expect.stringContaining("uhpm") as unknown,
    });
  });

  it("refuses translations from the API: a field's default text only is edited", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h000",
            field: "unam",
            value: "Major",
            translations: { deDE: "Major" },
          },
        ],
      },
    });

    expect(answer.status).toBe(400);
  });

  it("gives each field the input of its type and says which fields an unsaved edit changed", async () => {
    const studio = await start(mapProject());

    expect(await rowOf(studio, "h000", "uhpm")).toMatchObject({
      input: "integer",
      valueType: "int",
      unsaved: false,
    });
    expect(await rowOf(studio, "h000", "unam")).toMatchObject({
      input: "text",
      valueType: "string",
      localizable: true,
    });
    expect(await rowOf(studio, "h000", "uico")).toMatchObject({
      input: "icon",
    });
    const attack = await rowOf(studio, "h000", "ua1t");
    expect(attack).toMatchObject({ input: "select", valueType: "string" });
    expect(attack?.options).toContainEqual({
      value: "normal",
      label: "Normal",
    });

    await setUnitFields(studio, [["h000", "uhpm", 600]]);
    expect(await rowOf(studio, "h000", "uhpm")).toMatchObject({
      value: 600,
      modified: true,
      unsaved: true,
    });
  });

  it("gives a Rawcode list its objects, each with its kind and name", async () => {
    const studio = await start(mapProject());

    await setUnitFields(studio, [["h000", "uabi", "AHhb,A000,Zzzz"]]);

    expect(await rowOf(studio, "h000", "uabi")).toMatchObject({
      input: "rawcodes",
      of: "ability",
      references: [
        { rawcode: "AHhb", kind: "ability" },
        { rawcode: "A000", kind: "ability", name: "Arctic Blizzard" },
        { rawcode: "Zzzz" },
      ],
    });
  });

  it("undoes a step by applying its edits' inverses in reverse, and redoes it", async () => {
    const studio = await start(mapProject());
    await setUnitFields(studio, [
      ["h000", "uhpm", 600],
      ["h000", "uhpm", 700],
      ["h000", "unam", "Major"],
    ]);

    const undone = await request(studio, "/api/undo", { json: {} });
    expect(undone.body).toEqual({ unsavedEdits: 0, undo: 0, redo: 1 });
    expect((await rowOf(studio, "h000", "uhpm"))?.modified).toBe(false);
    expect((await rowOf(studio, "h000", "unam"))?.value).toBe("Captain");

    const redone = await request(studio, "/api/redo", { json: {} });
    expect(redone.body).toEqual({ unsavedEdits: 2, undo: 1, redo: 0 });
    expect((await rowOf(studio, "h000", "uhpm"))?.value).toBe(700);
    expect((await rowOf(studio, "h000", "unam"))?.value).toBe("Major");

    await request(studio, "/api/undo", { json: {} });
    const nothing = await request(studio, "/api/undo", { json: {} });
    expect(nothing.status).toBe(409);
    expect((nothing.body as ErrorAnswer).error.reason).toBe("nothing-to-undo");
  });

  it("resets a field to its base, a Custom object to its base and a modified Built-in object to the Built-in object", async () => {
    const studio = await start(mapProject());

    const field = await request(studio, "/api/reset", {
      json: { kind: "unit", rawcode: "h000", field: "unam" },
    });
    expect(field.body).toEqual({ unsavedEdits: 1, undo: 1, redo: 0 });
    expect((await rowOf(studio, "h000", "unam"))?.modified).toBe(false);

    await setUnitFields(studio, [["h001", "uhpm", 900]]);
    await request(studio, "/api/reset", {
      json: { kind: "unit", rawcode: "h001" },
    });
    const custom = (await request(studio, "/api/objects/h001"))
      .body as RawcodeAnswer;
    if (custom.status !== "known") throw new Error(custom.status);
    expect(custom.selected).toMatchObject({ origin: "custom" });
    expect(custom.selected?.fields.some((row) => row.modified)).toBe(false);

    await request(studio, "/api/reset", {
      json: { kind: "unit", rawcode: "hfoo" },
    });
    const builtin = (await request(studio, "/api/objects/hfoo"))
      .body as RawcodeAnswer;
    if (builtin.status !== "known") throw new Error(builtin.status);
    expect(builtin.selected).toMatchObject({
      origin: "builtin",
      name: "Footman",
    });

    // Each reset is one step: four undos give the map folder back.
    for (let step = 0; step < 4; step++) {
      await request(studio, "/api/undo", { json: {} });
    }
    expect(
      ((await request(studio, "/api/session")).body as SessionCounts)
        .unsavedEdits,
    ).toBe(0);
    expect((await rowOf(studio, "hfoo", "unam"))?.value).toBe("Militia");
  });

  it("keeps a field's translations, read-only, through an edit of its default text", async () => {
    const project = mapProject({}, LOCALES_FIXTURE);
    const studio = await start(project);
    const before = await rowOf(studio, "h000", "unam");
    expect(before?.translations).toEqual({
      deDE: expect.any(String) as unknown,
      ptBR: expect.any(String) as unknown,
    });

    await setUnitFields(studio, [["h000", "unam", "Footman of Locales"]]);
    const after = await rowOf(studio, "h000", "unam");
    expect(after).toMatchObject({
      value: "Footman of Locales",
      translations: before?.translations,
    });

    expect((await request(studio, "/api/save", { json: {} })).status).toBe(200);
    const saved = openObjectData(project.mapFolder, {
      projectRoot: project.root,
    })
      .objects("unit")
      .find((object) => object.rawcode === "h000")
      ?.modifications.find((modification) => modification.field === "unam");
    expect(saved).toMatchObject({
      value: "Footman of Locales",
      translations: before?.translations,
    });
  });
});

describe("saving in the Studio", () => {
  it("writes the edited files to the map folder and has no unsaved edit after", async () => {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();

    const saved = await request(studio, "/api/save", { json: {} });

    expect(saved.status).toBe(200);
    expect(saved.body).toEqual({
      written: ["war3map.w3u"],
      worldEditor: "no-window",
      reload: "none",
      unsavedEdits: 0,
      undo: 1,
      redo: 0,
    } satisfies SaveAnswer);
    expect(onDisk(project, "h001", "uhpm")).toBe(700);
    expect((await rowOf(studio, "h001", "uhpm"))?.unsaved).toBe(false);
  });

  it("keeps undo and redo across a save: an undo after it makes the map dirty again", async () => {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    await request(studio, "/api/save", { json: {} });

    const undone = await request(studio, "/api/undo", { json: {} });
    expect(undone.body).toEqual({ unsavedEdits: 1, undo: 0, redo: 1 });
    expect((await rowOf(studio, "h001", "uhpm"))?.modified).toBe(false);

    const saved = await request(studio, "/api/save", { json: {} });
    expect((saved.body as SaveAnswer).written).toEqual(["war3map.w3u"]);
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();

    await request(studio, "/api/redo", { json: {} });
    expect((await rowOf(studio, "h001", "uhpm"))?.value).toBe(700);
  });

  it("refuses to save while the World Editor shows unsaved edits, keeping every edit", async () => {
    const project = mapProject();
    const editor = worldEditor(project);
    const studio = await start(project, editor.options);
    editor.modified();
    await setUnitFields(studio, [["h001", "uhpm", 700]]);

    const refused = await request(studio, "/api/save", {
      json: { reloadWorldEditor: true },
    });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({
      error: { reason: "modified-in-world-editor" },
      unsavedEdits: 1,
      undo: 1,
    } satisfies Partial<SaveRefusedAnswer>);
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();
    expect((await rowOf(studio, "h001", "uhpm"))?.value).toBe(700);
    expect(editor.state.launched).toEqual([]);
  });

  it("refuses to save a map folder changed on disk, reads it again and replays every unsaved edit on top", async () => {
    const project = mapProject();
    const studio = await start(project);
    await setUnitFields(studio, [
      ["h001", "uhpm", 700],
      ["h000", "unam", "Major"],
    ]);
    // Another editor saves the map folder in between.
    const other = openObjectData(project.mapFolder, {
      projectRoot: project.root,
    });
    other.setField({ kind: "unit", rawcode: "h001", field: "umvs" }, 400);
    other.save(undefined, { worldEditorCheck: false });

    const refused = await request(studio, "/api/save", { json: {} });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({
      error: { reason: "changed-on-disk", file: "war3map.w3u" },
      unsavedEdits: 2,
      replayed: 2,
      notReplayed: [],
    } satisfies Partial<SaveRefusedAnswer>);
    expect((await rowOf(studio, "h001", "uhpm"))?.value).toBe(700);
    expect((await rowOf(studio, "h000", "unam"))?.value).toBe("Major");
    expect(onDisk(project, "h001", "uhpm")).toBeUndefined();

    const saved = await request(studio, "/api/save", { json: {} });
    expect(saved.status).toBe(200);
    expect(onDisk(project, "h001", "uhpm")).toBe(700);
    expect(onDisk(project, "h001", "umvs")).toBe(400);
    expect(onDisk(project, "h000", "unam")).toBe("Major");
  });

  it("offers the reload when the World Editor holds the map folder without unsaved edits, and reloads it on request", async () => {
    const project = mapProject();
    const editor = worldEditor(project);
    const studio = await start(project, editor.options);
    editor.open();
    await setUnitFields(studio, [["h001", "uhpm", 700]]);

    const saved = await request(studio, "/api/save", { json: {} });

    expect(saved.body).toMatchObject({
      written: ["war3map.w3u"],
      worldEditor: "open",
      reload: "offered",
    } satisfies Partial<SaveAnswer>);
    expect(editor.state.launched).toEqual([]);

    const reloaded = await request(studio, "/api/reload-world-editor", {
      json: {},
    });
    expect(reloaded.body).toEqual({ reloaded: true });
    expect(editor.state.launched).toEqual([
      [
        editor.state.executable,
        ["-launch", "-loadfile", path.resolve(project.mapFolder)],
      ],
    ]);
  });

  it("reloads the World Editor at once when the page's setting asks", async () => {
    const project = mapProject();
    const editor = worldEditor(project);
    const studio = await start(project, editor.options);
    editor.open();
    await setUnitFields(studio, [["h001", "uhpm", 700]]);

    const saved = await request(studio, "/api/save", {
      json: { reloadWorldEditor: true },
    });

    expect((saved.body as SaveAnswer).reload).toBe("sent");
    expect(editor.state.launched).toHaveLength(1);
  });

  it("never reloads while the World Editor shows unsaved edits", async () => {
    const project = mapProject();
    const editor = worldEditor(project);
    const studio = await start(project, editor.options);
    editor.modified();

    const refused = await request(studio, "/api/reload-world-editor", {
      json: {},
    });

    expect(refused.status).toBe(409);
    expect((refused.body as ErrorAnswer).error.reason).toBe(
      "modified-in-world-editor",
    );
    expect(editor.state.launched).toEqual([]);
  });

  it("offers no reload when nothing was written or no World Editor holds the map folder", async () => {
    const project = mapProject();
    const editor = worldEditor(project);
    const studio = await start(project, editor.options);
    editor.open();

    const nothing = await request(studio, "/api/save", { json: {} });
    expect(nothing.body).toMatchObject({ written: [], reload: "none" });

    editor.state.titles = [];
    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    const closed = await request(studio, "/api/save", { json: {} });
    expect(closed.body).toMatchObject({
      worldEditor: "no-window",
      reload: "none",
    });
  });

  it("says the World Editor's executable is missing when it would offer the reload", async () => {
    const project = mapProject();
    const studio = await start(project, {
      worldEditorCheck: { readWindowTitles: () => [title(project, false)] },
    });
    await setUnitFields(studio, [["h001", "uhpm", 700]]);

    const saved = await request(studio, "/api/save", { json: {} });

    expect((saved.body as SaveAnswer).reload).toBe("no-executable");
  });
});

describe("the Studio's diffs", () => {
  /** Makes the Map project a git repository, every file committed. */
  function commit(project: Project): void {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", project.root, ...args], { stdio: "ignore" });
    git("init", "--quiet");
    git("add", "--all");
    git(
      "-c",
      "user.name=Studio",
      "-c",
      "user.email=studio@example.com",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "--message",
      "The map folder",
    );
  }

  it("shows the unsaved changes in the text of reforged-map's textconv", async () => {
    const studio = await start(mapProject());
    expect((await request(studio, "/api/diff?against=saved")).body).toEqual({
      against: "saved",
      available: true,
      files: [],
    });

    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    const answer = (await request(studio, "/api/diff?against=saved"))
      .body as DiffAnswer;

    if (!answer.available) throw new Error(answer.reason);
    expect(answer.files.map((file) => file.file)).toEqual(["war3map.w3u"]);
    const diff = answer.files[0]?.diff ?? "";
    expect(diff).toMatch(/^--- a\/war3map\.w3u\n\+\+\+ b\/war3map\.w3u\n@@ /);
    expect(diff).toContain("\n custom h001 from hkni\n");
    expect(diff).toContain("\n+  uhpm int = 700\n");
    expect(diff.split("\n").filter((line) => line.startsWith("-"))).toEqual([
      "--- a/war3map.w3u",
    ]);
  });

  it("shows the changes since the last commit, saved or not", async () => {
    const project = mapProject();
    commit(project);
    const studio = await start(project);
    expect(
      ((await request(studio, "/api/diff?against=head")).body as DiffAnswer)
        .available,
    ).toBe(true);

    await setUnitFields(studio, [["h001", "uhpm", 700]]);
    await request(studio, "/api/save", { json: {} });
    await setUnitFields(studio, [["h000", "uhpm", 600]]);

    const head = (await request(studio, "/api/diff?against=head"))
      .body as DiffAnswer;
    if (!head.available) throw new Error(head.reason);
    expect(head.files.map((file) => file.file)).toEqual(["war3map.w3u"]);
    expect(head.files[0]?.diff).toContain("\n+  uhpm int = 700\n");
    expect(head.files[0]?.diff).toContain("\n+  uhpm int = 600\n");

    const unsaved = (await request(studio, "/api/diff?against=saved"))
      .body as DiffAnswer;
    if (!unsaved.available) throw new Error(unsaved.reason);
    expect(unsaved.files[0]?.diff).toContain("\n+  uhpm int = 600\n");
    expect(unsaved.files[0]?.diff).not.toContain("+  uhpm int = 700");
  });

  it("shows no diff since the last commit outside a git repository", async () => {
    const studio = await start(mapProject());

    expect((await request(studio, "/api/diff?against=head")).body).toEqual({
      against: "head",
      available: false,
      reason: expect.stringContaining("not in a git repository") as unknown,
    });
  });
});
