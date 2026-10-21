// The World Editor contract (#640): the scripted edits of
// test/support/editor-contract.ts, applied by the Object data editor to a
// copy of editor-objects.w3m, write every Object data file, Skin file and
// war3map.wts byte for byte as the 3.0 World Editor saved them after
// loading the same edits, in editor-contract.w3m (its provenance:
// test/fixtures/editor-contract.md).

import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { openObjectData } from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import {
  applyContractEdits,
  seedForeignLiteral,
} from "./support/editor-contract.js";

afterAll(removeTemporary);

/** The files the contract covers: both Object data files of each kind, then the strings. */
const FILES = [
  ...["w3u", "w3t", "w3a", "w3h", "w3b", "w3d", "w3q"].flatMap((extension) => [
    `war3map.${extension}`,
    `war3mapSkin.${extension}`,
  ]),
  "war3map.wts",
];

describe("the World Editor contract", () => {
  it("writes every Object data file, Skin file and war3map.wts of the scripted edits as the World Editor saved them", () => {
    const folder = path.join(makeTempDir(), "editor-objects.w3m");
    fs.cpSync(fixtureMap("editor-objects.w3m"), folder, { recursive: true });
    seedForeignLiteral(folder);
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });
    expect(editor.warnings).toEqual([]);

    applyContractEdits(editor);
    expect(editor.save(undefined, { worldEditorCheck: false }).written).toEqual(
      FILES,
    );

    const saved = fixtureMap("editor-contract.w3m");
    for (const name of FILES) {
      expect(
        fs
          .readFileSync(path.join(folder, name))
          .equals(fs.readFileSync(path.join(saved, name))),
        name,
      ).toBe(true);
    }
  });

  it("reads the World Editor's save back with no warning, the edits' objects and strings in it", () => {
    const editor = openObjectData(fixtureMap("editor-contract.w3m"), {
      projectRoot: PACKAGE_ROOT,
    });
    expect(editor.warnings).toEqual([]);
    const strings = fs.readFileSync(
      path.join(fixtureMap("editor-contract.w3m"), "war3map.wts"),
      "utf8",
    );
    // A buff without an editor name and an upgrade without a name at level
    // 0, named by their bases as the index's commentName gives them (#654).
    expect(strings).toContain(
      "// Buffs/Effects: B003 (Blizzard (Caster)), Bufftip (Tooltip)",
    );
    expect(strings).toContain(
      "// Upgrades: R002 (Black Gunpowder,Refined Gunpowder,Imbued Gunpowder), Name (Name)",
    );
    // The removed Custom upgrade.
    expect(editor.objects().map(({ rawcode }) => rawcode)).not.toContain(
      "R000",
    );
  });
});
