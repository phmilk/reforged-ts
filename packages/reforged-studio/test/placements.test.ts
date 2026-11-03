/**
 * The placement reader (#835): the `.doo` files of `reforged-map`'s World
 * Editor fixtures, saved by the 3.0 World Editor, and files written in the
 * layouts it reads (`support/placements.ts`), every list a record carries
 * filled. #482's scratch map is not committed: its files were not kept.
 */
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  DOODADS_FILE,
  PlacementFileError,
  placementCount,
  placementFile,
  readDoodadPlacements,
  readPlacements,
  readUnitPlacements,
  UNITS_FILE,
} from "../src/index.js";
import { doodadsFile, unitsFile } from "./support/placements.js";
import { FIXTURE, makeTempDir, removeTemporary } from "./support/studio.js";

afterAll(removeTemporary);

/** The World Editor fixtures of `reforged-map`, beside {@link FIXTURE}. */
const FIXTURES = path.dirname(FIXTURE);

/** The fixtures that hold both placement files. */
const editorFixtures = fs
  .readdirSync(FIXTURES)
  .filter(
    (name) =>
      name.startsWith("editor-") &&
      fs.existsSync(path.join(FIXTURES, name, UNITS_FILE)),
  )
  .sort();

describe("the placement reader", () => {
  it("reads the placement files of every World Editor fixture: one start location, no doodad", () => {
    // Saved by the 3.0 World Editor: the units file in version 13,
    // sub-version 9 or 11, and the doodads file in version 13, sub-version 11.
    expect(editorFixtures.length).toBeGreaterThanOrEqual(4);
    for (const name of editorFixtures) {
      const placements = readPlacements(path.join(FIXTURES, name));
      expect(placements.warnings, name).toEqual([]);
      expect(Object.fromEntries(placements.units), name).toEqual({ sloc: 1 });
      expect(placements.doodads.size, name).toBe(0);
    }
  });

  it("counts the units and items of a units file of version 13, each list of a record filled", () => {
    const counts = readUnitPlacements(
      unitsFile([
        { rawcode: "h000", itemSets: [[["I000", 100]], []], lights: 2 },
        {
          rawcode: "h000",
          inventory: ["I000", "ratc"],
          abilities: ["A000"],
          random: 1,
        },
        { rawcode: "I000", random: [2, 3] },
        { rawcode: "hfoo" },
      ]),
    );

    expect(Object.fromEntries(counts)).toEqual({ h000: 2, I000: 1, hfoo: 1 });
  });

  it("reads sub-version 9, which has no item table and no hero attributes", () => {
    const counts = readUnitPlacements(
      unitsFile([{ rawcode: "h000" }, { rawcode: "sloc" }], { subversion: 9 }),
    );

    expect(Object.fromEntries(counts)).toEqual({ h000: 1, sloc: 1 });
  });

  it("counts the destructables, doodads and special doodads of a doodads file of version 13", () => {
    const counts = readDoodadPlacements(
      doodadsFile(
        [
          { rawcode: "B000", itemSets: [[["I000", 50]]], lights: 1 },
          { rawcode: "D000" },
          { rawcode: "B000" },
        ],
        ["D000"],
      ),
    );

    expect(Object.fromEntries(counts)).toEqual({ B000: 2, D000: 2 });
  });

  it("reads version 8 without skin ids, the layout before them", () => {
    const counts = readDoodadPlacements(
      doodadsFile([{ rawcode: "LTlt" }, { rawcode: "D000" }], [], {
        version: 8,
        skin: false,
      }),
    );

    expect(Object.fromEntries(counts)).toEqual({ LTlt: 1, D000: 1 });
  });

  it("refuses a file that reads in no layout to its last byte", () => {
    const file = unitsFile([{ rawcode: "h000" }]);

    expect(() => readUnitPlacements(file.subarray(0, file.length - 3))).toThrow(
      PlacementFileError,
    );
    expect(() =>
      readDoodadPlacements(Uint8Array.from([...doodadsFile([]), 0])),
    ).toThrow(PlacementFileError);
    expect(() => readUnitPlacements(new TextEncoder().encode("W3E!"))).toThrow(
      PlacementFileError,
    );
  });

  it("reads a map folder: a missing file places nothing, an unreadable one warns", () => {
    const folder = makeTempDir("placements");
    fs.writeFileSync(path.join(folder, UNITS_FILE), "not a placement file");

    const placements = readPlacements(folder);

    expect(placements.units.size).toBe(0);
    expect(placements.doodads.size).toBe(0);
    expect(placements.warnings).toEqual([
      expect.stringContaining(`${UNITS_FILE} is not in a layout`) as unknown,
    ]);
  });

  it("gives each kind its placement file, and counts an object's placements", () => {
    const folder = makeTempDir("placements");
    fs.writeFileSync(
      path.join(folder, UNITS_FILE),
      unitsFile([{ rawcode: "B000" }]),
    );
    fs.writeFileSync(
      path.join(folder, DOODADS_FILE),
      doodadsFile([{ rawcode: "B000" }, { rawcode: "B000" }]),
    );
    const placements = readPlacements(folder);

    expect(placementFile("unit")).toBe(UNITS_FILE);
    expect(placementFile("item")).toBe(UNITS_FILE);
    expect(placementFile("destructable")).toBe(DOODADS_FILE);
    expect(placementFile("doodad")).toBe(DOODADS_FILE);
    expect(placementFile("buff")).toBeUndefined();
    expect(placementCount(placements, "destructable", "B000")).toBe(2);
    expect(placementCount(placements, "unit", "B000")).toBe(1);
    expect(placementCount(placements, "buff", "B000")).toBe(0);
  });
});
