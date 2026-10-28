// Object sync and the Object manifest (#704): a temporary Map project, a
// copy of the World Editor's map folder fixture plus src/objects/ written
// by the test, synced into its map folder; the map folder read back through
// the Object data editor, the manifest as text. The World Editor's windows
// are injected titles.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  ObjectDataWriterError,
  ObjectDefinitionsError,
  mergeObjectDefinitions,
  openObjectData,
  type ObjectDataObject,
  type ObjectSyncOptions,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import {
  copyProject,
  mapProject,
  snapshot,
  sync,
  write,
  type MapProject,
} from "./support/object-project.js";

afterAll(removeTemporary);

/** The fixture the Map projects copy: a Custom object and a changed Built-in object of each kind, as the World Editor saved them. */
const FIXTURE = "editor-objects.w3m";

const IMPORT = `import { defineAbility, defineUnit } from "reforged-map/objects";\n`;

const UNITS = "src/objects/units.ts";

const MANIFEST = "object-manifest.json";

/** The window titles of a World Editor holding a folder, saved or not. */
function titles(folder: string, modified: boolean): ObjectSyncOptions {
  const title = `Warcraft III World Editor - [${path.resolve(folder)}${modified ? " *" : ""}]`;
  return { worldEditorCheck: { readWindowTitles: () => [title] } };
}

/** A file standing in for the World Editor's executable. */
function editorExecutable(): string {
  const file = path.join(makeTempDir(), "World Editor.exe");
  fs.writeFileSync(file, "");
  return file;
}

/** The object of a kind and Rawcode in a map folder, read back through the Object data editor. */
function objectOf(
  folder: string,
  kind: ObjectDataObject["kind"],
  rawcode: string,
): ObjectDataObject | undefined {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT })
    .objects(kind)
    .find((object) => object.rawcode === rawcode);
}

/** An object's modifications as `field[@level] = value`, sorted. */
function modifications(object: ObjectDataObject | undefined): string[] {
  return (object?.modifications ?? [])
    .map(
      ({ field, level, value }) =>
        `${field}${level === undefined || level === 0 ? "" : `@${String(level)}`} = ${typeof value === "number" ? String(Math.round(value * 1000) / 1000) : JSON.stringify(value)}`,
    )
    .sort();
}

/** The manifest's text. */
function manifest(project: MapProject): string {
  return fs.readFileSync(path.join(project.root, MANIFEST), "utf8");
}

/** The objects of a report's list, as `kind rawcode`. */
function listed(
  objects: readonly { readonly kind: string; readonly rawcode: string }[],
): string[] {
  return objects.map(({ kind, rawcode }) => `${kind} ${rawcode}`);
}

