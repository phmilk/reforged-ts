/** @noSelfInFile */

// The declarations of every `__stub_*` helper the Shipped stubs define: Lua
// globals, not Natives, so the Typings do not declare them. A test's tsconfig
// picks this file up by listing `reforged-test/stubs` in `types`, next to the
// Typings it names. test/declarations.test.ts fails when a helper of the
// Lua is missing here or a name here is missing from the Lua.

/**
 * A Firing context: what each event response Native answers while a trigger
 * fires, keyed by the Native's name (`{ GetTriggerUnit: unit.handle }`). A
 * Native the context leaves out answers nil. The definition of
 * `FiringContext`, the type `reforged-test/map` exports.
 */
type StubContext = {
  readonly [
    N in keyof typeof globalThis
  ]?: (typeof globalThis)[N] extends () => infer R ? NonNullable<R> : never;
};

/**
 * A sync packet: its prefix, its data and the player it is from. What
 * `BlzSendSyncData` recorded, with the local player that sent it, or one a
 * test builds to deliver.
 */
interface StubSyncPacket {
  readonly prefix: string;
  readonly data: string;
  readonly from: player;
}

/** One message a display Native showed, as the Native was given it. */
interface StubDisplayed {
  readonly native:
    | "DisplayTextToPlayer"
    | "DisplayTimedTextToPlayer"
    | "DisplayTimedTextFromPlayer";
  readonly player: player;
  readonly x: number;
  readonly y: number;
  /** Undefined for `DisplayTextToPlayer`. */
  readonly duration?: number;
  readonly text: string;
}

/** One damage event, as `UnitDamageTarget` dispatches it. */
interface StubDamage {
  readonly source: unit;
  readonly target: widget;
  readonly amount: number;
  readonly attack?: boolean;
  readonly attackType?: attacktype;
  readonly damageType?: damagetype;
  readonly weaponType?: weapontype;
}

// The firing helpers.

/**
 * Fires the trigger as one event would, with `context` as the firing context:
 * every condition runs, in added order, then the actions, in added order, only
 * if every condition returned true. Returns whether the actions ran. A
 * disabled trigger does not fire; firing a destroyed one throws.
 */
declare function __stub_fire_trigger(
  whichTrigger: trigger,
  context?: StubContext,
): boolean;

/**
 * The Event dispatch: delivers `event` on `subject` (the player of a
 * player-unit or a player event, the unit of a unit event, the widget of a
 * death event, undefined for a game event) to every trigger registered for
 * it, in registration order and once per registration: a disabled or
 * destroyed trigger is skipped, the registration's filter is evaluated
 * (`GetTriggerUnit` of `context` as `GetFilterUnit`), then the trigger
 * fires, its conditions before its actions. The Firing context is
 * `context`, with the trigger as `GetTriggeringTrigger` and, unless
 * `context` gives one, `event` as `GetTriggerEventId`. Returns how many
 * triggers ran their actions; no registration is no error.
 */
declare function __stub_dispatch(
  event: handle,
  subject: handle | undefined,
  context?: StubContext,
): number;

/**
 * Runs the handler `TimerStart` stored for this timer, once, with the timer as
 * `GetExpiredTimer`'s answer. Throws for a timer never started or destroyed.
 */
declare function __stub_fire_timer(whichTimer: timer): void;

/** The packets `BlzSendSyncData` recorded so far, oldest first. */
declare function __stub_sync_packets(): StubSyncPacket[];

/**
 * Delivers `packet` as the game would: fires every enabled trigger registered
 * for its prefix and sender, in registration order, with the sync prefix, the
 * sync data, the sender and the trigger as the firing context. With `cString`,
 * the data is cut at its first zero byte. Returns how many triggers ran their
 * actions.
 */
declare function __stub_deliver_sync(
  packet: StubSyncPacket,
  options?: { readonly cString?: boolean },
): number;

/**
 * Dispatches a damage event as the game does inside `UnitDamageTarget` (which
 * calls it): fires every enabled trigger registered for a damaging, then a
 * damaged, event on the target (its unit, or its owner through a player-unit
 * registration whose filter accepts it), with the damage as the firing
 * context. An action that deals damage dispatches again inside its firing;
 * past 32 nested dispatches it throws. Returns how many triggers ran their
 * actions.
 */
