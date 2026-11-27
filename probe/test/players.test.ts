import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import { PROBE_FOLDERS } from "../src/folders.js";
import {
  parsePlayers,
  playersFrom,
  playersLine,
  playersMessage,
  readPlayers,
  writePlayers,
  writePlayersScript,
} from "../src/players.js";

/** The Template's war3map.w3i, the map folder's: format 39, as the World Editor of 3.0 saves it. */
const TEMPLATE_W3I = new Uint8Array(
  readFileSync(join(PROBE_FOLDERS.map, "war3map.w3i")),
);

/** The Template's war3map.lua, the editor script, with its CRLF line ends. */
const TEMPLATE_LUA = readFileSync(join(PROBE_FOLDERS.map, "war3map.lua"));

/** Lines joined as the World Editor joins them, with CRLF. */
function lines(...text: string[]): string {
  return text.map((line) => `${line}\r\n`).join("");
}

/**
 * Where the Template's tables start, at its player count, and where they
 * end, past its one force: what follows is the four empty tables of
 * upgrades, techs, random units and random items.
 */
const TABLES_START = 0x113;
const TABLES_END = 0x167;

/** A copy of `bytes` with a 32-bit little-endian integer written at `offset`. */
function withInt32(bytes: Uint8Array, offset: number, value: number) {
  const copy = bytes.slice();
  new DataView(copy.buffer).setInt32(offset, value, true);
  return copy;
}

describe("readPlayers", () => {
  // The Template's map declares one player record, at 0x117, Player 1, a
  // user slot, its start at (-1408, 1728), and one force, at 0x153, whose
  // mask holds every player.
  it("reads the Template's one user slot and its force", () => {
    expect(readPlayers(TEMPLATE_W3I)).toEqual([
      { player: 0, user: true, x: -1408, y: 1728, force: 0 },
    ]);
  });

  it.each([28, 33])(
    "refuses format %i, of another layout than 39",
    (format) => {
      const other = withInt32(TEMPLATE_W3I, 0, format);
      expect(() => readPlayers(other)).toThrow(AuthorError);
      expect(() => readPlayers(other)).toThrow(`format ${String(format)}`);
    },
  );

  it("refuses a file cut short in its tables", () => {
    expect(() => readPlayers(TEMPLATE_W3I.slice(0, TABLES_END))).toThrow(
      /cut short/,
    );
  });

  it("refuses a file with bytes past its last table", () => {
    const longer = new Uint8Array(TEMPLATE_W3I.byteLength + 1);
    longer.set(TEMPLATE_W3I);
    expect(() => readPlayers(longer)).toThrow(/1 bytes past its last table/);
  });
});

describe("writePlayers", () => {
  it("gives the Template's map two user slots in its force, the second's start mirrored through the map's centre", () => {
    expect(readPlayers(writePlayers(TEMPLATE_W3I, 2))).toEqual([
      { player: 0, user: true, x: -1408, y: 1728, force: 0 },
      { player: 1, user: true, x: 1408, y: -2240, force: 0 },
    ]);
  });

  it("changes no byte before or after the tables", () => {
    const written = writePlayers(TEMPLATE_W3I, 2);

    expect(written.subarray(0, TABLES_START)).toEqual(
      TEMPLATE_W3I.subarray(0, TABLES_START),
    );
    expect(written.subarray(written.byteLength - 16)).toEqual(
      TEMPLATE_W3I.subarray(TABLES_END),
    );
  });

  it("copies the first record for the second slot, its number, name and start its own", () => {
    const written = writePlayers(TEMPLATE_W3I, 2);
    const view = new DataView(written.buffer, written.byteOffset);
    // The second record starts past the first, 0x117 to 0x14f.
    const second = 0x14f;

    expect(view.getInt32(TABLES_START, true)).toBe(2);
    expect(view.getInt32(second, true)).toBe(1);
    // Controller, race, HUD skin and fixed start, as the first's.
    expect(written.subarray(second + 4, second + 20)).toEqual(
      TEMPLATE_W3I.subarray(0x11b, 0x12b),
    );
    expect(
      Buffer.from(written.subarray(second + 20, second + 29)).toString(),
    ).toBe("Player 2\0");
    // Ally and enemy priorities, as the first's.
    expect(written.subarray(second + 37, second + 53)).toEqual(
      TEMPLATE_W3I.subarray(0x13f, 0x14f),
    );
  });

  it("leaves its input unchanged, a Buffer included", () => {
    const buffer = readFileSync(join(PROBE_FOLDERS.map, "war3map.w3i"));
    const before = Buffer.from(buffer);
    writePlayers(buffer, 2);
    expect(buffer).toEqual(before);
  });

  it.each([0, 1, 3])("refuses %i players, a number it does not stage", (n) => {
    expect(() => writePlayers(TEMPLATE_W3I, n)).toThrow(AuthorError);
    expect(() => writePlayers(TEMPLATE_W3I, n)).toThrow(/stages 2 players/);
  });

  it("writes nothing over a map that has more than one player already", () => {
    expect(() => writePlayers(writePlayers(TEMPLATE_W3I, 2), 2)).toThrow(
      /declares 2 player records/,
    );
  });

  it("writes nothing over a first slot that is not a user's", () => {
    // Player 1's controller, at 0x11b: 2, a computer.
    expect(() => writePlayers(withInt32(TEMPLATE_W3I, 0x11b, 2), 2)).toThrow(
      AuthorError,
    );
  });

  it("writes nothing over a map of more than one force", () => {
    // A second force, its flags and mask 0 and its name "F", past the first.
    const twoForces = new Uint8Array(TEMPLATE_W3I.byteLength + 10);
    twoForces.set(TEMPLATE_W3I.subarray(0, TABLES_END));
    twoForces.set([0, 0, 0, 0, 0, 0, 0, 0, 0x46, 0], TABLES_END);
    twoForces.set(TEMPLATE_W3I.subarray(TABLES_END), TABLES_END + 10);
    new DataView(twoForces.buffer).setInt32(0x14f, 2, true);

    expect(readPlayers(twoForces)).toHaveLength(1);
    expect(() => writePlayers(twoForces, 2)).toThrow(/declares 2 forces/);
  });
});

