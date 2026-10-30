/**
 * Seam 1, the Studio's server through its HTTP API (#831): each test starts
 * the Studio on a Map project whose map folder is a copy of `reforged-map`'s
 * World Editor fixture, with a stand-in for the World Editor check and a
 * synthetic install, and asserts what a host sees: the API's answers and
 * its events.
 */
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { openObjectData, openRawcodeLookup } from "reforged-map";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  InstallNotFoundError,
  startStudio,
  type ErrorAnswer,
  type ListedObject,
  type ObjectsAnswer,
  type RawcodeAnswer,
  type SearchAnswer,
  type SessionAnswer,
} from "../src/index.js";
import {
  closeStudios,
  events,
  makeTempDir,
  mapProject,
  portOf,
  removeTemporary,
  request,
  start,
  syntheticGame,
  write,
  type Project,
} from "./support/studio.js";
import { FOOTMAN_ICON, IMPORTED_ICON } from "./support/images.js";

afterEach(closeStudios);
afterAll(removeTemporary);

/** The Rawcodes of listed objects, each with its kind and origin. */
const keys = (objects: readonly ListedObject[]): string[] =>
  objects.map(({ kind, rawcode, origin }) => `${kind} ${rawcode} ${origin}`);

const SERGEANT = `import { defineUnit } from "reforged-map/objects";

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", uhpm: 500 },
});
`;

describe("the Studio's objects", () => {
  it("lists a kind's objects by origin: the map folder's, then the Built-in objects", async () => {
    const studio = await start(mapProject());

    const custom = (
      await request(studio, "/api/objects?kind=unit&origin=custom")
    ).body as ObjectsAnswer;
    expect(custom.objects).toEqual([
      expect.objectContaining({
        rawcode: "h000",
        kind: "unit",
        origin: "custom",
        name: "Captain",
        base: { rawcode: "hfoo", name: "Footman" },
        inGameDataSet: true,
        shared: false,
      }),
      expect.objectContaining({ rawcode: "h001", name: "Chevalier Élu" }),
    ]);

    const modified = (await request(studio, "/api/objects?origin=modified"))
      .body as ObjectsAnswer;
    expect(keys(modified.objects)).toEqual([
      "unit hfoo modified",
      "item ratc modified",
      "ability AHhb modified",
      "buff Binf modified",
      "destructable LTlt modified",
      "doodad AObr modified",
      "upgrade Rhar modified",
    ]);
    expect(modified.objects[0]).toMatchObject({
      name: "Militia",
      builtinName: "Footman",
    });

    const units = (await request(studio, "/api/objects?kind=unit"))
      .body as ObjectsAnswer;
    expect(keys(units.objects).slice(0, 3)).toEqual([
      "unit h000 custom",
      "unit h001 custom",
      "unit hfoo modified",
    ]);
    expect(units.objects.find((object) => object.rawcode === "Hpal")).toEqual({
      rawcode: "Hpal",
      kind: "unit",
      origin: "builtin",
      name: "Paladin",
      builtinName: "Paladin",
      group: ["Human", "Melee", "Heroes"],
      inGameDataSet: true,
      shared: false,
    });
    expect(
      units.objects.find((object) => object.rawcode === "hfoo")?.origin,
    ).toBe("modified");
  });

  it("lists an Object definition as the code's, with its file", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const studio = await start(project);

    const listed = (
      await request(studio, "/api/objects?kind=unit&origin=definition")
    ).body as ObjectsAnswer;
    expect(listed.objects).toEqual([
      expect.objectContaining({
        rawcode: "h002",
        origin: "definition",
        name: "Sergeant",
        base: { rawcode: "hfoo", name: "Footman" },
        definition: {
          file: path.join(project.root, "src", "objects", "units.ts"),
          path: "src/objects/units.ts",
        },
      }),
    ]);
  });

  it("hides the Built-in objects outside the map's Game data set, and shows them marked on request", async () => {
    // The fixture's set is Melee (Forsaken Kingdom); Pillage (`Asa2`) is in
    // Custom (The Frozen Throne) only.
    const studio = await start(mapProject());

    const shown = (
      await request(studio, "/api/objects?kind=ability&origin=builtin")
    ).body as ObjectsAnswer;
    expect(shown.gameDataSet).toEqual({
      id: "melee-fk",
      label: "Melee (Forsaken Kingdom)",
    });
    expect(shown.objects.some((object) => object.rawcode === "Asa2")).toBe(
      false,
    );
    expect(shown.objects.every((object) => object.inGameDataSet)).toBe(true);

    const all = (
      await request(studio, "/api/objects?kind=ability&origin=builtin&all=1")
    ).body as ObjectsAnswer;
    expect(
      all.objects.find((object) => object.rawcode === "Asa2"),
    ).toMatchObject({
      name: "Pillage",
      inGameDataSet: false,
    });
  });

  it("refuses an unknown kind or origin", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/objects?kind=hero");
    expect(answer.status).toBe(400);
    expect((answer.body as ErrorAnswer).error.reason).toBe("bad-request");
  });
});