declare function __stub_dispatch_damage(damage: StubDamage): number;

// The test controls.

/** Sets what `os.clock` answers from now on; returns what it answered before. */
declare function __stub_set_clock(seconds: number): number;

/** Makes the player in slot `slot` the local player; returns the slot local before. */
declare function __stub_set_local_player(slot: number): number;

/** The local player's handle, without a call-log line. */
declare function __stub_local_player(): player;

/** The lines `print` wrote so far, oldest first: its arguments joined by a tab. */
declare function __stub_printed(): string[];

/** The messages the display Natives showed so far, oldest first. */
declare function __stub_displayed(): StubDisplayed[];

/**
 * The strings `Preload` was given for the last `PreloadGenEnd` of `filename`,
 * in order; undefined for a file never written.
 */
declare function __stub_preload_file(filename: string): string[] | undefined;

/**
 * Enters the globals Init stage as the editor's `main` does: calls the global
 * `InitGlobals`, defining it as an empty function first when nothing did, so
 * the library's wrapper runs the stage.
 */
declare function __stub_init_globals(): void;

/**
 * The arguments of every recorded call of the Native `name`, oldest first,
 * by identity: `__stub_args("TimerStart")[0][3]` is the handler the first
 * `TimerStart` was given. `n` counts nil arguments too.
 */
declare function __stub_args(name: string): (unknown[] & { n: number })[];

/**
 * The name of the Native whose Stub is `value`: a global function a stub
 * file defined, or one `__stub_define` defined. Undefined when `value` is no
 * Stub, a Lua standard function or a function of the map included.
 */
declare function __stub_native_name(value: unknown): string | undefined;

/** The frame stub's "not found" frame, whose handle id is 0. */
declare function __stub_frame_not_found(): framehandle;

// The stub authoring helpers: the machinery the stub files build on, which a
// stub file of a test's own calls too.

/** The call log, one `Name(arg, arg)` line per recorded call, oldest first. */
declare const __stub_calls: string[];

/** Appends `Name(arg, arg)` to the stub call log, as every stub does. */
declare function __stub_record(name: string, ...args: unknown[]): void;

/**
 * Renders one value as the call log does: a handle as `kind#id`, a constant
 * by its name, a string quoted, a function as `<function>`.
 */
declare function __stub_format(value: unknown): string;

/**
 * Takes every global function the stub files defined, but the standard
 * library's and the `__stub_*` helpers, as the Stub of the Native it is named
 * after. The glue calls it after the last stub file.
 */
declare function __stub_seal(): void;

/**
 * Defines the global Native `name` as `stub`, a Stub `__stub_native_name`
 * knows. `stub` records its own calls with `__stub_record`.
 */
declare function __stub_define(
  name: string,
  stub: (...args: never[]) => unknown,
): void;

/** A new stub handle of the type `kind`, with the next handle id. */
declare function __stub_new_handle(kind: string): handle;

/**
 * A constant of the game of the type `kind`, named `name`: an opaque value a
 * test compares by identity. It takes no handle id.
 */
declare function __stub_constant(kind: string, name: string): handle;

/** Defines one global constant of the type `kind` per name, each named after itself. */
declare function __stub_constants(kind: string, names: readonly string[]): void;

/**
 * Defines the response Native `name`: it records its call and answers with
 * the firing context's value for its name, nil when the context has none.
 */
declare function __stub_response(name: string): void;

/**
 * Whether the global `name` is a Native without a Stub: the function the
 * harness defined for a Native of `common.j` no stub covers, which throws a
 * message naming `stubNative`, and which nothing replaced since.
 */
declare function __stub_unstubbed(name: string): boolean;

/**
 * Runs `body` with `firing` as the firing context and returns what it
 * returned. The previous context is put back afterwards, also when `body`
 * throws.
 */
declare function __stub_with_context<R>(firing: StubContext, body: () => R): R;

/** The player handle of the slot `slot`, the one `Player` returns, without a call-log line. */
declare function __stub_player(slot: number): player;