/** The error a call throws. */
function thrown(call: () => unknown): unknown {
  try {
    call();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
}

const FIRST = `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 420, usca: 1.1 } });
export const Squire = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Squire" } });
export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
`;

describe("syncObjectDefinitions", () => {
  it("adds owned objects to the map folder in the Editor form, and records them in the manifest", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });

    const report = sync(project);

    expect(listed(report.added)).toEqual([
      "unit h002",
      "unit h003",
      "unit hkni",
    ]);
    expect(report.changed).toEqual([]);
    expect(report.removed).toEqual([]);
    expect(report.written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
    ]);
    expect(report.manifestWritten).toBe(true);
    expect(report.worldEditor).toBe("no-window");
    expect(report.warnings).toEqual([]);
    const sergeant = objectOf(project.mapFolder, "unit", "h002");
    expect(sergeant?.base).toBe("hfoo");
    expect(
      sergeant?.modifications.find((m) => m.field === "unam")?.stored,
    ).toMatch(/^TRIGSTR_\d+$/);
    expect(modifications(sergeant)).toEqual([
      "uhpm = 420",
      'unam = "Sergeant"',
      "usca = 1.1",
    ]);
    expect(manifest(project)).toBe(`{
  "format": 1,
  "owned": [
    {
      "kind": "unit",
      "rawcode": "h002",
      "base": "hfoo",
      "modifications": [
        {
          "field": "uhpm",
          "type": "int",
          "value": 420
        },
        {
          "field": "unam",
          "type": "string",
          "value": "Sergeant"
        },
        {
          "field": "usca",
          "type": "real",
          "value": 1.1
        }
      ]
    },
    {
      "kind": "unit",
      "rawcode": "h003",
      "base": "hfoo",
      "modifications": [
        {
          "field": "unam",
          "type": "string",
          "value": "Squire"
        }
      ]
    },
    {
      "kind": "unit",
      "rawcode": "hkni",
      "modifications": [
        {
          "field": "uhpm",
          "type": "int",
          "value": 900
        }
      ]
    }
  ],
  "removed": []
}
`);
  });

  it("changes an owned object (a field set, a field removed) and removes owned objects no definition defines, warning of a removed Custom object's placements", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    write(project, {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 500 } });\n`,
    });

    const report = sync(project);

    expect(listed(report.added)).toEqual([]);
    expect(listed(report.changed)).toEqual(["unit h002"]);
    expect(report.removed).toEqual([
      { kind: "unit", rawcode: "h003", base: "hfoo" },
      { kind: "unit", rawcode: "hkni", base: undefined },
    ]);
    expect(report.manifestWritten).toBe(true);
    expect(report.warnings).toEqual([
      "The Custom unit h003 was removed: no definition defines it any more. Its placements on the terrain, if any, are dropped by the World Editor's next save and skipped by the game. To hand an object back to the map folder with its placements, restore its definition and release it (pnpm objects:release h003).",
    ]);
    expect(modifications(objectOf(project.mapFolder, "unit", "h002"))).toEqual([
      "uhpm = 500",
      'unam = "Sergeant"',
    ]);
    expect(objectOf(project.mapFolder, "unit", "h003")).toBeUndefined();
    expect(objectOf(project.mapFolder, "unit", "hkni")).toBeUndefined();
    // The map folder's own objects are still there.
    expect(objectOf(project.mapFolder, "unit", "h000")?.name).toBe("Captain");
    const owned = (
      JSON.parse(manifest(project)) as { owned: { rawcode: string }[] }
    ).owned;
    expect(owned.map(({ rawcode }) => rawcode)).toEqual(["h002"]);
  });

  it("writes no byte on a second sync, the manifest included", () => {
    const project = mapProject(FIXTURE, {
      [UNITS]: FIRST,
      "src/objects/abilities.ts": `${IMPORT}export const Storm = defineAbility({ rawcode: "A001", base: FourCC("AHbz"), fields: { anam: "Storm", Hbz1: { 1: 3, 2: 4 }, Hbz2: { 1: 90.5 } } });\n`,
    });
    sync(project);
    const before = snapshot(project.root);

    const report = sync(project);

    expect(snapshot(project.root)).toEqual(before);
    expect(report.written).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(report.added).toEqual([]);
    expect(report.changed).toEqual([]);
  });

  it("keeps a shared TRIGSTR's text for its other owner", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const shared = objectOf(
      project.mapFolder,
      "unit",
      "h002",
    )?.modifications.find((m) => m.field === "unam")?.stored as string;
    const own = objectOf(project.mapFolder, "unit", "h001")?.modifications.find(
      (m) => m.field === "unam",
    )?.stored as string;
    expect(shared.length).toBe(own.length);
    // The World Editor's h001, which the code does not own, now names
    // itself by the string of the code's h002.
    const skin = path.join(project.mapFolder, "war3mapSkin.w3u");
    const bytes = Buffer.from(fs.readFileSync(skin));
    const at = bytes.indexOf(own, 0, "latin1");
    bytes.write(shared, at, "latin1");
    fs.writeFileSync(skin, bytes);
    write(project, {
      [UNITS]: FIRST.replace('unam: "Sergeant"', 'unam: "Sergeant Major"'),
    });

    sync(project);

    expect(objectOf(project.mapFolder, "unit", "h001")?.name).toBe("Sergeant");
    expect(objectOf(project.mapFolder, "unit", "h002")?.name).toBe(
      "Sergeant Major",
    );
  });

  it("refuses while the World Editor shows unsaved edits, telling to save or discard them there, and writes nothing", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    const before = snapshot(project.root);

    const error = thrown(() => sync(project, titles(project.mapFolder, true)));

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect((error as ObjectDataWriterError).reason).toBe(
      "modified-in-world-editor",
    );
    expect((error as Error).message).toContain(
      "Save or discard them in the World Editor first",
    );
    expect(snapshot(project.root)).toEqual(before);
  });

  it("writes while the World Editor holds the map without unsaved edits, and warns to reload it by hand without its executable", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });

    const report = sync(project, titles(project.mapFolder, false));

    expect(report.worldEditor).toBe("open");
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.written.length).toBeGreaterThan(0);
    expect(report.warnings).toEqual([
      `The World Editor has ${project.mapFolder} open: reload the map there (close it without saving and open it again), or its next save puts back what it loaded before this sync.`,
    ]);
    expect(objectOf(project.mapFolder, "unit", "h002")).toBeDefined();
  });

  it("writes, then reloads the World Editor that holds the map without unsaved edits, given its executable", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    const executable = editorExecutable();
    const launch = vi.fn(() => {
      // The map folder is written when the World Editor reloads it.
      expect(objectOf(project.mapFolder, "unit", "h002")).toBeDefined();
    });

    const report = sync(project, {
      ...titles(project.mapFolder, false),
      worldEditorExecutable: executable,
      worldEditorReload: { system: "windows", launch },
    });

    expect(report.worldEditor).toBe("open");
    expect(report.worldEditorReloaded).toBe(true);
    expect(report.warnings).toEqual([]);
    expect(launch).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledWith(executable, [
      "-launch",
      "-loadfile",
      path.resolve(project.mapFolder),
    ]);
  });

  it("warns to reload by hand, naming why, when the reload fails, and still writes the manifest", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    const launch = vi.fn();
    const missing = path.join(makeTempDir(), "World Editor.exe");

    const report = sync(project, {
      ...titles(project.mapFolder, false),
      worldEditorExecutable: missing,
      worldEditorReload: { system: "windows", launch },
    });

    expect(launch).not.toHaveBeenCalled();
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.manifestWritten).toBe(true);
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toContain(
      `The World Editor has ${project.mapFolder} open and could not be reloaded (`,
    );
    expect(report.warnings[0]).toContain(missing);
    expect(report.warnings[0]).toContain(
      "reload the map there (close it without saving and open it again)",
    );
  });

  it("neither reloads nor warns when the World Editor does not hold the map", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    const launch = vi.fn();

    const report = sync(project, {
      worldEditorExecutable: editorExecutable(),
      worldEditorReload: { system: "windows", launch },
    });

    expect(report.worldEditor).toBe("no-window");
    expect(report.written.length).toBeGreaterThan(0);
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.warnings).toEqual([]);
    expect(launch).not.toHaveBeenCalled();
  });

  it("neither reloads nor warns when the sync writes nothing to a map the World Editor holds", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const launch = vi.fn();

    const report = sync(project, {
      ...titles(project.mapFolder, false),
      worldEditorExecutable: editorExecutable(),
      worldEditorReload: { system: "windows", launch },
    });

    expect(report.written).toEqual([]);
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.warnings).toEqual([]);
    expect(launch).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "refuses a collision before anything is written (force %s)",
    (force) => {
      const project = mapProject(FIXTURE, {
        [UNITS]: `${FIRST}export const Captain = defineUnit({ rawcode: "h000", base: FourCC("hfoo") });\n`,
      });
      const before = snapshot(project.root);

      const error = thrown(() => sync(project, { force }));

      expect(error).toBeInstanceOf(ObjectDefinitionsError);
      expect((error as ObjectDefinitionsError).reason).toBe("collision");
      expect((error as Error).message).toBe(
        "src/objects/units.ts defines the unit h000, which the map folder already defines, and the code does not own it. Adopt it into the code (pnpm objects:adopt h000), or give the definition another Rawcode.",
      );
      expect(snapshot(project.root)).toEqual(before);
    },
  );

  it("does nothing, and writes no manifest, without definitions or owned objects", () => {
    const project = mapProject(FIXTURE, {});
    const before = snapshot(project.root);

    const report = sync(project);

    expect(report.written).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(snapshot(project.root)).toEqual(before);
  });
});

describe("the Object manifest", () => {
  it("is byte-stable: written again from scratch, it has the same bytes", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const first = manifest(project);
    const fresh = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(fresh);

    expect(manifest(fresh)).toBe(first);
  });

  it("merges with git merge-file, without a conflict, after two syncs of different objects on two copies", () => {
    const definitions = (a: number, c: number) =>
      `${IMPORT}${[
        ["h002", a],
        ["h003", 200],
        ["h004", c],
      ]
        .map(
          ([rawcode, hp]) =>
            `export const U_${String(rawcode)} = defineUnit({ rawcode: "${String(rawcode)}", base: FourCC("hfoo"), fields: { uhpm: ${String(hp)} } });\n`,
        )
        .join("")}`;
    const base = mapProject(FIXTURE, { [UNITS]: definitions(100, 300) });
    sync(base);
    const ours = copyProject(base);
    const theirs = copyProject(base);
    write(ours, { [UNITS]: definitions(111, 300) });
    sync(ours);
    write(theirs, { [UNITS]: definitions(100, 333) });
    sync(theirs);
    const both = copyProject(base);
    write(both, { [UNITS]: definitions(111, 333) });
    sync(both);

    const merged = spawnSync(
      "git",
      [
        "merge-file",
        "-p",
        path.join(ours.root, MANIFEST),
        path.join(base.root, MANIFEST),
        path.join(theirs.root, MANIFEST),
      ],
      { encoding: "utf8" },
    );

    expect(merged.status).toBe(0);
    expect(merged.stdout).toBe(manifest(both));
  });

  it.each([
    ["does not parse", "{ not json"],
    ["is of another format", '{ "format": 2, "owned": [], "removed": [] }\n'],
    [
      "has an unknown key",
      '{ "format": 1, "owned": [], "removed": [], "extra": 1 }\n',
    ],
    ["has no removed entries", '{ "format": 1, "owned": [] }\n'],
    [
      "owns an object twice",
      '{ "format": 1, "owned": [{ "kind": "unit", "rawcode": "h002", "modifications": [] }, { "kind": "unit", "rawcode": "h002", "modifications": [] }], "removed": [] }\n',
    ],
    [
      "both owns and removed an object",
      '{ "format": 1, "owned": [{ "kind": "unit", "rawcode": "h002", "modifications": [] }], "removed": [{ "kind": "unit", "rawcode": "h002", "modifications": [] }] }\n',
    ],
  ])("is refused, naming the file, when it %s", (_, text) => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST, [MANIFEST]: text });
    const before = snapshot(project.root);

    const error = thrown(() => sync(project));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe(
      "manifest-unreadable",
    );
    expect((error as ObjectDefinitionsError).file).toBe(
      path.join(project.root, MANIFEST),
    );
    expect((error as Error).message).toMatch(
      /^The Object manifest object-manifest\.json cannot be read \(.+\): nothing was written\. Object sync writes it, and it is never edited by hand/,
    );
    expect(snapshot(project.root)).toEqual(before);
  });

  it("is found where the option says", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });

    sync(project, { manifest: "config/objects.json" });

    expect(fs.existsSync(path.join(project.root, MANIFEST))).toBe(false);
    expect(
      fs.readFileSync(
        path.join(project.root, "config", "objects.json"),
        "utf8",
      ),
    ).toContain('"rawcode": "h002"');
  });
});

describe("the build's merge with the Object manifest", () => {
  it("replaces an owned object, removes a dropped one from the staged copy, and leaves the map folder and the manifest untouched", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    write(project, {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { uhpm: 500 } });\n`,
    });
    const staged = path.join(project.root, "dist", "test.w3m");
    fs.cpSync(project.mapFolder, staged, { recursive: true });
    const map = snapshot(project.mapFolder);
    const before = manifest(project);

    const result = mergeObjectDefinitions(staged, project.root);

    expect(result.warnings).toEqual([]);
    expect(modifications(objectOf(staged, "unit", "h002"))).toEqual([
      "uhpm = 500",
    ]);
    expect(objectOf(staged, "unit", "h003")).toBeUndefined();
    expect(objectOf(staged, "unit", "hkni")).toBeUndefined();
    expect(objectOf(staged, "unit", "h000")?.name).toBe("Captain");
    expect(snapshot(project.mapFolder)).toEqual(map);
    expect(manifest(project)).toBe(before);
  });

  it("removes every owned object when no definition file is left", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    fs.rmSync(path.join(project.root, "src"), { recursive: true });
    const staged = path.join(project.root, "dist", "test.w3m");
    fs.cpSync(project.mapFolder, staged, { recursive: true });

    mergeObjectDefinitions(staged, project.root);

    expect(objectOf(staged, "unit", "h002")).toBeUndefined();
    expect(objectOf(staged, "unit", "hkni")).toBeUndefined();
  });
});