describe("the Studio's search", () => {
  it("finds objects of every kind by name, in each kind the map's first", async () => {
    const studio = await start(mapProject());

    const found = (await request(studio, "/api/search?q=captain"))
      .body as SearchAnswer;
    const mapObjects = found.objects.filter(
      (object) => object.origin !== "builtin",
    );
    expect(keys(mapObjects)).toEqual([
      "unit h000 custom",
      "item I000 custom",
      "doodad D000 custom",
    ]);
    expect(found.objects.slice(0, 1)).toEqual(mapObjects.slice(0, 1));
    expect(
      found.objects.find((object) => object.rawcode === "Hctl"),
    ).toMatchObject({ origin: "builtin" });
  });

  it("finds an object by its Rawcode first, then by name", async () => {
    const studio = await start(mapProject());

    const found = (await request(studio, "/api/search?q=hfoo"))
      .body as SearchAnswer;
    expect(keys(found.objects)[0]).toBe("unit hfoo modified");
    expect(found.suggestions).toBeUndefined();
  });

  it("finds both objects of a Rawcode two kinds share", async () => {
    const studio = await start(mapProject());

    const found = (await request(studio, "/api/search?q=B000"))
      .body as SearchAnswer;
    expect(keys(found.objects).slice(0, 2)).toEqual([
      "buff B000 custom",
      "destructable B000 custom",
    ]);
    expect(found.objects[0]?.shared).toBe(true);
  });

  it("gives the lookup's suggestions for an unknown Rawcode", async () => {
    const project = mapProject();
    const studio = await start(project);

    const found = (await request(studio, "/api/search?q=h00Z"))
      .body as SearchAnswer;
    const lookup = openRawcodeLookup({
      mapFolder: project.mapFolder,
      projectRoot: project.root,
    }).lookup("h00Z");
    expect(lookup.status).toBe("unknown");
    expect(found.suggestions).toEqual(
      lookup.status === "unknown" ? lookup.suggestions : undefined,
    );
    expect(
      found.suggestions?.map((suggestion) => suggestion.rawcode),
    ).toContain("h000");
  });
});

