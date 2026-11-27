// game.chat, game.select, game.deselect and game.leave of reforged-test/map,
// and the selection Natives of the Shipped stubs: the fixture files of
// fixtures/actions, each run in a Test game per test. The chat cases copy
// docs/research/chat-event-matching.md and the selection cases
// docs/research/selection-events.md.

import { afterAll, describe, expect, it } from "vitest";
import { runLuaTestFiles, type LuaTestFile } from "../src/index.js";
import { outDir, removeOutDirs } from "./support/fixture.js";

afterAll(removeOutDirs);

const files = runLuaTestFiles({ outDir: outDir("actions") });

function file(testFile: string): LuaTestFile {
  const found = files.find((candidate) => candidate.testFile === testFile);
  if (found === undefined) {
    throw new Error(
      `no ${testFile} in ${files.map((f) => f.testFile).join(", ")}`,
    );
  }
  return found;
}

/** The tests of one describe of a fixture file, by name and status. */
function suite(
  from: LuaTestFile,
  name: string,
): { name: string; status: string; message?: string }[] {
  return from.tests
    .filter((test) => test.suite[0] === name)
    .map((test) =>
      test.status === "pass"
        ? { name: test.name, status: test.status }
        : { name: test.name, status: test.status, message: test.message },
    );
}

/** The tests of one describe, each passing. */
function passing(...names: string[]): { name: string; status: string }[] {
  return names.map((name) => ({ name, status: "pass" }));
}

describe("game.chat, on reforged-test/map", () => {
  const chat = file("chat.test.ts");
  // The messages of the Probe: case, a filter of two words, the empty
  // filter alone, the filter inside a message and between two spaces.
  const MESSAGES = [
    "-hello",
    "-HELLO",
    "-HeLLo",
    "-Hello World",
    "-hello world",
    "x",
    "say -hello now",
    " -hello ",
    "ELL",
  ];

  it("matches as the Probe of chat matching measured the game matching", () => {
    expect(chat.error).toBeUndefined();
    expect(suite(chat, "game.chat matches as the game does")).toEqual(
      passing(
        ...MESSAGES.map(
          (message) =>
            `fires what the Probe saw the message [${message}] fire, in its order`,
        ),
        "runs a Trigger once per matching registration, each reading its own filter",
        "runs the registrations in the order they were made, over every Trigger",
        "reaches the typing player's registrations only",
      ),
    );
  });

  it("fills the game's responses, the event of id 96 among them, and writes no state", () => {
    expect(suite(chat, "game.chat")).toEqual(
      passing(
        "answers the message as given, the filter in lower case and the typing player",
        "answers the event of id 96 as GetTriggerEventId, not EVENT_PLAYER_CHAT",
        "runs a condition before its action, and skips a disabled or destroyed Trigger",
        "takes anything with .handle, writes no state and returns nothing",
        "is no error with no Trigger registered",
        "throws a handler's error out of the action",
      ),
    );
  });

  it("refuses a player who is not playing, and what is not a player or a message", () => {
    expect(suite(chat, "game.chat refuses what the game refuses")).toEqual(
      passing(
        "a player who is not playing: an empty slot",
        "what is not a player: a bare number, nothing, a unit, a Handle of newHandle",
        "a message that is not a string",
        "names the test's line, not the harness's",
      ),
    );
  });
});

describe("game.select and game.deselect, on reforged-test/map", () => {
  const select = file("select.test.ts");
  const ORDERS = [
    "the player's event registered first",
    "the unit's event registered first",
  ];

  it("game.select writes the player's selection and dispatches the player unit event, then the unit's", () => {
    expect(select.error).toBeUndefined();
    expect(suite(select, "game.select")).toEqual(
      passing(
        ...ORDERS.map(
          (order) =>
            `dispatches the player unit event of the player who selects, then the unit's: ${order}`,
        ),
        "writes the player's selection, read by IsUnitSelected and GroupEnumUnitsSelected",
        "adds to the selection and clears nothing",
        "selects another player's unit: the selecting player's event, and the owner as the unit event's player",
        "keeps a selection per player",
        "takes anything with .handle, for the player and for the unit",
        "throws a handler's error out of the action",
      ),
    );
  });

  it("game.deselect dispatches the two events, the unit still selected, then takes it out", () => {
    expect(suite(select, "game.deselect")).toEqual(
      passing(
        ...ORDERS.map(
          (order) =>
            `dispatches the player unit event of the player who deselects, then the unit's: ${order}`,
        ),
        "takes the unit out of the player's selection, the others kept in their order",
        "deselects another player's unit: the owner as the unit event's player",
        "deselects a unit that died or was removed while selected",
      ),
    );
  });

  it("refuse a unit already selected, dead or removed, one not selected, and a player who is not playing", () => {
    expect(
      suite(
        select,
        "game.select and game.deselect refuse what the game refuses",
      ),
    ).toEqual(
      passing(
        "selecting a unit already selected",
        "selecting a unit SelectUnit selected for the local player",
        "selecting a dead unit",
        "selecting a removed unit, alive or dead",
        "deselecting a unit that is not selected",
        "a player who is not playing: an empty slot",
        "deselecting for a player who selected nothing, playing or not",
        "what is not a player or not a unit",
        "names the test's line, not the harness's",
      ),
    );
  });

  it("SelectUnit and ClearSelection write the selection game.select writes and dispatch nothing", () => {
    expect(suite(select, "SelectUnit and ClearSelection")).toEqual(
      passing(
        "write the local player's selection, the one game.select writes, and dispatch nothing",
        "SelectUnit leaves a unit already selected in its place, and one not selected out",
        "SelectUnit selects no dead and no removed unit",
        "ClearSelection empties the local player's selection, and no other player's",
        "act for the local player the test set",
      ),
    );
  });

  it("GroupEnumUnitsSelected holds the selection, through its filter", () => {
    expect(suite(select, "GroupEnumUnitsSelected")).toEqual(
      passing(
        "empties the group first, then holds the selection in the order it was made",
        "asks its filter about each selected unit, as GetFilterUnit, and keeps the ones it accepts",
      ),
    );
  });
});

describe("game.leave, on reforged-test/map", () => {
  const leave = file("leave.test.ts");

  it("writes PLAYER_SLOT_STATE_LEFT and dispatches EVENT_PLAYER_LEAVE, with nothing derived", () => {
    expect(leave.error).toBeUndefined();
    expect(suite(leave, "game.leave")).toEqual(
      passing(
        "writes PLAYER_SLOT_STATE_LEFT, then dispatches EVENT_PLAYER_LEAVE of that player",
        "fires no defeat and no victory, and keeps the player's units",
        "takes anything with .handle",
        "throws a handler's error out of the action, the player gone",
      ),
    );
  });

  it("refuses a player who is not playing, and that player's chat and select after it left", () => {
    expect(suite(leave, "game.leave refuses what the game refuses")).toEqual(
      passing(
        "a player who is not playing: an empty slot",
        "a player who already left",
        "after leaving, that player's chat and select, its selection kept",
        "what is not a player: a bare number, nothing, a unit, a Handle of newHandle",
        "names the test's line, not the harness's",
      ),
    );
  });
});