/** Edits a Map project's map folder outside the code, as the World Editor would, and saves it. */
function editMapFolder(
  project: MapProject,
  edit: (editor: ReturnType<typeof openObjectData>) => void,
): void {
  const editor = openObjectData(project.mapFolder, {
    projectRoot: PACKAGE_ROOT,
  });
  edit(editor);
  editor.save(undefined, { worldEditorCheck: false });
}

/** The Object data files of a map folder, by file name, with their bytes. */
function objectFiles(folder: string): Map<string, Buffer> {
  return new Map(
    fs
      .readdirSync(folder)
      .filter((name) => /^war3map(Skin)?\.(w3[a-z]|wts)$/.test(name))
      .map((name) => [name, fs.readFileSync(path.join(folder, name))]),
  );
}

/** Writes Object data files back, as a World Editor that loaded them saves them again. */
function restoreObjectFiles(
  folder: string,
  files: ReadonlyMap<string, Buffer>,
): void {
  for (const name of fs.readdirSync(folder)) {
    if (/^war3map(Skin)?\.(w3[a-z]|wts)$/.test(name) && !files.has(name)) {
      fs.rmSync(path.join(folder, name));
    }
  }
  for (const [name, bytes] of files) {
    fs.writeFileSync(path.join(folder, name), bytes);
  }
}