describe("the Studio's deep links, /objects/<rawcode>", () => {
  it("selects a known object, with its field table and base values", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/objects/hfoo");
    expect(answer.status).toBe(200);
    const found = answer.body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(found.objects).toHaveLength(1);
    expect(found.selected).toMatchObject({
      rawcode: "hfoo",
      origin: "modified",
      name: "Militia",
    });
    const fields = found.selected?.fields ?? [];
    expect(fields.find((row) => row.id === "unam")).toEqual({
      id: "unam",
      label: "Text - Name",
      type: "string",
      category: "text",
      base: "Footman",
      baseDisplay: "Footman",
      value: "Militia",
      stored: expect.stringMatching(/^TRIGSTR_\d+$/) as string,
      display: "Militia",
      modified: true,
    });
    expect(fields.find((row) => row.id === "uhpm")).toEqual({
      id: "uhpm",
      label: "Stats - Hit Points Maximum (Base)",
      type: "int",
      category: "stats",
      base: "420",
      baseDisplay: "420",
      display: "420",
      modified: false,
    });
  });

  it("gives a field of levels one row per level, and a Custom object its base's values", async () => {
    const studio = await start(mapProject());

    const found = (await request(studio, "/api/objects/A000"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    const cooldown = found.selected?.fields.filter((row) => row.id === "acdn");
    expect(cooldown).toEqual([
      expect.objectContaining({ level: 1, base: "6", modified: false }),
      expect.objectContaining({ level: 2, base: "6", modified: false }),
      expect.objectContaining({ level: 3, base: "6", modified: false }),
    ]);
    // `amcs` is not in the synthetic install: the modification's own row.
    expect(found.selected?.fields.filter((row) => row.id === "amcs")).toEqual([
      {
        id: "amcs",
        level: 1,
        value: 80,
        stored: 80,
        display: "80",
        modified: true,
      },
      {
        id: "amcs",
        level: 2,
        value: 100,
        stored: 100,
        display: "100",
        modified: true,
      },
      {
        id: "amcs",
        level: 3,
        value: 120,
        stored: 120,
        display: "120",
        modified: true,
      },
    ]);
  });

  it("answers both objects of a shared Rawcode without ?kind=, and selects one with it", async () => {
    const studio = await start(mapProject());

    const both = (await request(studio, "/api/objects/B000"))
      .body as RawcodeAnswer;
    if (both.status !== "known") throw new Error(both.status);
    expect(keys(both.objects)).toEqual([
      "buff B000 custom",
      "destructable B000 custom",
    ]);
    expect(both.selected).toBeUndefined();

    const one = (await request(studio, "/api/objects/B000?kind=destructable"))
      .body as RawcodeAnswer;
    if (one.status !== "known") throw new Error(one.status);
    expect(one.selected).toMatchObject({ kind: "destructable", name: "Gate" });
  });

  it("answers an unknown Rawcode with 404 and the lookup's suggestions", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/objects/h00Z");
    expect(answer.status).toBe(404);
    expect(answer.body).toMatchObject({
      status: "unknown",
      rawcode: "h00Z",
      suggestions: expect.arrayContaining([
        { rawcode: "h000", name: "Captain", kind: "unit" },
      ]) as unknown,
    });
  });

  it("answers a Built-in object outside the map's Game data set as outside it", async () => {
    const studio = await start(mapProject());

    const found = (await request(studio, "/api/objects/Asa2"))
      .body as RawcodeAnswer;
    expect(found).toMatchObject({
      status: "not-in-game-data-set",
      gameDataSet: { id: "melee-fk" },
      selected: { rawcode: "Asa2", inGameDataSet: false },
    });
  });

  it("answers a malformed Rawcode with 400", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/objects/hfo");
    expect(answer.status).toBe(400);
    expect(answer.body).toEqual({ status: "malformed", rawcode: "hfo" });
  });

  it("serves the page at /objects/<rawcode>, with nothing from another origin", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/objects/hfoo");
    expect([200, 503]).toContain(answer.status);
    expect(answer.headers["content-security-policy"]).toContain(
      "default-src 'self'",
    );
  });
});

describe("the Studio's tree", () => {
  it("gives each Built-in object the install holds its group in the World Editor's tree, labelled from the editor data", async () => {
    const studio = await start(mapProject());

    const listed = (await request(studio, "/api/objects?origin=builtin&all=1"))
      .body as ObjectsAnswer;
    const groupOf = (kind: string, rawcode: string) =>
      listed.objects.find(
        (object) => object.kind === kind && object.rawcode === rawcode,
      )?.group;
    expect(groupOf("unit", "Hpal")).toEqual(["Human", "Melee", "Heroes"]);
    expect(groupOf("unit", "htow")).toEqual(["Human", "Melee", "Buildings"]);
    // A race the editor strings do not label keeps its raw value.
    expect(groupOf("unit", "nmrl")).toEqual(["naga", "Campaign", "Units"]);
    expect(groupOf("unit", "zcso")).toEqual(["Other", "Melee", "Special"]);
    expect(groupOf("item", "ratf")).toEqual(["Permanent"]);
    expect(groupOf("ability", "AHbz")).toEqual(["Human", "Heroes"]);
    expect(groupOf("buff", "BHbz")).toEqual(["Human", "Effects"]);
    expect(groupOf("upgrade", "Rhme")).toEqual(["Human"]);
    // `hkni` is Built-in, but the synthetic install does not hold it.
    expect(groupOf("unit", "hkni")).toBeUndefined();
  });

  it("gives each object its icon's path, its own modification over its base's", async () => {
    const studio = await start(mapProject());
    const iconOf = async (rawcode: string) =>
      (
        (await request(studio, "/api/objects?kind=unit")).body as ObjectsAnswer
      ).objects.find((object) => object.rawcode === rawcode)?.icon;

    expect(await iconOf("hfoo")).toBe(
      "ReplaceableTextures\\CommandButtons\\BTNFootman.blp",
    );
    expect(await iconOf("h000")).toBe(
      "ReplaceableTextures\\CommandButtons\\BTNFootman.blp",
    );
    expect(await iconOf("Hpal")).toBeUndefined();

    await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h000",
            field: "uico",
            value: "war3mapImported\\BTNCaptain.blp",
          },
        ],
      },
    });
    expect(await iconOf("h000")).toBe("war3mapImported\\BTNCaptain.blp");
    const detail = (await request(studio, "/api/objects/h000"))
      .body as RawcodeAnswer;
    expect(detail).toMatchObject({
      selected: { icon: "war3mapImported\\BTNCaptain.blp" },
    });
  });
});