describe("writePlayersScript", () => {
  const slots = readPlayers(writePlayers(TEMPLATE_W3I, 2));
  const template = TEMPLATE_LUA.toString("latin1");

  it("gives the Template's script a config, slots and teams for two users, every other line unchanged", () => {
    const expected = template
      .replace(
        lines(
          "SetPlayerController(Player(0), MAP_CONTROL_USER)",
          "end",
          "",
          "function InitCustomTeams()",
          "SetPlayerTeam(Player(0), 0)",
          "end",
        ),
        lines(
          "SetPlayerController(Player(0), MAP_CONTROL_USER)",
          "SetPlayerStartLocation(Player(1), 1)",
          "SetPlayerColor(Player(1), ConvertPlayerColor(1))",
          "SetPlayerRacePreference(Player(1), RACE_PREF_HUMAN)",
          "SetPlayerRaceSkin(Player(1), RACE_PREF_RANDOM)",
          "SetPlayerRaceSelectable(Player(1), true)",
          "SetPlayerController(Player(1), MAP_CONTROL_USER)",
          "end",
          "",
          "function InitCustomTeams()",
          "SetPlayerTeam(Player(0), 0)",
          "SetPlayerTeam(Player(1), 0)",
          "end",
        ),
      )
      .replace(
        lines(
          "SetPlayers(1)",
          "SetTeams(1)",
          "SetGamePlacement(MAP_PLACEMENT_USE_MAP_SETTINGS)",
          "DefineStartLocation(0, -1408.0, 1728.0)",
          "InitCustomPlayerSlots()",
          "SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)",
        ),
        lines(
          "SetPlayers(2)",
          "SetTeams(1)",
          "SetGamePlacement(MAP_PLACEMENT_USE_MAP_SETTINGS)",
          "DefineStartLocation(0, -1408.0, 1728.0)",
          "DefineStartLocation(1, 1408.0, -2240.0)",
          "InitCustomPlayerSlots()",
          "SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)",
          "SetPlayerSlotAvailable(Player(1), MAP_CONTROL_USER)",
        ),
      );
    expect(expected).not.toBe(template);

    expect(
      Buffer.from(writePlayersScript(TEMPLATE_LUA, slots)).toString("latin1"),
    ).toBe(expected);
  });

  it("leaves its input unchanged", () => {
    const before = Buffer.from(TEMPLATE_LUA);
    writePlayersScript(TEMPLATE_LUA, slots);
    expect(TEMPLATE_LUA).toEqual(before);
  });

  it.each([
    [
      "a config of two players",
      "SetPlayers(1)",
      "SetPlayers(2)",
      /SetPlayers\(2\)/,
    ],
    [
      "a second slot configured already",
      "SetPlayerTeam(Player(0), 0)",
      "SetPlayerTeam(Player(0), 0)\r\nSetPlayerTeam(Player(1), 0)",
      /SetPlayerTeam\(Player\(1\), 0\)/,
    ],
    [
      "a start of Player 1 the w3i does not declare",
      "DefineStartLocation(0, -1408.0, 1728.0)",
      "DefineStartLocation(0, 0.0, 0.0)",
      /DefineStartLocation\(0, 0\.0, 0\.0\)/,
    ],
    [
      "no SetPlayerSlotAvailable of Player 1",
      "SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)\r\n",
      "",
      /SetPlayerSlotAvailable/,
    ],
  ])("writes nothing over %s, naming the line", (_, line, other, message) => {
    const script = Buffer.from(template.replace(line, other), "latin1");
    expect(() => writePlayersScript(script, slots)).toThrow(AuthorError);
    expect(() => writePlayersScript(script, slots)).toThrow(message);
  });
});

describe("parsePlayers", () => {
  it("takes no option as the map's own", () => {
    expect(parsePlayers(undefined)).toBeUndefined();
  });

  it("takes 2", () => {
    expect(parsePlayers("2")).toBe(2);
  });

  it.each(["1", "3", "two", "2.0", ""])(
    "refuses %j, naming what it takes",
    (value) => {
      expect(() => parsePlayers(value)).toThrow(AuthorError);
      expect(() => parsePlayers(value)).toThrow(/--players.*takes 2/);
    },
  );
});

describe("the players of a build, in its line, its BEGIN line and probe:read", () => {
  it("names them in the build's line, nothing when it kept the map's own", () => {
    expect(playersMessage(undefined)).toBe("");
    expect(playersMessage(2)).toBe(" with 2 player slots");
  });

  it("reads them back from a BEGIN field or a state file, and nothing it does not know", () => {
    expect(playersFrom("2")).toBe(2);
    expect(playersFrom(2)).toBe(2);
    for (const value of [undefined, "", "3", 3, "x", null]) {
      expect(playersFrom(value)).toBeUndefined();
    }
  });

  it("gives probe:read's line, none when the build kept the map's own", () => {
    expect(playersLine(undefined)).toBeUndefined();
    expect(playersLine(2)).toBe(
      "Players: 2 user slots, staged by the build; the map folder's own has 1",
    );
  });
});
