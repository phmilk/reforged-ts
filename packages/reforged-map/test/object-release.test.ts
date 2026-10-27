// Object release (#710): a temporary Map project, a copy of the World
// Editor's map folder fixture plus src/objects/ written by the test, synced,
// then some of its owned objects handed back to the map folder. What the
// test asserts is what the author sees: the map folder read back through the
// Object data editor, the manifest as text, the definition files, the errors
// and their reasons. The World Editor's windows are injected titles.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  ObjectDataWriterError,
  ObjectDefinitionsError,
  adoptObjects,
  openObjectData,
  releaseObjects,
  syncObjectDefinitions,
  type ObjectDataObject,
  type ObjectReleaseOptions,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  listTree,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** The fixture the Map projects copy: a Custom object and a changed Built-in object of each kind, as the World Editor saved them. */
const FIXTURE = "editor-objects.w3m";

const IMPORT = `import { defineUnit } from "reforged-map/objects";\n`;

const MANIFEST = "object-manifest.json";

const SERGEANT = "src/objects/unit/Sergeant_h002.ts";
const SQUIRE = "src/objects/unit/Squire_h003.ts";
const KNIGHTS = "src/objects/knights.ts";

const FILES = {
  [SERGEANT]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 420 } });\n`,
  [SQUIRE]: `${IMPORT}export const Squire = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Squire" } });\n`,
  [KNIGHTS]: `${IMPORT}export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
export const Paladin = defineUnit({ rawcode: "Hpal", fields: { uhpm: 700 } });
`,
};

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

const NO_WINDOW: ObjectReleaseOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
};

/** The window titles of a World Editor holding a folder, saved or not. */
function titles(folder: string, modified: boolean): ObjectReleaseOptions {
  const title = `Warcraft III World Editor - [${path.resolve(folder)}${modified ? " *" : ""}]`;
  return { worldEditorCheck: { readWindowTitles: () => [title] } };
}

/** A Map project in a temporary folder, a copy of the fixture as its map folder, `files` under its root, synced. */
function syncedProject(
  files: Readonly<Record<string, string>> = FILES,
): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  fs.cpSync(fixtureMap(FIXTURE), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  link(root, "typescript");
  link(root, "reforged-builtins");
  const project = { root, mapFolder };
  write(project, files);
  syncObjectDefinitions(mapFolder, root, NO_WINDOW);
  return project;
}

/** Releases objects of a Map project with no World Editor window. */
function release(
  project: MapProject,
  rawcodes: readonly string[],
  options: ObjectReleaseOptions = {},
) {
  return releaseObjects(project.mapFolder, project.root, rawcodes, {
    ...NO_WINDOW,
    ...options,
  });
}