/** The manifest's entries of a list, as `kind rawcode`. */
function entries(project: MapProject, list: "owned" | "removed"): string[] {
  const json = JSON.parse(manifest(project)) as Record<
    string,
    { kind: string; rawcode: string }[]
  >;
  return listed(json[list] ?? []);
}

const DRIFT_HEADER =
  "Objects the code owns were changed in the map folder outside the code since the last Object sync: nothing was written. Copy each change into its definition, or sync with force (pnpm objects:sync --force) to overwrite them with the code's version.";

describe("Object sync and changes made outside the code", () => {
  it("refuses an owned object changed in the map folder, listing each object and field with both values, and writes nothing", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "h002", field: "uhpm" }, 500);
      editor.removeField({ kind: "unit", rawcode: "h002", field: "usca" });
      editor.setField({ kind: "unit", rawcode: "hkni", field: "umvs" }, 300);
    });
    const before = snapshot(project.root);

    const error = thrown(() => sync(project));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe(
      "changed-outside-code",
    );
    expect((error as Error).message).toBe(
      [
        DRIFT_HEADER,
        "- The unit h002's uhpm is 420 in the Object manifest and 500 in the map folder.",
        "- The unit h002's usca is 1.1 in the Object manifest and not set in the map folder.",
        "- The unit hkni's umvs is not set in the Object manifest and 300 in the map folder.",
      ].join("\n"),
    );
    const problems = (error as ObjectDefinitionsError).problems;
    expect(
      problems.map(
        ({ rawcode, field }) => `${String(rawcode)} ${String(field)}`,
      ),
    ).toEqual(["h002 uhpm", "h002 usca", "hkni umvs"]);
    expect(problems[0]?.file).toBe(path.join(project.root, UNITS));
    expect(snapshot(project.root)).toEqual(before);
  });

  it("overwrites the changes with the code's version under force, with a warning per object", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const synced = manifest(project);
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "h002", field: "uhpm" }, 500);
    });

    const report = sync(project, { force: true });

    expect(listed(report.changed)).toEqual(["unit h002"]);
    expect(report.warnings).toEqual([
      "The unit h002 was changed outside the code (uhpm): force overwrote it with the code's version.",
    ]);
    expect(modifications(objectOf(project.mapFolder, "unit", "h002"))).toEqual([
      "uhpm = 420",
      'unam = "Sergeant"',
      "usca = 1.1",
    ]);
    expect(manifest(project)).toBe(synced);
  });

  it("reports an owned object deleted in the map folder as changed outside the code", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    editMapFolder(project, (editor) => {
      editor.removeObject({ kind: "unit", rawcode: "h003" });
      editor.removeObject({ kind: "unit", rawcode: "hkni" });
    });

    const error = thrown(() => sync(project));

    expect((error as ObjectDefinitionsError).reason).toBe(
      "changed-outside-code",
    );
    expect((error as Error).message).toBe(
      [
        DRIFT_HEADER,
        "- The Custom unit h003 is in the Object manifest and was deleted from the map folder.",
        "- The unit hkni's uhpm is 900 in the Object manifest and not set in the map folder.",
      ].join("\n"),
    );
  });

  it("refuses a change to an owned object the code dropped, rather than removing it in silence", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "h003", field: "uhpm" }, 250);
    });
    write(project, { [UNITS]: FIRST.replace(/^export const Squire.*\n/m, "") });

    const error = thrown(() => sync(project));

    expect((error as Error).message).toBe(
      [
        DRIFT_HEADER,
        "- The unit h003's uhpm is not set in the Object manifest and 250 in the map folder.",
      ].join("\n"),
    );
    expect((error as ObjectDefinitionsError).file).toBeUndefined();
  });

  it("recovers a sync interrupted before its manifest write without a drift report", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const stale = manifest(project);
    write(project, {
      [UNITS]: FIRST.replace("uhpm: 420", "uhpm: 500").replace(
        /^export const Knight.*\n/m,
        "",
      ),
    });
    sync(project);
    const complete = manifest(project);
    // The sync wrote the map folder, then stopped before the manifest.
    fs.writeFileSync(path.join(project.root, MANIFEST), stale);

    const report = sync(project);

    expect(report.written).toEqual([]);
    expect(report.manifestWritten).toBe(true);
    expect(report.warnings).toEqual([]);
    expect(manifest(project)).toBe(complete);
  });
});

