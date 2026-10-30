// The Rawcode lookup (#588): from a Rawcode literal to what it names, on
// map folders the encoder builds and the workspace's committed
// reforged-builtins index.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MIN_INTERVAL,
  openRawcodeLookup,
  type RawcodeLookupResult,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData, buildWts } from "./support/object-data.js";
import { buildW3i, type TestW3i } from "./support/w3i.js";

afterAll(removeTemporary);
afterEach(() => {
  vi.useRealTimers();
});

const ALL_SETS = [
  { id: "custom-fk", label: "Custom (Forsaken Kingdom)" },
  { id: "melee-fk", label: "Melee (Forsaken Kingdom)" },
  { id: "custom-tft", label: "Custom (The Frozen Throne)" },
  { id: "melee-tft", label: "Melee (The Frozen Throne)" },
  { id: "custom-roc", label: "Custom (Reign of Chaos)" },
  { id: "melee-roc", label: "Melee (Reign of Chaos)" },
];

/**
 * A map folder holding a Custom unit `h000` named Captain through
 * war3map.wts, a Custom unit `h00A` that keeps its base's name, Footman
 * renamed Militia, Knight modified without a rename, and a Custom buff and a
 * Custom destructable both at `B000`.
 */
function sampleMap(): string {
  return mapFolder({
    "war3map.w3u": buildObjectData({
      original: [
        {
          original: "hfoo",
          modifications: [{ field: "unam", value: "Militia" }],
        },
        { original: "hkni", modifications: [{ field: "umvs", value: 300 }] },
      ],
      custom: [
        { original: "hfoo", custom: "h000" },
        { original: "hpea", custom: "h00A" },
      ],
    }),
    "war3mapSkin.w3u": buildObjectData({
      custom: [
        {
          original: "hfoo",
          custom: "h000",
          modifications: [{ field: "unam", value: "TRIGSTR_007" }],
        },
      ],
    }),
    "war3map.wts": buildWts({ 7: "Captain" }),
    "war3map.w3h": buildObjectData({
      custom: [
        {
          original: "Binf",
          custom: "B000",
          modifications: [{ field: "fnam", value: "Holy Fire" }],
        },
      ],
    }),
    "war3map.w3b": buildObjectData({
      custom: [
        {
          original: "LTlt",
          custom: "B000",
          modifications: [{ field: "bnam", value: "Gate" }],
        },
      ],
    }),
  });
}

const openSample = () =>
  openRawcodeLookup({ mapFolder: sampleMap(), projectRoot: PACKAGE_ROOT });

