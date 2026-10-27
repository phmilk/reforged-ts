// The World Editor contract of Object sync (#713): the Object definitions of
// test/support/editor-sync.ts, synced in two runs into a copy of
// editor-objects.w3m, write every Object data file, Skin file, war3map.wts,
// locale table and war3map.imp byte for byte as the 3.0 World Editor saved
// them twice after loading the same sync, in editor-sync.w3m (its
// provenance: test/fixtures/editor-sync.md).

import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  openObjectData,
  syncObjectDefinitions,
  type ObjectSyncOptions,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import {
  REMOVED_DEFINITIONS,
  SYNCED_DEFINITIONS,
} from "./support/editor-sync.js";

afterAll(removeTemporary);

/** The files the contract covers: both Object data files of each kind, the strings, the locale tables and the import list. */
const FILES = [
  ...["w3u", "w3t", "w3a", "w3h", "w3b", "w3d", "w3q"].flatMap((extension) => [
    `war3map.${extension}`,
    `war3mapSkin.${extension}`,
  ]),
  "war3map.wts",
  "_Locales/deDE.w3mod/war3map.wts",
  "_Locales/ptBR.w3mod/war3map.wts",
  "war3map.imp",
];

/** No World Editor window: the test's map folder is one no editor opens. */
const NO_WINDOW: ObjectSyncOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
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
function write(root: string, files: Readonly<Record<string, string>>): void {
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
}

/** A Map project over a copy of editor-objects.w3m, synced as the run that made the fixture synced it: every definition, then without the removed one. */
function syncedProject(): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, "reforged-ts-template.w3m");
  fs.cpSync(fixtureMap("editor-objects.w3m"), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  link(root, "typescript");
  link(root, "reforged-builtins");

  write(root, { ...SYNCED_DEFINITIONS, ...REMOVED_DEFINITIONS });
  const first = syncObjectDefinitions(mapFolder, root, NO_WINDOW);
  expect(first.added.map(({ rawcode }) => rawcode)).toEqual([
    "h002",
    "hkni",
    "I001",
    "A001",
    "B001",
  ]);
  for (const name of Object.keys(REMOVED_DEFINITIONS)) {
    fs.rmSync(path.join(root, name));
  }
  const second = syncObjectDefinitions(mapFolder, root, NO_WINDOW);
  expect(second.removed.map(({ rawcode }) => rawcode)).toEqual(["I001"]);
  return { root, mapFolder };
}

describe("the World Editor contract of Object sync", () => {
  it("writes every file of the map folder it syncs as the World Editor saved it, twice", () => {
    const { mapFolder } = syncedProject();

    const saved = fixtureMap("editor-sync.w3m");
    for (const name of FILES) {
      expect(
        fs
          .readFileSync(path.join(mapFolder, name))
          .equals(fs.readFileSync(path.join(saved, name))),
        name,
      ).toBe(true);
    }
  });

  it("finds the World Editor's save clean: a sync over it writes no byte", () => {
    const { root, mapFolder } = syncedProject();
    const manifest = fs.readFileSync(path.join(root, "object-manifest.json"));
    fs.rmSync(mapFolder, { recursive: true });
    fs.cpSync(fixtureMap("editor-sync.w3m"), mapFolder, { recursive: true });

    const report = syncObjectDefinitions(mapFolder, root, NO_WINDOW);

    expect(report.written).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(report.warnings).toEqual([]);
    expect(
      fs.readFileSync(path.join(root, "object-manifest.json")).equals(manifest),
    ).toBe(true);
  });

  it("reads the World Editor's save back with no warning, the removed item gone and the translations kept", () => {
    const editor = openObjectData(fixtureMap("editor-sync.w3m"), {
      projectRoot: PACKAGE_ROOT,
    });
    expect(editor.warnings).toEqual([]);
    expect(editor.objects("item").map(({ rawcode }) => rawcode)).not.toContain(
      "I001",
    );
    const sergeant = editor
      .objects("unit")
      .find(({ rawcode }) => rawcode === "h002");
    expect(
      sergeant?.modifications.find(({ field }) => field === "unam")
        ?.translations,
    ).toEqual({ deDE: "Feldwebel", ptBR: "Sargento" });
  });
});