describe("the Studio's field table", () => {
  it("gives each value as the editor shows it beside its raw value: an enumeration's label, an editor string resolved", async () => {
    const studio = await start(mapProject());

    await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "hfoo",
            field: "ua1t",
            value: "pierce",
          },
        ],
      },
    });
    const footman = (await request(studio, "/api/objects/hfoo"))
      .body as RawcodeAnswer;
    if (footman.status !== "known") throw new Error(footman.status);
    expect(
      footman.selected?.fields.find((row) => row.id === "ua1t"),
    ).toMatchObject({
      base: "normal",
      baseDisplay: "Normal",
      value: "pierce",
      stored: "pierce",
      display: "Pierce",
      modified: true,
    });

    const tree = (await request(studio, "/api/objects/LTlt"))
      .body as RawcodeAnswer;
    if (tree.status !== "known") throw new Error(tree.status);
    expect(
      tree.selected?.fields.find((row) => row.id === "bnam"),
    ).toMatchObject({
      base: "WESTRING_DEST_TREE",
      baseDisplay: "Lordaeron Summer Tree Wall",
      display: "Lordaeron Summer Tree Wall",
    });
  });
});

describe("the Studio's files, /api/files?path=", () => {
  it("serves an icon from the map folder's imports first, then from the install's art layer", async () => {
    const project = mapProject();
    fs.mkdirSync(path.join(project.mapFolder, "war3mapImported"));
    fs.writeFileSync(
      path.join(project.mapFolder, "war3mapImported", "BTNCaptain.blp"),
      IMPORTED_ICON,
    );
    const studio = await start(project);

    const imported = await request(
      studio,
      `/api/files?path=${encodeURIComponent("war3mapImported\\BTNCaptain.blp")}`,
    );
    expect(imported.status).toBe(200);
    expect(imported.headers["content-type"]).toBe("application/octet-stream");
    expect(imported.headers["x-content-type-options"]).toBe("nosniff");
    expect(new Uint8Array(imported.bytes)).toEqual(IMPORTED_ICON);

    // The skin file names a `.blp`; the HD layer holds its `.dds`.
    const footman = await request(
      studio,
      `/api/files?path=${encodeURIComponent("ReplaceableTextures\\CommandButtons\\BTNFootman.blp")}`,
    );
    expect(footman.status).toBe(200);
    expect(new Uint8Array(footman.bytes)).toEqual(FOOTMAN_ICON);
  });

  it("answers 404 for a path found nowhere, and 400 without a path", async () => {
    const studio = await start(mapProject());

    const missing = await request(
      studio,
      "/api/files?path=ReplaceableTextures/CommandButtons/BTNNowhere.blp",
    );
    expect(missing.status).toBe(404);
    expect((missing.body as ErrorAnswer).error.reason).toBe("not-found");

    const none = await request(studio, "/api/files");
    expect(none.status).toBe(400);
  });
});

