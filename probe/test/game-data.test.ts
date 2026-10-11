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
    expect(readGameData(TEMPLATE_W3I)).toEqual({
      set: "melee",
      version: "fk",
      melee: false,
    });
    expect(int32At(TEMPLATE_W3I, 0x95)).toBe(2);
    expect(int32At(TEMPLATE_W3I, 0xdb)).toBe(2);
  });

  it.each([28, 33])(
    "refuses format %i, of another layout than 39",
    (format) => {
      const other = TEMPLATE_W3I.slice();
      new DataView(other.buffer).setInt32(0, format, true);
      expect(() => readGameData(other)).toThrow(AuthorError);
      expect(() => readGameData(other)).toThrow(`format ${String(format)}`);
    },
  );

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
        melee: false,
      });
    },
  );

  it("leaves its input unchanged, a Buffer included", () => {
    const buffer = readFileSync(join(PROBE_FOLDERS.map, "war3map.w3i"));
    const before = Buffer.from(buffer);
    writeGameData(buffer, { set: "custom", version: "roc", melee: true });
    expect(buffer).toEqual(before);
  });

  // The flags field, at 0x84, holds the melee map flag as its bit 0x0004.
  it("sets the melee map flag, and no other bit", () => {
    const written = writeGameData(TEMPLATE_W3I, { melee: true });

    expect(readGameData(written)).toEqual({
      set: "melee",
      version: "fk",
      melee: true,
    });
    expect(int32At(written, 0x84)).toBe(int32At(TEMPLATE_W3I, 0x84) | 0x0004);
  });

  it("writes nothing where the fields hold a value it does not know", () => {
    const moved = TEMPLATE_W3I.slice();
    new DataView(moved.buffer).setInt32(0xdb, 7, true);
    expect(() => writeGameData(moved, { set: "custom" })).toThrow(
      /Game Data Version 7/,
    );
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
    expect(gameDataMessage({ set: "default", melee: true })).toBe(
      " under the Game Data Set Default and the melee map flag",
    );
  });
});
