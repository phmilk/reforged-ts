/** @noSelfInFile */

// No root-time Handles: requiring the library index makes no Handle-creating
// Native call. `Players`, the sync Trigger and its events are born at the
// `globals` stage, the game-time and host Timers at `gameStart`, and the host
// System's join-time measurement runs at `config` time, in the lobby. The
// tests drive the compiled library through the entry points as the game does
// (`config`, `main`, then `MarkGameStarted`) and assert on the stub call log
// and on `Players`. The file's tests share one Lua state and one run of the
// editor's script, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import { editorLog } from "./support/bundle-position";
import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { tsGlobals } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";

declare const config: () => void;
declare const main: () => void;

/** The Natives that create the library's own Handles. */
const creators = ["Player", "CreateTrigger", "CreateTimer"];

/** The call-log lines of the Natives `names`, in call order. */
function callsTo(names: readonly string[]): string[] {
  return stubCalls().filter((line) =>
    names.some((name) => line.startsWith(`${name}(`)),
  );
}

/**
 * Runs `body` with `os.clock` logging `"os.clock"` on `editorLog` each time
 * it is read, and puts the real clock back afterwards.
 */
function withClockLogged(body: () => void): void {
  const osLibrary = os as unknown as Record<string, unknown>;
  const previous = os.clock;
  osLibrary.clock = () => {
    editorLog.push("os.clock");
    return previous();
  };
  try {
    body();
  } finally {
    osLibrary.clock = previous;
  }
}

describe("requiring the library index", () => {
  it("makes no Handle-creating Native call", () => {
    expect(callsTo(creators)).toEqual([]);
    expect(
      callsTo(["BlzTriggerRegisterPlayerSyncEvent", "TimerStart"]),
    ).toEqual([]);
  });

  it("leaves Players empty", () => {
    expect(tsGlobals.Players).toEqual([]);
  });
});

describe("the host System", () => {
  it("measures the join time when config runs, before the map's config", () => {
    withClockLogged(() => {
      config();
    });
    expect(editorLog).toEqual(["os.clock", "config"]);
  });
});

describe("the globals stage", () => {
  it("creates one player per slot, the sync Trigger and its events for the two playing slots, and nothing else", () => {
    main();
    const calls = callsTo([
      ...creators,
      "BlzTriggerRegisterPlayerSyncEvent",
      "TriggerAddAction",
    ]);
    const players: string[] = [];
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      players.push(`Player(${String(slot)})`);
    }
    // The Trigger's handle is not exposed: the first event line names it.
    const [trigger] = string.match(
      calls[bj_MAX_PLAYER_SLOTS + 1] ?? "",
      "%((trigger#%d+), ",
    );
    const slot0 = handleRef("player", tsGlobals.Players[0].handle);
    const slot1 = handleRef("player", tsGlobals.Players[1].handle);
    expect(calls).toEqual([
      ...players,
      "CreateTrigger()",
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot0}, "T", false)`,
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot0}, "S", false)`,
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot1}, "T", false)`,
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot1}, "S", false)`,
      `TriggerAddAction(${trigger}, <function>)`,
    ]);
  });

  it("fills Players with one MapPlayer per slot, wrapping the handle Player returns for it", () => {
    expect(tsGlobals.Players.length).toEqual(bj_MAX_PLAYER_SLOTS);
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      expect(tsGlobals.Players[slot].handle).toBe(
        defined(Player(slot), "Player(slot)"),
      );
    }
  });
});

describe("the gameStart stage", () => {
  it("creates and starts the game-time and host Timers, none earlier", () => {
    expect(callsTo(["CreateTimer", "TimerStart"])).toEqual([]);
    MarkGameStarted();
    const calls = callsTo(["CreateTimer", "TimerStart"]);
    // The Timers' handles are not exposed: the start lines name them.
    const [gameTime] = string.match(calls[1] ?? "", "%((timer#%d+), ");
    const [host] = string.match(calls[3] ?? "", "%((timer#%d+), ");
    expect(calls).toEqual([
      "CreateTimer()",
      `TimerStart(${gameTime}, 30, true, <function>)`,
      "CreateTimer()",
      `TimerStart(${host}, 0, false, <function>)`,
    ]);
  });
});
