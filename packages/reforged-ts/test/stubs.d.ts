/** @noSelfInFile */

// The firing helpers of the reforged-test stubs that the tests call. They are
// Lua globals the shipped stub files define, not Natives, so the Typings do
// not declare them.

/**
 * A firing context: what each event response Native answers while a trigger
 * fires, keyed by the Native's name (`{ GetTriggerUnit: unit.handle }`). A
 * Native the context leaves out answers nil.
 */
type StubContext = {
  readonly [
    N in keyof typeof globalThis
  ]?: (typeof globalThis)[N] extends () => infer R ? NonNullable<R> : never;
};

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
 * Runs the handler `TimerStart` stored for this timer, once, with the timer as
 * `GetExpiredTimer`'s answer. Throws for a timer never started or destroyed.
 */
declare function __stub_fire_timer(whichTimer: timer): void;

/** Appends `Name(arg, arg)` to the stub call log, as every stub does. */
declare function __stub_record(name: string, ...args: unknown[]): void;

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

/** Sets what `os.clock` answers from now on; returns what it answered before. */
declare function __stub_set_clock(seconds: number): number;

/** Makes the player in slot `slot` the local player; returns the slot local before. */
declare function __stub_set_local_player(slot: number): number;

/**
 * The strings `Preload` was given for the last `PreloadGenEnd` of `filename`,
 * in order; undefined for a file never written.
 */
declare function __stub_preload_file(filename: string): string[] | undefined;

/** The local player's handle, without a call-log line. */
declare function __stub_local_player(): player;

/** The lines `print` wrote so far, oldest first: its arguments joined by a tab. */
declare function __stub_printed(): string[];

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

/** The messages the display Natives showed so far, oldest first. */
declare function __stub_displayed(): StubDisplayed[];

/**
 * Enters the globals Init stage as the editor's `main` does: calls the global
 * `InitGlobals`, defining it as an empty function first when nothing did, so
 * the library's wrapper runs the stage.
 */
declare function __stub_init_globals(): void;

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

/**
 * The arguments of every recorded call of the Native `name`, oldest first,
 * by identity: `__stub_args("TimerStart")[0][3]` is the handler the first
 * `TimerStart` was given. `n` counts nil arguments too.
 */
declare function __stub_args(name: string): (unknown[] & { n: number })[];