/** Every file of a folder, by relative path, with the SHA-256 of its bytes. */
function snapshot(folder: string): Map<string, string> {
  return new Map(
    listTree(folder)
      .filter((name) => fs.statSync(path.join(folder, name)).isFile())
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

/** An object's modifications as `field = value`, sorted. */
function modifications(object: ObjectDataObject | undefined): string[] {
  return (object?.modifications ?? [])
    .map(
      ({ field, value }) =>
        `${field} = ${typeof value === "number" ? String(value) : JSON.stringify(value)}`,
    )
    .sort();
}

/** Edits the map folder outside the code, as a World Editor save would. */
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

interface ManifestEntry {
  readonly kind: string;
  readonly rawcode: string;
}

/** The manifest, parsed. */
function manifest(project: MapProject): {
  owned: ManifestEntry[];
  removed: ManifestEntry[];
} {
  return JSON.parse(
    fs.readFileSync(path.join(project.root, MANIFEST), "utf8"),
  ) as { owned: ManifestEntry[]; removed: ManifestEntry[] };
}

/** The manifest's entries of a list, as `kind rawcode`. */
function entries(project: MapProject, list: "owned" | "removed"): string[] {
  return manifest(project)[list].map(
    ({ kind, rawcode }) => `${kind} ${rawcode}`,
  );
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

/** Whether a file of the Map project's exists, by relative path. */
function exists(project: MapProject, name: string): boolean {
  return fs.existsSync(path.join(project.root, name));
}

describe("releaseObjects", () => {
  it("hands an owned object back to the map folder as the code last defined it, and drops its manifest entry and file", () => {
    const project = syncedProject();
    write(project, {
      [SERGEANT]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 500 } });\n`,
    });

    const report = release(project, ["h002"]);

    expect(report.released).toEqual([
      {
        kind: "unit",
        rawcode: "h002",
        base: "hfoo",
        file: path.join(project.root, SERGEANT),
      },
    ]);
    expect(report.deleted).toEqual([path.join(project.root, SERGEANT)]);
    expect(report.written.length).toBeGreaterThan(0);
    expect(report.manifestWritten).toBe(true);
    expect(report.worldEditor).toBe("no-window");
    expect(report.warnings).toEqual([]);
    expect(modifications(objectOf(project.mapFolder, "unit", "h002"))).toEqual([
      "uhpm = 500",
      'unam = "Sergeant"',
    ]);
    expect(exists(project, SERGEANT)).toBe(false);
    expect(entries(project, "owned")).toEqual([
      "unit Hpal",
      "unit h003",
      "unit hkni",
    ]);
    expect(entries(project, "removed")).toEqual([]);
  });

  it("leaves the map folder as it is when the code's version is there, and the next sync leaves the released object alone", () => {
    const project = syncedProject();
    const mapFolder = snapshot(project.mapFolder);

    const report = release(project, ["unit:h002"]);

    expect(report.written).toEqual([]);
    expect(snapshot(project.mapFolder)).toEqual(mapFolder);
    expect(entries(project, "owned")).not.toContain("unit h002");

    const next = syncObjectDefinitions(project.mapFolder, project.root, {
      ...NO_WINDOW,
    });

    expect(next.removed).toEqual([]);
    expect(next.written).toEqual([]);
    expect(modifications(objectOf(project.mapFolder, "unit", "h002"))).toEqual([
      "uhpm = 420",
      'unam = "Sergeant"',
    ]);
  });

  it("leaves the other owned objects untouched: their map folder state, their manifest entries and their files", () => {
    const project = syncedProject();
    const before = manifest(project).owned.filter(
      ({ rawcode }) => rawcode !== "h002",
    );
    // A definition changed since the last sync, and an owned object changed
    // outside the code: neither is the release's business.
    write(project, {
      [SQUIRE]: `${IMPORT}export const Squire = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Page" } });\n`,
    });
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "hkni", field: "uhpm" }, 950);
    });

    release(project, ["h002"]);

    expect(manifest(project).owned).toEqual(before);
    expect(modifications(objectOf(project.mapFolder, "unit", "h003"))).toEqual([
      'unam = "Squire"',
    ]);
    expect(modifications(objectOf(project.mapFolder, "unit", "hkni"))).toEqual([
      "uhpm = 950",
    ]);
    expect(exists(project, SQUIRE)).toBe(true);
    expect(exists(project, KNIGHTS)).toBe(true);
  });

  it("releases several objects at once, each Rawcode once", () => {
    const project = syncedProject();

    const report = release(project, ["h003", "h002", "h002"]);

    expect(
      report.released.map(({ kind, rawcode }) => `${kind} ${rawcode}`),
    ).toEqual(["unit h002", "unit h003"]);
    expect(exists(project, SERGEANT)).toBe(false);
    expect(exists(project, SQUIRE)).toBe(false);
    expect(entries(project, "owned")).toEqual(["unit Hpal", "unit hkni"]);
  });

  it("names the kind of a Rawcode two kinds share, and releases the one named", () => {
    const project = syncedProject({});
    adoptObjects(
      project.mapFolder,
      project.root,
      ["buff:B000", "destructable:B000"],
      NO_WINDOW,
    );
    const before = snapshot(project.root);

    const error = thrown(() => release(project, ["B000"]));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe("not-releasable");
    expect((error as Error).message).toBe(
      "The code owns a buff and a destructable at B000: name the kind of the one to release, buff:B000 or destructable:B000.",
    );
    expect(snapshot(project.root)).toEqual(before);

    const report = release(project, ["buff:B000"]);

    expect(report.released.map(({ kind }) => kind)).toEqual(["buff"]);
    expect(entries(project, "owned")).toEqual(["destructable B000"]);
    expect(objectOf(project.mapFolder, "buff", "B000")).toBeDefined();
  });

  it("does nothing without a Rawcode", () => {
    const project = syncedProject();
    const before = snapshot(project.root);

    const report = release(project, []);

    expect(report.released).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(snapshot(project.root)).toEqual(before);
  });
});

