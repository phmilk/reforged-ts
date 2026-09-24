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
// (the marker), the names still pending, the queues and what ran. A second
// load finds it, adopts it, and its registrations join the same queues.
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

/** What the library keeps under its global. */
interface Anchor {
  init?: InitState;
}

function stage(): StageState {
  return { started: false, library: [], project: [] };
}

function create(): InitState {
  return {
    wrappers: new LuaSet<() => void>(),
    pending: [],
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

/**
 * The shared state: the one an earlier load anchored, or a new one. Raw
 * reads and writes, so a `_G` metatable a map installed (an undeclared-global
 * warner) never sees the library's own global.
 */
function adopt(): InitState {
  let anchor = rawget(globals, LIBRARY) as Anchor | undefined;
  if (anchor === undefined) {
    anchor = {};
    rawset(globals, LIBRARY, anchor);
  }
  anchor.init ??= create();
  return anchor.init;
}

export const state: InitState = adopt();