describe("the Studio's Object definitions", () => {
  it("shows an Object definition read-only, with the line of its Rawcode", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const studio = await start(project);

    const found = (await request(studio, "/api/objects/h002"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(found.selected?.readOnly).toEqual({
      file: path.join(project.root, "src", "objects", "units.ts"),
      path: "src/objects/units.ts",
      line: 4,
    });
  });

  it("refuses an edit of an object the code owns, naming its file", async () => {
    const studio = await start(
      mapProject({ "src/objects/units.ts": SERGEANT }),
    );

    const answer = await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h002",
            field: "uhpm",
            value: 600,
          },
        ],
      },
    });
    expect(answer.status).toBe(409);
    expect((answer.body as ErrorAnswer).error).toEqual({
      reason: "object-definition",
      message:
        "h002 is an Object definition of src/objects/units.ts: edit it there.",
      file: "src/objects/units.ts",
    });
    expect(
      ((await request(studio, "/api/session")).body as SessionAnswer)
        .unsavedEdits,
    ).toBe(0);
  });

  it("refuses every edit while the Object definitions cannot be loaded", async () => {
    const studio = await start(
      mapProject({
        "src/objects/broken.ts": 'throw new Error("broken");\n',
      }),
    );

    const answer = await request(studio, "/api/edits", {
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
    expect(answer.status).toBe(503);
    expect((answer.body as ErrorAnswer).error.reason).toBe("unavailable");
  });

  /** A folder holding a stand-in `code` command, which writes its arguments to `out`. */
  function codeOnPath(out: string): string {
    const bin = makeTempDir("bin");
    const script = path.join(bin, "record.cjs");
    fs.writeFileSync(
      script,
      `require("node:fs").writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)));\n`,
    );
    fs.writeFileSync(
      path.join(bin, "code"),
      `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`,
      { mode: 0o755 },
    );
    fs.writeFileSync(
      path.join(bin, "code.cmd"),
      `@"${process.execPath}" "${script}" %*\r\n`,
    );
    return bin;
  }

  /** Waits for a file to be written, at most five seconds. */
  async function written(file: string): Promise<unknown> {
    for (let tries = 0; tries < 100; tries++) {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, "utf8");
        if (text !== "") return JSON.parse(text) as unknown;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`${file} was not written.`);
  }

  it("opens an Object definition in VS Code at its line", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const out = path.join(makeTempDir("out"), "args.json");
    const studio = await start(project, {
      env: { PATH: codeOnPath(out), PATHEXT: ".CMD;.EXE" },
    });

    const answer = await request(studio, "/api/open-in-editor", {
      json: { kind: "unit", rawcode: "h002" },
    });
    const file = path.join(project.root, "src", "objects", "units.ts");
    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({ editor: "code", file, line: 4 });
    expect(await written(out)).toEqual(["-g", `${file}:4`]);
  });

  it("opens it with $VISUAL without VS Code, and says when no editor is found", async () => {
    const project = mapProject({ "src/objects/units.ts": SERGEANT });
    const out = path.join(makeTempDir("out"), "args.json");
    const script = path.join(makeTempDir("visual"), "visual.cjs");
    fs.writeFileSync(
      script,
      `require("node:fs").writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)));\n`,
    );
    const empty = makeTempDir("empty");
    const visual = await start(project, {
      env: { PATH: empty, VISUAL: `"${process.execPath}" "${script}"` },
    });

    const opened = await request(visual, "/api/open-in-editor", {
      json: { kind: "unit", rawcode: "h002" },
    });
    expect(opened.body).toMatchObject({ editor: "VISUAL", line: 4 });
    expect(await written(out)).toEqual([
      path.join(project.root, "src", "objects", "units.ts"),
    ]);

    // A second Studio on the map folder would open the first one's.
    await visual.close();
    const none = await start(project, { env: { PATH: empty } });
    const refused = await request(none, "/api/open-in-editor", {
      json: { kind: "unit", rawcode: "h002" },
    });
    expect(refused.status).toBe(404);
    expect((refused.body as ErrorAnswer).error).toEqual({
      reason: "no-editor",
      message:
        "No editor found to open src/objects/units.ts: put VS Code's code command on the PATH, or set VISUAL or EDITOR.",
    });
  });

  it("opens only an Object definition", async () => {
    const studio = await start(mapProject(), { env: { PATH: "" } });

    const answer = await request(studio, "/api/open-in-editor", {
      json: { kind: "unit", rawcode: "h000" },
    });
    expect(answer.status).toBe(404);
    expect((answer.body as ErrorAnswer).error.reason).toBe("not-found");
  });
});