describe("releaseObjects refuses", () => {
  it.each([
    {
      name: "a Rawcode no definition defines and the code does not own",
      rawcodes: ["h000"],
      message:
        "The code neither defines nor owns an object h000 of any kind: there is nothing to release. Check the Rawcode.",
    },
    {
      name: "a kind the code does not own at that Rawcode",
      rawcodes: ["item:h002"],
      message:
        "The code neither defines nor owns the item h002: there is nothing to release. Check the Rawcode and the kind.",
    },
    {
      name: "a file that holds other definitions, naming it",
      rawcodes: ["hkni"],
      message:
        "src/objects/knights.ts holds other definitions than the unit hkni's (unit Hpal): release deletes the file of the object it releases, never code it does not own. Move the definition of the unit hkni to a file of its own, then release it.",
    },
  ])("$name", ({ rawcodes, message }) => {
    const project = syncedProject();
    const before = snapshot(project.root);

    const error = thrown(() => release(project, rawcodes));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe("not-releasable");
    expect((error as Error).message).toBe(message);
    expect(snapshot(project.root)).toEqual(before);
  });

  it("a Rawcode defined that no Object sync has written: not owned", () => {
    const project = syncedProject();
    write(project, {
      "src/objects/unit/Footman_h004.ts": `${IMPORT}export const Footman = defineUnit({ rawcode: "h004", base: FourCC("hfoo") });\n`,
    });
    const before = snapshot(project.root);

    const error = thrown(() => release(project, ["h004"]));

    expect((error as ObjectDefinitionsError).reason).toBe("not-releasable");
    expect((error as ObjectDefinitionsError).file).toBe(
      path.join(project.root, "src/objects/unit/Footman_h004.ts"),
    );
    expect((error as Error).message).toBe(
      "src/objects/unit/Footman_h004.ts defines the unit h004, which no Object sync has written: the code does not own it, and there is nothing to release. Sync it first (pnpm objects:sync), or delete its definition.",
    );
    expect(snapshot(project.root)).toEqual(before);
  });

  it("an owned Rawcode no definition defines any more", () => {
    const project = syncedProject();
    fs.rmSync(path.join(project.root, SERGEANT));
    const before = snapshot(project.root);

    const error = thrown(() => release(project, ["h002"]));

    expect((error as ObjectDefinitionsError).reason).toBe("not-releasable");
    expect((error as Error).message).toBe(
      "The unit h002 is in the Object manifest and no definition defines it: release hands back an object as the code last defined it. Restore its definition from git, then release it.",
    );
    expect(snapshot(project.root)).toEqual(before);
  });

  it("every Rawcode it cannot release, one problem each, and nothing is released", () => {
    const project = syncedProject();
    const before = snapshot(project.root);

    const error = thrown(() => release(project, ["h002", "h000", "hkni"]));

    expect(
      (error as ObjectDefinitionsError).problems.map(({ rawcode }) => rawcode),
    ).toEqual(["h000", "hkni"]);
    expect(snapshot(project.root)).toEqual(before);
  });

  it.each([false, true])(
    "while the World Editor shows unsaved edits, even when nothing is written to the map folder (force %s)",
    (force) => {
      const project = syncedProject();
      const before = snapshot(project.root);

      const error = thrown(() =>
        release(project, ["h002"], {
          ...titles(project.mapFolder, true),
          force,
        }),
      );

      expect(error).toBeInstanceOf(ObjectDataWriterError);
      expect((error as ObjectDataWriterError).reason).toBe(
        "modified-in-world-editor",
      );
      expect((error as Error).message).toBe(
        `The World Editor shows unsaved edits for ${project.mapFolder} (its title ends in " *]"): nothing was released. Save or discard them in the World Editor first, then release again.`,
      );
      expect(snapshot(project.root)).toEqual(before);
    },
  );

  it("while the World Editor shows unsaved edits and the map folder would be written", () => {
    const project = syncedProject();
    write(project, {
      [SERGEANT]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 500 } });\n`,
    });
    const before = snapshot(project.root);

    const error = thrown(() =>
      release(project, ["h002"], titles(project.mapFolder, true)),
    );

    expect((error as ObjectDataWriterError).reason).toBe(
      "modified-in-world-editor",
    );
    expect((error as Error).message).toContain("nothing was released");
    expect(snapshot(project.root)).toEqual(before);
  });

  it("a released object changed outside the code; force overwrites it with the code's version, with a warning", () => {
    const project = syncedProject();
    editMapFolder(project, (editor) => {
      editor.setField({ kind: "unit", rawcode: "h002", field: "uhpm" }, 999);
    });
    const before = snapshot(project.root);

    const error = thrown(() => release(project, ["h002"]));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe(
      "changed-outside-code",
    );
    expect((error as Error).message).toContain(
      "The unit h002's uhpm is 420 in the Object manifest and 999 in the map folder.",
    );
    expect(snapshot(project.root)).toEqual(before);

    const report = release(project, ["h002"], { force: true });

    expect(report.warnings).toEqual([
      "The unit h002 was changed outside the code (uhpm): force overwrote it with the code's version.",
    ]);
    expect(modifications(objectOf(project.mapFolder, "unit", "h002"))).toEqual([
      "uhpm = 420",
      'unam = "Sergeant"',
    ]);
    expect(exists(project, SERGEANT)).toBe(false);
    expect(entries(project, "owned")).not.toContain("unit h002");
  });
});

describe("releaseObjects and a World Editor holding the map", () => {
  it("writes, and warns to reload the map there by hand", () => {
    const project = syncedProject();
    write(project, {
      [SERGEANT]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 500 } });\n`,
    });

    const report = release(project, ["h002"], titles(project.mapFolder, false));

    expect(report.worldEditor).toBe("open");
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.warnings).toEqual([
      `The World Editor has ${project.mapFolder} open: reload the map there (close it without saving and open it again), or its next save puts back what it loaded before this release.`,
    ]);
  });

  it("writes, then reloads the World Editor, given its executable, after deleting the definition file", () => {
    const project = syncedProject();
    write(project, {
      [SERGEANT]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant", uhpm: 500 } });\n`,
    });
    const executable = path.join(makeTempDir(), "World Editor.exe");
    fs.writeFileSync(executable, "");
    const launch = vi.fn(() => {
      expect(exists(project, SERGEANT)).toBe(false);
      expect(
        modifications(objectOf(project.mapFolder, "unit", "h002")),
      ).toContain("uhpm = 500");
    });

    const report = release(project, ["h002"], {
      ...titles(project.mapFolder, false),
      worldEditorExecutable: executable,
      worldEditorReload: { system: "windows", launch },
    });

    expect(report.worldEditorReloaded).toBe(true);
    expect(report.warnings).toEqual([]);
    expect(launch).toHaveBeenCalledWith(executable, [
      "-launch",
      "-loadfile",
      path.resolve(project.mapFolder),
    ]);
  });

  it("neither reloads nor warns when the map folder is not written", () => {
    const project = syncedProject();
    const launch = vi.fn();

    const report = release(project, ["h002"], {
      ...titles(project.mapFolder, false),
      worldEditorExecutable: "World Editor.exe",
      worldEditorReload: { system: "windows", launch },
    });

    expect(report.written).toEqual([]);
    expect(report.worldEditorReloaded).toBe(false);
    expect(report.warnings).toEqual([]);
    expect(launch).not.toHaveBeenCalled();
  });
});