describe("openRawcodeLookup", () => {
  it("returns a Built-in object with its name, race, Game data sets and constant", () => {
    expect(openSample().lookup("Hpal")).toEqual({
      status: "known",
      rawcode: "Hpal",
      objects: [
        {
          origin: "builtin",
          rawcode: "Hpal",
          kind: "unit",
          name: "Paladin",
          race: "human",
          gameDataSets: ALL_SETS,
          constant: {
            object: "Units",
            member: "Paladin_Hpal",
            module: "reforged-builtins/units",
            generated: false,
          },
        },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("returns a Custom object with its name, base, base's race and generated constant", () => {
    const lookup = openSample();

    expect(lookup.lookup("h000")).toEqual({
      status: "known",
      rawcode: "h000",
      objects: [
        {
          origin: "custom",
          rawcode: "h000",
          kind: "unit",
          name: "Captain",
          race: "human",
          base: { rawcode: "hfoo", name: "Footman" },
          constant: {
            object: "CustomUnits",
            member: "Captain_h000",
            module: "custom-units.ts",
            generated: true,
          },
          definitionFile: undefined,
        },
      ],
    } satisfies RawcodeLookupResult);
    expect(lookup.lookup("h00A")).toMatchObject({
      status: "known",
      objects: [
        {
          origin: "custom",
          name: "Peasant",
          base: { rawcode: "hpea", name: "Peasant" },
          constant: { member: "Peasant_h00A" },
        },
      ],
    });
  });

  it("returns a modified Built-in object with the game's name and the map's", () => {
    const lookup = openSample();

    expect(lookup.lookup("hfoo")).toEqual({
      status: "known",
      rawcode: "hfoo",
      objects: [
        {
          origin: "modified",
          rawcode: "hfoo",
          kind: "unit",
          name: "Militia",
          builtinName: "Footman",
          mapName: "Militia",
          race: "human",
          gameDataSets: ALL_SETS,
          constant: {
            object: "Units",
            member: "Footman_hfoo",
            module: "reforged-builtins/units",
            generated: false,
          },
          definitionFile: undefined,
        },
      ],
    } satisfies RawcodeLookupResult);
    expect(lookup.lookup("hkni")).toMatchObject({
      status: "known",
      objects: [
        {
          origin: "modified",
          name: "Knight",
          builtinName: "Knight",
          mapName: undefined,
        },
      ],
    });
  });

  it("returns both objects of a Rawcode a Custom buff and a Custom destructable share", () => {
    const result = openSample().lookup("B000");

    expect(result).toMatchObject({
      status: "known",
      rawcode: "B000",
      objects: [
        {
          origin: "custom",
          kind: "buff",
          name: "Holy Fire",
          base: { rawcode: "Binf", name: "Inner Fire" },
          constant: { object: "CustomBuffs", member: "HolyFire_B000" },
        },
        {
          origin: "custom",
          kind: "destructable",
          name: "Gate",
          base: { rawcode: "LTlt", name: "Summer Tree Wall" },
          constant: { object: "CustomDestructables", member: "Gate_B000" },
        },
      ],
    });
    expect(result.status === "known" && result.objects[1].race).toBe(undefined);
  });

  it("suggests up to three Rawcodes one edit away for an unknown one, a change of case first", () => {
    const lookup = openSample();

    expect(lookup.lookup("hpal")).toEqual({
      status: "unknown",
      rawcode: "hpal",
      suggestions: [
        { rawcode: "Hpal", name: "Paladin", kind: "unit" },
        { rawcode: "Npal", name: "Forsaken Paladin", kind: "unit" },
        { rawcode: "hval", name: "Helm of Valor", kind: "item" },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("suggests the map's objects, by the name the map gives them", () => {
    expect(openSample().lookup("h00a")).toEqual({
      status: "unknown",
      rawcode: "h00a",
      suggestions: [
        { rawcode: "h00A", name: "Peasant", kind: "unit" },
        { rawcode: "h000", name: "Captain", kind: "unit" },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("counts each change of case as one edit", () => {
    const { suggestions } = unknown(openSample().lookup("HPAL"));

    expect(suggestions.map((s) => s.rawcode)).not.toContain("Hpal");
  });

  it("suggests a Rawcode two kinds share once, by its first object", () => {
    const { suggestions } = unknown(openSample().lookup("B00\u007e"));
    const rawcodes = suggestions.map((s) => s.rawcode);

    expect(rawcodes.filter((r) => r === "B000")).toHaveLength(1);
    expect(new Set(rawcodes).size).toBe(rawcodes.length);
    expect(suggestions.find((s) => s.rawcode === "B000")).toEqual({
      rawcode: "B000",
      name: "Holy Fire",
      kind: "buff",
    });
  });

  it("suggests nothing for a Rawcode with no Rawcode one edit away", () => {
    expect(openSample().lookup("zzzz")).toEqual({
      status: "unknown",
      rawcode: "zzzz",
      suggestions: [],
    });
  });

  it("returns a literal that is not four printable ASCII characters as malformed", () => {
    const lookup = openSample();

    for (const literal of ["hfo", "hfooo", "", "hfoĀ", "hé01", "h\u0001oo"]) {
      expect(lookup.lookup(literal)).toEqual({
        status: "malformed",
        rawcode: literal,
      });
    }
  });

  it("returns a malformed literal as malformed even when it is unavailable", () => {
    const lookup = openRawcodeLookup({
      mapFolder: path.join(makeTempDir(), "missing.w3m"),
      projectRoot: PACKAGE_ROOT,
    });

    expect(lookup.lookup("hfo")).toEqual({
      status: "malformed",
      rawcode: "hfo",
    });
  });

  it("is unavailable without reforged-builtins, with its reason", () => {
    const lookup = openRawcodeLookup({
      mapFolder: sampleMap(),
      projectRoot: makeTempDir(),
    });

    expect(lookup.lookup("hfoo")).toEqual({
      status: "unavailable",
      reason:
        "reforged-builtins is not installed: install it in the Map project to look Rawcodes up.",
    });
    expect(lookup.gameVersion()).toBeUndefined();
  });

  it("is unavailable with a missing map folder, with its reason", () => {
    const folder = path.join(makeTempDir(), "missing.w3m");
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    });

    expect(lookup.lookup("hfoo")).toEqual({
      status: "unavailable",
      reason: `Map folder not found: ${folder}. Save the map as a folder from the World Editor (File > Save Map As, "Folder").`,
    });
  });

  it("gives the Game version of the index it read", () => {
    expect(openSample().gameVersion()).toBe("3.0.1");
  });

  it("builds its model on the first lookup and keeps it within the interval", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: 0 });
    const folder = sampleMap();
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    });
    fs.rmSync(path.join(folder, "war3map.w3h"));
    expect(lookup.lookup("B000")).toMatchObject({
      objects: [{ kind: "destructable" }],
    });

    fs.rmSync(folder, { recursive: true });

    expect(lookup.lookup("B000")).toMatchObject({
      objects: [{ kind: "destructable" }],
    });
  });

  it("keeps the minimum interval it is given, one second by default", () => {
    expect(DEFAULT_MIN_INTERVAL).toBe(1000);
    expect(openSample().minInterval).toBe(1000);
    expect(
      openRawcodeLookup({
        mapFolder: sampleMap(),
        projectRoot: PACKAGE_ROOT,
        minInterval: 250,
      }).minInterval,
    ).toBe(250);
  });

  it("loads with require from a CommonJS script", () => {
    const output = execFileSync(
      process.execPath,
      [
        path.join(PACKAGE_ROOT, "test", "fixtures", "require-lookup.cjs"),
        PACKAGE_ROOT,
        sampleMap(),
      ],
      { encoding: "utf8" },
    );

    expect(JSON.parse(output)).toEqual({
      gameVersion: "3.0.1",
      status: "known",
      name: "Captain",
    });
  });
});

/** The warning of a war3map.w3i the lookup cannot read, after its reason. */
const UNKNOWN_SET =
  "the map's Game data set is unknown, so no Built-in object is reported as outside it.";

/**
 * A lookup over a map folder holding this war3map.w3i, Paladin (`Hpal`)
 * modified, and the Guard Lieutenant (`Hct1`) of Forsaken Kingdom modified.
 */
const openWith = (w3i: TestW3i | Uint8Array) =>
  openRawcodeLookup({
    mapFolder: mapFolder({
      "war3map.w3i": w3i instanceof Uint8Array ? w3i : buildW3i(w3i),
      "war3map.w3u": buildObjectData({
        original: [
          { original: "Hpal", modifications: [{ field: "umvs", value: 300 }] },
          { original: "Hct1", modifications: [{ field: "umvs", value: 300 }] },
        ],
      }),
    }),
    projectRoot: PACKAGE_ROOT,
  });

describe("openRawcodeLookup, the map's Game data set", () => {
  // The Forsaken Paladin (`Npal`) is in Melee (The Frozen Throne) and not
  // in Custom (The Frozen Throne); the Warden (`Ewar`) is in no set of
  // Reign of Chaos.
  it.each([
    ["Custom", { set: 1, version: 1 }, "custom-tft"],
    ["Melee", { set: 2, version: 1 }, "melee-tft"],
    [
      "Default, on a map without the melee flag",
      { set: 0, version: 1 },
      "custom-tft",
    ],
    [
      "Default, on a melee map",
      { set: 0, version: 1, melee: true },
      "melee-tft",
    ],
  ])("reads %s from a version 39 header", (_, w3i, id) => {
    const lookup = openWith(w3i);

    expect(lookup.warnings()).toEqual([]);
    expect(lookup.lookup("Npal").status).toBe(
      id === "melee-tft" ? "known" : "not-in-game-data-set",
    );
    expect(lookup.lookup("Hpal").status).toBe("known");
  });

  it("returns a Built-in object outside the map's Game data set with the fields of a known one and the set", () => {
    expect(openWith({ set: 1, version: 0 }).lookup("Ewar")).toEqual({
      status: "not-in-game-data-set",
      rawcode: "Ewar",
      objects: [
        {
          origin: "builtin",
          rawcode: "Ewar",
          kind: "unit",
          name: "Warden",
          race: "nightelf",
          gameDataSets: ALL_SETS.slice(0, 4),
          constant: {
            object: "Units",
            member: "Warden_Ewar",
            module: "reforged-builtins/units",
            generated: false,
          },
        },
      ],
      gameDataSet: { id: "custom-roc", label: "Custom (Reign of Chaos)" },
    } satisfies RawcodeLookupResult);
  });

  it("returns a modified Built-in object outside the map's Game data set as outside it", () => {
    expect(openWith({ set: 2, version: 1 }).lookup("Hct1")).toMatchObject({
      status: "not-in-game-data-set",
      objects: [{ origin: "modified", rawcode: "Hct1" }],
      gameDataSet: { id: "melee-tft" },
    });
  });

  it.each([25, 28])(
    "reads the Game Data Set of a version %i header, as The Frozen Throne",
    (format) => {
      const lookup = openWith({ format, set: 2 });

      expect(lookup.warnings()).toEqual([]);
      expect(lookup.lookup("Npal").status).toBe("known");
      expect(lookup.lookup("Hct1")).toMatchObject({
        status: "not-in-game-data-set",
        gameDataSet: { id: "melee-tft" },
      });
    },
  );

  it("reads the map folder the 3.0 World Editor saved: Melee, Forsaken Kingdom", () => {
    const lookup = openRawcodeLookup({
      mapFolder: fixtureMap("editor-variables.w3m"),
      projectRoot: PACKAGE_ROOT,
    });

    expect(lookup.warnings()).toEqual([]);
    expect(lookup.lookup("Hct1").status).toBe("known");
  });

  it.each([
    ["missing", undefined, `war3map.w3i not found: ${UNKNOWN_SET}`],
    [
      "truncated",
      buildW3i({ set: 2, version: 1 }).slice(0, 120),
      `war3map.w3i not read (it ends before its Game data set): ${UNKNOWN_SET}`,
    ],
    [
      "of an unknown version",
      buildW3i({ format: 30, set: 2, version: 1 }),
      `war3map.w3i not read (format 30, which reforged-map does not read; it reads formats 18, 25, 28, 31, 32, 33, 39): ${UNKNOWN_SET}`,
    ],
    [
      "declaring an unknown Game Data Version",
      buildW3i({ set: 2, version: 3 }),
      `war3map.w3i not read (it declares the Game Data Version 3, which reforged-map does not know): ${UNKNOWN_SET}`,
    ],
  ])("warns of a war3map.w3i %s, and skips the check", (_, w3i, warning) => {
    const lookup =
      w3i === undefined
        ? openRawcodeLookup({
            mapFolder: sampleMap(),
            projectRoot: PACKAGE_ROOT,
          })
        : openWith(w3i);

    expect(lookup.lookup("Ewar").status).toBe("known");
    expect(lookup.lookup("Npal").status).toBe("known");
    expect(lookup.warnings()).toEqual([warning]);
  });

  it("has no warnings when it is unavailable", () => {
    const lookup = openRawcodeLookup({
      mapFolder: sampleMap(),
      projectRoot: makeTempDir(),
    });

    expect(lookup.warnings()).toEqual([]);
  });
});

describe("openRawcodeLookup, freshness", () => {
  /** A lookup over the sample map, its clock at 0, with an interval of one second. */
  function openAtZero() {
    vi.useFakeTimers({ toFake: ["Date"], now: 0 });
    const folder = sampleMap();
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
      minInterval: 1000,
    });
    expect(lookup.lookup("h000").status).toBe("known");
    return { folder, lookup };
  }

  /** The minutes past 2030 of the last modification time `write` set. */
  let minutes = 0;
  /** Writes a file of the map folder, its modification time a minute later than any the test wrote before. */
  function write(folder: string, name: string, bytes: Uint8Array): void {
    const file = path.join(folder, name);
    fs.writeFileSync(file, bytes);
    minutes += 1;
    const time = new Date(Date.UTC(2030, 0, 1) + minutes * 60_000);
    fs.utimesSync(file, time, time);
  }

  const captainOfItems = buildObjectData({
    custom: [
      {
        original: "ratc",
        custom: "I000",
        modifications: [{ field: "unam", value: "Captain's Claws" }],
      },
    ],
  });

  it("sees a file written after the first lookup once the interval has passed, and not before", () => {
    const { folder, lookup } = openAtZero();
    write(
      folder,
      "war3map.w3u",
      buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h001",
            modifications: [{ field: "unam", value: "Sergeant" }],
          },
        ],
      }),
    );

    vi.setSystemTime(999);
    expect(lookup.lookup("h001").status).toBe("unknown");

    vi.setSystemTime(1000);
    expect(lookup.lookup("h001")).toMatchObject({
      status: "known",
      objects: [{ origin: "custom", name: "Sergeant" }],
    });
  });

  it("counts a file removed, and a file added, as changes", () => {
    const { folder, lookup } = openAtZero();
    fs.rmSync(path.join(folder, "war3map.w3h"));

    vi.setSystemTime(1000);
    expect(lookup.lookup("B000")).toMatchObject({
      objects: [{ kind: "destructable" }],
    });

    write(folder, "war3map.w3t", captainOfItems);
    vi.setSystemTime(2000);
    expect(lookup.lookup("I000")).toMatchObject({
      status: "known",
      objects: [{ kind: "item", name: "Captain's Claws" }],
    });
  });

  it("sees war3map.w3i change", () => {
    const { folder, lookup } = openAtZero();
    expect(lookup.lookup("Npal").status).toBe("known");

    write(folder, "war3map.w3i", buildW3i({ set: 1, version: 1 }));
    vi.setSystemTime(1000);

    expect(lookup.lookup("Npal").status).toBe("not-in-game-data-set");
    expect(lookup.warnings()).toEqual([]);
  });

  it("checks the files when the clock is set back", () => {
    const { folder, lookup } = openAtZero();
    vi.setSystemTime(5000);
    expect(lookup.lookup("hfoo").status).toBe("known");
    write(folder, "war3map.w3t", captainOfItems);

    vi.setSystemTime(4000);
    expect(lookup.lookup("I000").status).toBe("known");
  });

  it("checks no file again within the interval of its last check", () => {
    const { folder, lookup } = openAtZero();
    vi.setSystemTime(1500);
    expect(lookup.lookup("hfoo").status).toBe("known");
    write(folder, "war3map.w3t", captainOfItems);

    vi.setSystemTime(2499);
    expect(lookup.lookup("I000").status).toBe("unknown");

    vi.setSystemTime(2500);
    expect(lookup.lookup("I000").status).toBe("known");
  });

  it("becomes available once a missing map folder is saved", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: 0 });
    const folder = path.join(makeTempDir(), "later.w3m");
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    });
    expect(lookup.lookup("hfoo").status).toBe("unavailable");

    fs.mkdirSync(folder);
    vi.setSystemTime(1000);

    expect(lookup.lookup("hfoo").status).toBe("known");
  });

  // Windows has no mode that denies the owner a read, and root reads
  // whatever the mode.
  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
    "is unavailable while a file is unreadable, then recovers once it is readable",
    () => {
      const { folder, lookup } = openAtZero();
      const file = path.join(folder, "war3map.w3u");
      fs.chmodSync(file, 0o000);

      vi.setSystemTime(1000);
      const result = lookup.lookup("h000");
      expect(result).toMatchObject({ status: "unavailable" });
      expect(result.status === "unavailable" && result.reason).toMatch(
        /^The map folder could not be read: EACCES/,
      );
      expect(lookup.lookup("hfo").status).toBe("malformed");

      fs.chmodSync(file, 0o644);
      vi.setSystemTime(2000);
      expect(lookup.lookup("h000").status).toBe("known");
    },
  );
});