describe("the Studio's session", () => {
  it("gives the map folder, the game, the Game data set and no unsaved edit", async () => {
    const project = mapProject();
    const studio = await start(project);

    expect(
      (await request(studio, "/api/session")).body as SessionAnswer,
    ).toEqual({
      mapFolder: project.mapFolder,
      projectRoot: project.root,
      build: "3.0.0.24268",
      gameDataSet: { id: "melee-fk", label: "Melee (Forsaken Kingdom)" },
      baseValues: "melee-fk",
      worldEditor: "no-window",
      warnings: [],
      unsavedEdits: 0,
      undo: 0,
      redo: 0,
    });
  });

  it("reports the World Editor's state through the check it is given", async () => {
    const project = mapProject();
    const studio = await start(project, {
      worldEditorCheck: {
        readWindowTitles: () => [
          `Warcraft III World Editor - [${project.mapFolder} *]`,
        ],
      },
    });

    expect(
      ((await request(studio, "/api/session")).body as SessionAnswer)
        .worldEditor,
    ).toBe("modified");
  });

  it("keeps an edit in the working state, unsaved, as one undo step", async () => {
    const studio = await start(mapProject());

    const edited = await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h000",
            field: "unam",
            value: "Major",
          },
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
    expect(edited.status).toBe(200);
    expect(edited.body).toEqual({ unsavedEdits: 2, undo: 1, redo: 0 });

    const found = (await request(studio, "/api/objects/h000"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(found.selected?.name).toBe("Major");
    expect(
      found.selected?.fields.find((row) => row.id === "uhpm"),
    ).toMatchObject({
      value: 600,
      modified: true,
    });
  });

  it("refuses an edit the editor refuses, with its reason, and applies none of the request's edits", async () => {
    const studio = await start(mapProject());

    const answer = await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h000",
            field: "uhpm",
            value: 600,
          },
          { op: "addObject", kind: "unit", rawcode: "h001", base: "hfoo" },
        ],
      },
    });
    expect(answer.status).toBe(422);
    expect((answer.body as ErrorAnswer).error.reason).toBe("rawcode-taken");
    expect(
      (await request(studio, "/api/session")).body as SessionAnswer,
    ).toMatchObject({
      unsavedEdits: 0,
      undo: 0,
    });
    const found = (await request(studio, "/api/objects/h000"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(
      found.selected?.fields.find((row) => row.id === "uhpm")?.modified,
    ).toBe(false);
  });
});

describe("the Studio's watch of the map folder", () => {
  /** Saves an edit to the map folder as another editor would, the World Editor check off. */
  function saveOnDisk(project: Project, name: string): void {
    const editor = openObjectData(project.mapFolder, {
      projectRoot: project.root,
    });
    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, name);
    editor.save(undefined, { worldEditorCheck: false });
  }

  it("reads the map folder again when it changes with no unsaved edit, and says so", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");

    saveOnDisk(project, "Commander");
    const reloaded = await stream.next("reloaded");
    stream.close();

    expect(reloaded.data).toMatchObject({ unsavedEdits: 0 });
    // The name keeps its string's number: only war3map.wts changed.
    expect((reloaded.data as { files: string[] }).files).toEqual([
      "war3map.wts",
    ]);
    const found = (await request(studio, "/api/objects/h000"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(found.selected?.name).toBe("Commander");
  });

  it("keeps its unsaved edits when the map folder changes, and says so", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");
    await request(studio, "/api/edits", {
      json: {
        edits: [
          {
            op: "setField",
            kind: "unit",
            rawcode: "h001",
            field: "uhpm",
            value: 700,
          },
        ],
      },
    });

    saveOnDisk(project, "Commander");
    const changed = await stream.next("changed-on-disk");
    stream.close();

    expect(changed.data).toMatchObject({ unsavedEdits: 1, undo: 1 });
    expect(stream.received.some((event) => event.event === "reloaded")).toBe(
      false,
    );
    const found = (await request(studio, "/api/objects/h001"))
      .body as RawcodeAnswer;
    if (found.status !== "known") throw new Error(found.status);
    expect(
      found.selected?.fields.find((row) => row.id === "uhpm"),
    ).toMatchObject({
      value: 700,
    });
  });

  it("sees a new Object definition", async () => {
    const project = mapProject();
    const studio = await start(project);
    const stream = await events(studio);
    await stream.next("session");

    write(project, { "src/objects/units.ts": SERGEANT });
    await stream.next("reloaded");
    stream.close();

    const found = (await request(studio, "/api/objects/h002"))
      .body as RawcodeAnswer;
    expect(found).toMatchObject({
      status: "known",
      selected: { origin: "definition" },
    });
  });
});

