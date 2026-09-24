/** @noSelfInFile */

// The state of the Init stages, shared by every load of the library in one
// Lua state.
//
// The community reports the Lua root executing twice in one game (lobby and
// start). A second execution of the root runs every module again, with fresh
// locals: a marker kept in a module local would be invisible to it, and it
// would wrap Blizzard's functions a second time around the first wrappers.
// So the state that wrapping must see again lives in one table anchored on a
// global the library owns, `_G["reforged-ts"].init`: the wrappers installed
// (the marker), the names still pending, the hook on `_G` that captures
// them, the queues and what ran. A second load finds it, adopts it, and its
// registrations join the same queues. The anchor takes one entry per module
// family (`anchored`): the `reforged` module keeps the dev-mode flag on it
// the same way.
//
// Package-internal: nothing here is exported from the library index.

/** One of the four Init stages, named after the Blizzard function it wraps. */
export type InitStage = "globals" | "triggers" | "initTriggers" | "gameStart";

/**
 * A callback registered for a stage or an entry point, and the name a
 * failure line prints for it: the label it was registered with, or `#n` for
 * its ordinal in its queue.
 * @noSelf
 */
export interface Registration {
  readonly callback: () => void;
  readonly name: string;
}

/** Who registered a callback: the library's own modules, or the Map project. */
export type Origin = "library" | "project";

/**
 * What a wrapper runs around the original: before it, after it, or both.
 * @noSelf
 */
export interface Around {
  readonly before?: () => void;
  readonly after?: () => void;
}

/** A global that was nil when the library asked to wrap it. */
export interface PendingGlobal {
  readonly name: string;
  readonly around: Around;
}

/** The globals table as a metatable of `_G` receives it: any key, any value. */
export type Globals = Record<string, unknown>;

/**
 * A metatable of `_G`, the two fields the interception composes with. Lua
 * calls either with the table first, or indexes it when it is a table.
 * @noSelf
 */
export interface GlobalsMetatable {
  __index?: ((table: Globals, key: string) => unknown) | object;
  __newindex?: ((table: Globals, key: string, value: unknown) => void) | object;
}

/** The hook on `_G` while names are pending, and what it replaced. */
export interface Interception {
  /** The hook: `_G`'s metatable until every pending name was captured. */
  readonly hook: GlobalsMetatable;
  /** The metatable `_G` had before the hook, or undefined when it had none. */
  readonly previous: GlobalsMetatable | undefined;
}

/** One stage: its two queues and whether its run started. */
export interface StageState {
  /** True from the moment the stage's run started. */
  started: boolean;
  /** The library's own callbacks, run first. */
  readonly library: Registration[];
  /** The Map project's callbacks, run after the library's. */
  readonly project: Registration[];
}

/** The state shared by every load of the library in one Lua state. */
export interface InitState {
  /** The wrappers installed so far: the marker a wrapped function carries. */
  readonly wrappers: LuaSet<() => void>;
  /** The names that were nil at load, in the order they were asked for. */
  readonly pending: PendingGlobal[];
  /** The hook on `_G` while a name is pending; undefined when it is off. */
  interception: Interception | undefined;
  readonly stages: Record<InitStage, StageState>;
  /** The stage running now, or none. */
  current: InitStage | undefined;
  /** Whether the Map project registered a callback yet. */
  projectRegistered: boolean;
}

/** The library's name, first on every line it prints. */
export const LIBRARY = "reforged-ts";

/** The globals table, typed for raw reads and writes by name. */
export const globals = _G as unknown as Record<string, unknown>;

/** What the library keeps under its global: one entry per module family. */
type Anchor = Record<string, unknown>;

/**
 * The value an earlier load anchored under `key` on the library's global, or
 * the one `create` makes, anchored now. Raw reads and writes, so a `_G`
 * metatable a map installed (an undeclared-global warner) never sees the
 * library's own global.
 */
export function anchored<T extends object>(key: string, create: () => T): T {
  let anchor = rawget(globals, LIBRARY) as Anchor | undefined;
  if (anchor === undefined) {
    anchor = {};
    rawset(globals, LIBRARY, anchor);
  }
  let value = anchor[key] as T | undefined;
  if (value === undefined) {
    value = create();
    anchor[key] = value;
  }
  return value;
}

function stage(): StageState {
  return { started: false, library: [], project: [] };
}

function create(): InitState {
  return {
    wrappers: new LuaSet<() => void>(),
    pending: [],
    interception: undefined,
    stages: {
      globals: stage(),
      triggers: stage(),
      initTriggers: stage(),
      gameStart: stage(),
    },
    current: undefined,
    projectRegistered: false,
  };
}

/** The shared state: the one an earlier load anchored, or a new one. */
export const state: InitState = anchored("init", create);
