import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import { PROBE_FOLDERS } from "../src/folders.js";
import {
  GAME_DATA_SETS,
  GAME_DATA_VERSIONS,
  gameDataMessage,
  parseGameData,
  readGameData,
  writeGameData,
} from "../src/game-data.js";

/** The Template's war3map.w3i, the map folder's: format 39, as the World Editor of 3.0 saves it. */
const TEMPLATE_W3I = new Uint8Array(
  readFileSync(join(PROBE_FOLDERS.map, "war3map.w3i")),
);

/** A 32-bit little-endian integer at `offset`. */
function int32At(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getInt32(offset, true);
}

describe("readGameData", () => {
  // The Template's map declares Melee, at 0x95, and Forsaken Kingdom, at
  // 0xdb: the values the World Editor of 3.0 gives a new map.
  it("reads the Template's Game Data Set and Game Data Version", () => {
    expect(readGameData(TEMPLATE_W3I)).toEqual({ set: "melee", version: "fk" });
    expect(int32At(TEMPLATE_W3I, 0x95)).toBe(2);
    expect(int32At(TEMPLATE_W3I, 0xdb)).toBe(2);
  });

  it("refuses a format without a Game Data Version", () => {
    const old = TEMPLATE_W3I.slice();
    new DataView(old.buffer).setInt32(0, 28, true);
    expect(() => readGameData(old)).toThrow(AuthorError);
    expect(() => readGameData(old)).toThrow(/format 28/);
  });

  it("refuses a file that ends before its Game Data Version", () => {
    expect(() => readGameData(TEMPLATE_W3I.slice(0, 0xdc))).toThrow(
      AuthorError,
    );
  });
});

describe("writeGameData", () => {
  it.each([
    [{ set: "default" }, 0, 2],
    [{ set: "custom" }, 1, 2],
    [{ version: "roc" }, 2, 0],
    [{ version: "tft" }, 2, 1],
    [{ set: "custom", version: "tft" }, 1, 1],
  ] as const)(
    "writes %j over the Template's and changes no other byte",
    (gameData, set, version) => {
      const written = writeGameData(TEMPLATE_W3I, gameData);

      expect(int32At(written, 0x95)).toBe(set);
      expect(int32At(written, 0xdb)).toBe(version);
      expect(written.byteLength).toBe(TEMPLATE_W3I.byteLength);
      const changed = [...written.keys()].filter(
        (offset) => written[offset] !== TEMPLATE_W3I[offset],
      );
      expect(
        changed.every((offset) => offset === 0x95 || offset === 0xdb),
      ).toBe(true);
      expect(readGameData(written)).toEqual({
        set: GAME_DATA_SETS[set],
        version: GAME_DATA_VERSIONS[version],
      });
    },
  );

  it("leaves its input unchanged", () => {
    const before = TEMPLATE_W3I.slice();
    writeGameData(TEMPLATE_W3I, { set: "custom", version: "roc" });
    expect(TEMPLATE_W3I).toEqual(before);
  });
});

describe("parseGameData", () => {
  it("takes no option as the map's own", () => {
    expect(parseGameData(undefined, undefined)).toEqual({});
  });

  it("takes each option's ids", () => {
    expect(parseGameData("custom", "roc")).toEqual({
      set: "custom",
      version: "roc",
    });
    expect(parseGameData(undefined, "fk")).toEqual({ version: "fk" });
  });

  it.each([
    ["Custom", undefined, /--game-data-set.*default, custom, melee/],
    [undefined, "v1", /--game-data-version.*roc, tft, fk/],
  ])("refuses %s %s, naming the ids", (set, version, message) => {
    expect(() => parseGameData(set, version)).toThrow(AuthorError);
    expect(() => parseGameData(set, version)).toThrow(message);
  });
});

describe("gameDataMessage", () => {
  it("names what a build sets, by the World Editor's labels", () => {
    expect(gameDataMessage({})).toBe("");
    expect(gameDataMessage({ set: "custom", version: "roc" })).toBe(
      " under the Game Data Set Custom and the Game Data Version Reign of Chaos",
    );
    expect(gameDataMessage({ version: "fk" })).toBe(
      " under the Game Data Version Forsaken Kingdom",
    );
  });
});