describe("the Studio's request rules", () => {
  it("answers only a Host that names it", async () => {
    const studio = await start(mapProject());
    const port = String(portOf(studio));

    for (const host of [`localhost:${port}`, `127.0.0.1:${port}`]) {
      const answer = await request(studio, "/api/session", {
        headers: { host },
      });
      expect(answer.status).toBe(200);
    }
    for (const host of [
      `evil.example:${port}`,
      "localhost",
      `localhost:1${port}`,
    ]) {
      const answer = await request(studio, "/api/session", {
        headers: { host },
      });
      expect(answer.status).toBe(403);
      expect((answer.body as ErrorAnswer).error.reason).toBe("forbidden-host");
    }
  });

  it("refuses a write from another origin, or with none", async () => {
    const studio = await start(mapProject());
    const edits = {
      edits: [
        {
          op: "setField",
          kind: "unit",
          rawcode: "h000",
          field: "uhpm",
          value: 600,
        },
      ],
    };

    for (const origin of [
      "http://evil.example",
      `http://localhost:1${String(portOf(studio))}`,
    ]) {
      const answer = await request(studio, "/api/edits", {
        json: edits,
        headers: { origin },
      });
      expect(answer.status).toBe(403);
      expect((answer.body as ErrorAnswer).error.reason).toBe(
        "forbidden-origin",
      );
    }
    const anonymous = await request(studio, "/api/edits", {
      json: edits,
      headers: { origin: "" },
    });
    expect(anonymous.status).toBe(403);
    expect(
      ((await request(studio, "/api/session")).body as SessionAnswer)
        .unsavedEdits,
    ).toBe(0);

    const own = await request(studio, "/api/edits", {
      json: edits,
      headers: { origin: `http://127.0.0.1:${String(portOf(studio))}` },
    });
    expect(own.status).toBe(200);
  });

  it("listens on the loopback interface only", async () => {
    const studio = await start(mapProject());

    expect(studio.url).toBe(`http://localhost:${String(portOf(studio))}`);
    const external = Object.values(os.networkInterfaces())
      .flat()
      .find((address) => address?.family === "IPv4" && !address.internal);
    if (external !== undefined) {
      await expect(
        request(studio, "/api/session", { address: external.address }),
      ).rejects.toThrow();
    }
    await expect(
      request(studio, "/api/session", { address: "::1" }),
    ).rejects.toThrow();
  });

  it("takes the next free port when its own is taken", async () => {
    const taken = net.createServer();
    await new Promise<void>((resolve) => taken.listen(0, "127.0.0.1", resolve));
    const port = (taken.address() as net.AddressInfo).port;
    try {
      const studio = await start(mapProject(), { port });
      expect(portOf(studio)).toBeGreaterThan(port);
    } finally {
      taken.close();
    }
  });
});

describe("startStudio", () => {
  it("names the setting to fix when the game is not found", async () => {
    const project = mapProject();
    const nowhere = path.join(makeTempDir("nowhere"), "Warcraft III.exe");

    await expect(
      startStudio({
        projectRoot: project.root,
        mapFolder: project.mapFolder,
        gameExecutable: nowhere,
        port: 0,
      }),
    ).rejects.toThrow(InstallNotFoundError);
  });

  it("serves on 5476 when it is free", async () => {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => {
        resolve(false);
      });
      probe.listen(5476, "127.0.0.1", () => {
        probe.close(() => {
          resolve(true);
        });
      });
    });
    if (!free) return;
    const studio = await start(mapProject(), {
      port: undefined,
      gameExecutable: await syntheticGame(),
    });

    expect(studio.url).toBe("http://localhost:5476");
  });
});
