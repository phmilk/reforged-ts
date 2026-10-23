// Object sync and the Object manifest (#704): a temporary Map project, a
// copy of the World Editor's map folder fixture plus src/objects/ written
// by the test, synced into its map folder; the map folder read back through
// the Object data editor, the manifest as text. The World Editor's windows
// are injected titles.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDataWriterError,
  ObjectDefinitionsError,
  mergeObjectDefinitions,
  openObjectData,
  syncObjectDefinitions,
  type ObjectDataObject,
  type ObjectSyncOptions,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** The fixture the Map projects copy: a Custom object and a changed Built-in object of each kind, as the World Editor saved them. */
const FIXTURE = "editor-objects.w3m";

const IMPORT = `import { defineAbility, defineUnit } from "reforged-map/objects";\n`;

const UNITS = "src/objects/units.ts";

const MANIFEST = "object-manifest.json";

interface MapProject {
  readonly root: string;
  readonly mapFolder: string;
}

/** Links `node_modules/<name>` of `root` to this package's installation of it. */
function link(root: string, name: string): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(
    fs.realpathSync(path.join(PACKAGE_ROOT, "node_modules", name)),
    linkPath,
    "junction",
  );
}

/** A Map project in a temporary folder: a copy of the fixture as its map folder, `files` under its root, typescript and reforged-builtins linked. */
function mapProject(files: Readonly<Record<string, string>>): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  fs.cpSync(fixtureMap(FIXTURE), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  link(root, "typescript");
  link(root, "reforged-builtins");
  write({ root, mapFolder }, files);
  return { root, mapFolder };
}

/** Writes files under the Map project's root, by relative path. */
function write(
  project: MapProject,
  files: Readonly<Record<string, string>>,
): void {
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(project.root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
}

/** A copy of a Map project in a new temporary folder. */
function copyProject(project: MapProject): MapProject {
  const root = makeTempDir();
  fs.cpSync(project.root, root, { recursive: true, verbatimSymlinks: true });
  return { root, mapFolder: path.join(root, "test.w3m") };
}

/** The window titles of a World Editor holding a folder, saved or not. */
function titles(folder: string, modified: boolean): ObjectSyncOptions {
  const title = `Warcraft III World Editor - [${path.resolve(folder)}${modified ? " *" : ""}]`;
  return { worldEditorCheck: { readWindowTitles: () => [title] } };
}

const NO_WINDOW: ObjectSyncOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
};

/** Syncs a Map project with no World Editor window. */
function sync(project: MapProject, options: ObjectSyncOptions = {}) {
  return syncObjectDefinitions(project.mapFolder, project.root, {
    ...NO_WINDOW,
    ...options,
  });
}

/** Every file of a folder, by relative path, with the SHA-256 of its bytes. */
function snapshot(folder: string): Map<string, string> {
  return new Map(
    (fs.readdirSync(folder, { recursive: true }) as string[])
      .filter((name) => {
        const file = path.join(folder, name);
        return !name.startsWith("node_modules") && fs.statSync(file).isFile();
      })
      .sort()
      .map((name) => [
        name,
        createHash("sha256")
          .update(fs.readFileSync(path.join(folder, name)))
          .digest("hex"),
      ]),
  );
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
    const project = mapProject({ [UNITS]: FIRST });

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
  ]
}
`);
  });

  it("changes an owned object (a field set, a field removed) and removes owned objects no definition defines, warning of a removed Custom object's placements", () => {
    const project = mapProject({ [UNITS]: FIRST });
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
    const project = mapProject({
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
    const project = mapProject({ [UNITS]: FIRST });
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
    const project = mapProject({ [UNITS]: FIRST });
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

  it("writes while the World Editor holds the map without unsaved edits, and warns to reload it by hand", () => {
    const project = mapProject({ [UNITS]: FIRST });

    const report = sync(project, titles(project.mapFolder, false));

    expect(report.worldEditor).toBe("open");
    expect(report.written.length).toBeGreaterThan(0);
    expect(report.warnings).toEqual([
      `The World Editor has ${project.mapFolder} open: reload the map there (close it without saving and open it again), or its next save puts back what it loaded before this sync.`,
    ]);
    expect(objectOf(project.mapFolder, "unit", "h002")).toBeDefined();
  });

  it.each([false, true])(
    "refuses a collision before anything is written (force %s)",
    (force) => {
      const project = mapProject({
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
    const project = mapProject({});
    const before = snapshot(project.root);

    const report = sync(project);

    expect(report.written).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(snapshot(project.root)).toEqual(before);
  });
});

describe("the Object manifest", () => {
  it("is byte-stable: written again from scratch, it has the same bytes", () => {
    const project = mapProject({ [UNITS]: FIRST });
    sync(project);
    const first = manifest(project);
    const fresh = mapProject({ [UNITS]: FIRST });
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
    const base = mapProject({ [UNITS]: definitions(100, 300) });
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
    ["is of another format", '{ "format": 2, "owned": [] }\n'],
    ["has an unknown key", '{ "format": 1, "owned": [], "extra": 1 }\n'],
    [
      "owns an object twice",
      '{ "format": 1, "owned": [{ "kind": "unit", "rawcode": "h002", "modifications": [] }, { "kind": "unit", "rawcode": "h002", "modifications": [] }] }\n',
    ],
  ])("is refused, naming the file, when it %s", (_, text) => {
    const project = mapProject({ [UNITS]: FIRST, [MANIFEST]: text });
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
    const project = mapProject({ [UNITS]: FIRST });

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
    const project = mapProject({ [UNITS]: FIRST });
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
    const project = mapProject({ [UNITS]: FIRST });
    sync(project);
    fs.rmSync(path.join(project.root, "src"), { recursive: true });
    const staged = path.join(project.root, "dist", "test.w3m");
    fs.cpSync(project.mapFolder, staged, { recursive: true });

    mergeObjectDefinitions(staged, project.root);

    expect(objectOf(staged, "unit", "h002")).toBeUndefined();
    expect(objectOf(staged, "unit", "hkni")).toBeUndefined();
  });
});