/** The unknown result, or a failed expectation. */
function unknown(result: RawcodeLookupResult) {
  if (result.status !== "unknown") {
    throw new Error(`expected unknown, got ${result.status}`);
  }
  return result;
}

describe("openRawcodeLookup, the listing", () => {
  it("lists every object, of the map and Built-in, by Object kind then Rawcode", () => {
    const listing = openSample().list();
    if (listing.status !== "listed") throw new Error(listing.status);
    const { objects } = listing;
    const keys = objects.map((object) => `${object.kind}:${object.rawcode}`);

    expect(keys).toEqual(
      [...keys].sort((a, b) => {
        const [aKind = "", aRawcode = ""] = a.split(":");
        const [bKind = "", bRawcode = ""] = b.split(":");
        const order = [
          "unit",
          "item",
          "ability",
          "buff",
          "destructable",
          "doodad",
          "upgrade",
        ];
        return (
          order.indexOf(aKind) - order.indexOf(bKind) ||
          (aRawcode < bRawcode ? -1 : aRawcode > bRawcode ? 1 : 0)
        );
      }),
    );
    expect(objects.filter((object) => object.rawcode === "B000")).toMatchObject(
      [
        { kind: "buff", origin: "custom", name: "Holy Fire" },
        { kind: "destructable", origin: "custom", name: "Gate" },
      ],
    );
    expect(objects.find((object) => object.rawcode === "hfoo")).toMatchObject({
      origin: "modified",
      name: "Militia",
    });
    expect(objects.find((object) => object.rawcode === "Hpal")).toEqual(
      (openSample().lookup("Hpal") as { objects: unknown[] }).objects[0],
    );
    expect(listing.gameDataSet).toBeUndefined();
  });

  it("gives the map's Game data set with the listing", () => {
    const listing = openWith({ set: 2, version: 1 }).list();

    expect(listing).toMatchObject({
      status: "listed",
      gameDataSet: { id: "melee-tft", label: "Melee (The Frozen Throne)" },
    });
  });

  it("is unavailable as a lookup is, with its reason", () => {
    const lookup = openRawcodeLookup({
      mapFolder: sampleMap(),
      projectRoot: makeTempDir(),
    });

    expect(lookup.list()).toEqual(lookup.lookup("hfoo"));
  });

  it("names the files it reads: the Object data, war3map.wts and war3map.w3i, the index and the definitions", () => {
    const folder = sampleMap();
    const files = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    }).files();

    expect(files).toEqual(
      expect.arrayContaining([
        path.join(folder, "war3map.w3u"),
        path.join(folder, "war3mapSkin.w3u"),
        path.join(folder, "war3map.w3q"),
        path.join(folder, "war3map.wts"),
        path.join(folder, "war3map.w3i"),
        path.join(PACKAGE_ROOT, "object-manifest.json"),
      ]),
    );
    expect(files.every((file) => path.isAbsolute(file))).toBe(true);
  });
});