describe("Object sync and the objects it removed", () => {
  it("records each removed object in the manifest, sorted with the owned ones, and drops the entry when a definition takes its Rawcode again", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    write(project, {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 420, usca: 1.1 } });\n`,
    });

    sync(project);

    expect(entries(project, "owned")).toEqual(["unit h002"]);
    expect(entries(project, "removed")).toEqual(["unit h003", "unit hkni"]);
    expect(manifest(project)).toContain(`  "removed": [
    {
      "kind": "unit",
      "rawcode": "h003",
      "base": "hfoo",
      "modifications": [
        {
          "field": "unam",
          "type": "string",
          "value": "Squire"
        }
      ]
    },`);

    write(project, { [UNITS]: FIRST });
    const report = sync(project);

    expect(listed(report.added)).toEqual(["unit h003", "unit hkni"]);
    expect(entries(project, "owned")).toEqual([
      "unit h002",
      "unit h003",
      "unit hkni",
    ]);
    expect(entries(project, "removed")).toEqual([]);
  });

  it("removes again, with a warning, a removed object a stale World Editor save brought back", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    // The World Editor loads the map, the code drops Squire, and the World
    // Editor saves what it loaded.
    const loaded = objectFiles(project.mapFolder);
    write(project, { [UNITS]: FIRST.replace(/^export const Squire.*\n/m, "") });
    sync(project);
    restoreObjectFiles(project.mapFolder, loaded);
    expect(objectOf(project.mapFolder, "unit", "h003")).toBeDefined();

    const report = sync(project);

    expect(report.removedAgain).toEqual([
      { kind: "unit", rawcode: "h003", base: "hfoo" },
    ]);
    expect(report.leftAlone).toEqual([]);
    expect(report.warnings).toEqual([
      "The unit h003, which an earlier Object sync removed, was brought back unchanged by a World Editor that saved the map it had loaded before that sync: it was removed again. Reload the map in the World Editor after each sync, before saving there.",
    ]);
    expect(objectOf(project.mapFolder, "unit", "h003")).toBeUndefined();
    expect(entries(project, "removed")).toEqual(["unit h003"]);
  });

  it("leaves alone a new object of the map folder at a removed Rawcode, and forgets the removed one", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    write(project, { [UNITS]: FIRST.replace(/^export const Squire.*\n/m, "") });
    sync(project);
    editMapFolder(project, (editor) => {
      editor.addObject({ kind: "unit", rawcode: "h003", base: "hkni" });
    });

    const report = sync(project);

    expect(report.removedAgain).toEqual([]);
    expect(report.leftAlone).toEqual([
      { kind: "unit", rawcode: "h003", base: "hkni" },
    ]);
    expect(report.written).toEqual([]);
    expect(objectOf(project.mapFolder, "unit", "h003")?.base).toBe("hkni");
    expect(entries(project, "removed")).toEqual([]);
  });

  it("lets a definition take back its removed object a stale save brought back, without a collision", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    const loaded = objectFiles(project.mapFolder);
    write(project, { [UNITS]: FIRST.replace(/^export const Squire.*\n/m, "") });
    sync(project);
    restoreObjectFiles(project.mapFolder, loaded);
    write(project, { [UNITS]: FIRST });

    const report = sync(project);

    expect(report.removedAgain).toEqual([]);
    expect(entries(project, "owned")).toEqual([
      "unit h002",
      "unit h003",
      "unit hkni",
    ]);
    expect(entries(project, "removed")).toEqual([]);
  });
});

describe("the build's merge and changes made outside the code", () => {
  it("warns per object changed outside the code and ships the code's version", () => {
    const project = mapProject(FIXTURE, { [UNITS]: FIRST });
    sync(project);
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "h002", field: "uhpm" }, 500);
      editor.removeObject({ kind: "unit", rawcode: "h003" });
    });
    const staged = path.join(project.root, "dist", "test.w3m");
    fs.cpSync(project.mapFolder, staged, { recursive: true });
    const before = manifest(project);

    const result = mergeObjectDefinitions(staged, project.root);

    expect(result.warnings).toEqual([
      "The unit h002 was changed in the map folder outside the code (uhpm): the build ships the code's version. Object sync (pnpm objects:sync) lists the changes.",
      "The unit h003 was changed in the map folder outside the code (deleted): the build ships the code's version. Object sync (pnpm objects:sync) lists the changes.",
    ]);
    expect(modifications(objectOf(staged, "unit", "h002"))).toEqual([
      "uhpm = 420",
      'unam = "Sergeant"',
      "usca = 1.1",
    ]);
    expect(objectOf(staged, "unit", "h003")?.base).toBe("hfoo");
    expect(manifest(project)).toBe(before);
  });
});
