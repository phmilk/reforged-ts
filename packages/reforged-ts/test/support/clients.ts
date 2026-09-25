/** @noSelfInFile */

// Simulated clients: N copies of the library in one Lua state, one per game
// client, each with its own local player and its own clock. Every client
// runs the same code, as the game's clients do, and a test compares what
// they decided.
//
// A copy is loaded through the module-reload support, in the bundle
// position: the client's own editor entry points (`config`, `main`,
// `InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`,
// `MarkGameStarted`) exist when it loads and it wraps them. Each client
// keeps those globals and the library's own global (the Init state) apart
// from the other clients', so `client.run(() => { main(); })` runs that
// client's Init stages and no other's.
//
// `run` puts the client's globals, local player and clock in place for the
// length of its body and puts back what was there afterwards. A callback the
// client's code hands to the game while it runs (a trigger action, a
// condition or filter, a timer handler) runs as that client whenever it is
// fired later, so one `__stub_deliver_sync` fires every client's sync Trigger,
// each handler as its own client.

import type * as Library from "../../src/index";
import { type EditorFunction, editorFunction, globals } from "./editor-script";
import { reloadModules } from "./reload";

/** The library's exports, as one client's copy has them. */
export type LibraryCopy = typeof Library;

/** The global the library keeps its shared state under (`anchored`). */
const LIBRARY_GLOBAL = "reforged-ts";

/** The editor's entry points, each client's own: all but `InitBlizzard` defined. */
const ENTRY_POINTS: readonly EditorFunction[] = [
  "config",
  "main",
  "InitBlizzard",
  "InitGlobals",
  "InitCustomTriggers",
  "RunInitializationTriggers",
  "MarkGameStarted",
];

/** The Natives that take a callback the game runs later. */
const CALLBACK_NATIVES = [
  "TriggerAddAction",
  "Condition",
  "Filter",
  "TimerStart",
] as const;

/** Every global `run` puts in place for its body and puts back afterwards. */
const SWAPPED: readonly string[] = [
  ...ENTRY_POINTS,
  ...CALLBACK_NATIVES,
  LIBRARY_GLOBAL,
];

type Callable = (...args: unknown[]) => unknown;

/** One simulated game client and its copy of the library. */
export class SimulatedClient {
  /** The slot of this client's local player. */
  public readonly player: number;

  /**
   * What `os.clock` answers while this client runs, 0 until a test sets it.
   * A test sets it before running code that measures time; code the client
   * runs that sets the clock itself leaves its value here.
   */
  public clock = 0;

  /** This client's copy of the library. */
  public readonly library: LibraryCopy;

  /** The library's global of this client: undefined until its copy loads. */
  private anchor: unknown = undefined;

  private readonly entryPoints: Partial<Record<EditorFunction, unknown>> = {};

  /** @param player The slot of this client's local player. */
  public constructor(player: number) {
    this.player = player;
    for (const name of ENTRY_POINTS) {
      if (name !== "InitBlizzard") {
        this.entryPoints[name] = editorFunction(name);
      }
    }
    this.library = this.run(
      () => reloadModules("src.", "src.index") as LibraryCopy,
    );
  }

  /**
   * Runs `body` as this client and returns what it returned: its entry
   * points and library global, its local player and its clock are in place,
   * and callbacks handed to the game run as this client when fired. What
   * was in place before comes back afterwards, also when `body` throws.
   */
  public run<R>(body: () => R): R {
    const saved: Record<string, unknown> = {};
    for (const name of SWAPPED) {
      saved[name] = rawget(globals, name);
    }
    const clock = __stub_set_clock(this.clock);
    const player = __stub_set_local_player(this.player);
    rawset(globals, LIBRARY_GLOBAL, this.anchor);
    for (const name of ENTRY_POINTS) {
      rawset(globals, name, this.entryPoints[name]);
    }
    this.hookCallbackNatives(saved);
    try {
      return body();
    } finally {
      this.anchor = rawget(globals, LIBRARY_GLOBAL);
      for (const name of ENTRY_POINTS) {
        this.entryPoints[name] = rawget(globals, name);
      }
      this.clock = os.clock();
      __stub_set_clock(clock);
      __stub_set_local_player(player);
      for (const name of SWAPPED) {
        rawset(globals, name, saved[name]);
      }
    }
  }

  /**
   * Replaces each Native of `CALLBACK_NATIVES` with one that hands the
   * Native in `natives` the callback wrapped to run as this client.
   */
  private hookCallbackNatives(natives: Record<string, unknown>): void {
    const native = (name: string) => natives[name] as Callable;
    rawset(
      globals,
      "TriggerAddAction",
      (whichTrigger: unknown, action: unknown) =>
        native("TriggerAddAction")(whichTrigger, this.asClient(action)),
    );
    rawset(globals, "Condition", (func: unknown) =>
      native("Condition")(this.asClient(func)),
    );
    rawset(globals, "Filter", (func: unknown) =>
      native("Filter")(this.asClient(func)),
    );
    rawset(
      globals,
      "TimerStart",
      (
        whichTimer: unknown,
        timeout: unknown,
        periodic: unknown,
        handler: unknown,
      ) =>
        native("TimerStart")(
          whichTimer,
          timeout,
          periodic,
          this.asClient(handler),
        ),
    );
  }

  /** `callback` wrapped to run as this client; anything else as it is. */
  private asClient(callback: unknown): unknown {
    if (type(callback) !== "function") {
      return callback;
    }
    return (...args: unknown[]) =>
      this.run(() => (callback as Callable)(...args));
  }
}

/**
 * Loads `count` copies of the library in this Lua state, one per simulated
 * client, and returns the clients in order. Client `k`'s local player is the
 * player in slot `players[k]`, or in slot `k` when `players` leaves it out;
 * the stubs hold slots 0 and 1 as playing users. Load them at the top level
 * of the test file, before any test runs.
 */
export function simulateClients(
  count: number,
  players: readonly number[] = [],
): SimulatedClient[] {
  const clients: SimulatedClient[] = [];
  for (let k = 0; k < count; k++) {
    clients.push(new SimulatedClient(players[k] ?? k));
  }
  return clients;
}
