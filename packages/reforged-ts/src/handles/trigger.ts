/** @noSelfInFile */

import { configuration } from "../reforged/configuration";
import { damageNested } from "../reforged/damage";
import { protect } from "../reforged/protect";
import { type BoolexprInput, filterOf } from "./boolexpr";
import { Dialog, DialogButton } from "./dialog";
import { Frame } from "./frame";
import { Handle } from "./handle";
import { handleTypeOf } from "./handle-type";
import { MapPlayer } from "./player";
import { Region } from "./region";
import { forEachPlayerSlot } from "./slots";
import { Timer } from "./timer";
import { Trackable } from "./trackable";
import { Unit } from "./unit";
import { Widget } from "./widget";

/** The mouse events `Trigger.registerPlayerMouseEvent` registers. */
export const enum MouseEventKind {
  /**
   * A mouse button is pressed.
   * @native EVENT_PLAYER_MOUSE_DOWN
   */
  Down = "down",
  /**
   * A mouse button is released.
   * @native EVENT_PLAYER_MOUSE_UP
   */
  Up = "up",
  /**
   * The mouse moves.
   * @native EVENT_PLAYER_MOUSE_MOVE
   */
  Move = "move",
}

/** The player event constant of a mouse event. */
function mouseEvent(kind: MouseEventKind): playerevent {
  switch (kind) {
    case MouseEventKind.Down:
      return EVENT_PLAYER_MOUSE_DOWN;
    case MouseEventKind.Up:
      return EVENT_PLAYER_MOUSE_UP;
    case MouseEventKind.Move:
      return EVENT_PLAYER_MOUSE_MOVE;
  }
}

/** Whether `event` is a damage event: damaged or damaging, unit or player-unit. */
function isDamageEvent(event: playerunitevent | unitevent): boolean {
  return (
    event === EVENT_PLAYER_UNIT_DAMAGED ||
    event === EVENT_PLAYER_UNIT_DAMAGING ||
    event === EVENT_UNIT_DAMAGED ||
    event === EVENT_UNIT_DAMAGING
  );
}

/**
 * The triggers a damage event was registered on, by Handle: their actions
 * and conditions nest the damage depth in Dev mode. Keyed by the Handle, not
 * the Wrapper, so a callback reads it without touching a Wrapper that may be
 * a tombstone by then.
 */
const damageTriggers = new WeakSet<trigger>();

/**
 * A `Condition` the Trigger made for a function. It wraps a closure of its
 * own, in both modes, so each `addCondition` owns a distinct handle: JASS
 * caches one `boolexpr` per code, so the game may hand back the handle it
 * made for the same function before, and the Trigger would then destroy a
 * handle shared with another add or with the caller. Removed while it is
 * being evaluated, it is destroyed when that evaluation returns.
 */
class MadeCondition {
  /** The `Condition` the Trigger hands `TriggerAddCondition`. */
  public readonly expr: conditionfunc;
  /** How many evaluations of the condition are running. */
  private running = 0;
  /** Whether it was destroyed while running: the last evaluation destroys it. */
  private doomed = false;

  /** @param run - The condition as the Trigger runs it. */
  public constructor(run: () => boolean) {
    this.expr = Condition(() => this.evaluate(run));
  }

  /**
   * Runs `run`, counted, under `pcall` so that an error, with Dev mode off,
   * leaves the count right before it propagates unchanged.
   */
  private evaluate(run: () => boolean): boolean {
    this.running++;
    const [ok, result] = pcall(run);
    this.running--;
    if (this.doomed && this.running === 0) {
      this.doomed = false;
      DestroyCondition(this.expr);
    }
    if (!ok) {
      error(result, 0);
    }
    return result;
  }

  /** Destroys the `Condition`, or, while it is evaluated, when that returns. */
  public destroy(): void {
    if (this.running > 0) {
      this.doomed = true;
    } else {
      DestroyCondition(this.expr);
    }
  }
}

/** The handles one `addCondition` call produced. */
interface ConditionHandles {
  /** The handle `TriggerAddCondition` returned. */
  readonly condition: triggercondition;
  /**
   * The `Condition` the Trigger made from a function, destroyed when the
   * condition is removed; undefined for a `boolexpr` the caller passed.
   */
  readonly made: MadeCondition | undefined;
}

/**
 * The handles the `addAction` and `addCondition` calls of one Trigger
 * produced, by the value each was given, so the remove members can take
 * that value back.
 */
interface TriggerRecord {
  /** The handles `TriggerAddAction` returned, per action function. */
  readonly actions: Map<() => void, triggeraction[]>;
  /** What `addCondition` produced, per function or `boolexpr`. */
  readonly conditions: Map<BoolexprInput, ConditionHandles[]>;
}

/**
 * The record of each Trigger, by Handle like `damageTriggers`, so the Wrapper
 * a subclass's `fromHandle` puts in place of a cached one keeps it. Made on
 * the first `addAction` or `addCondition`, dropped by `destroy`.
 */
const records = new WeakMap<trigger, TriggerRecord>();

/** Whether `value` is a `triggercondition`, not a `boolexpr`, by its handle type. */
function isTriggerCondition(
  value: boolexpr | triggercondition,
): value is triggercondition {
  return handleTypeOf(value) === "triggercondition";
}

/** Destroys the `Condition` the Trigger made for a condition, if it made one. */
function destroyMade({ made }: ConditionHandles): void {
  made?.destroy();
}

/** Takes the list `map` holds for `key` out of it, handing `each` its values. */
function take<K, V>(
  map: Map<K, V[]> | undefined,
  key: K,
  each: (value: V) => void,
): void {
  const list = map?.get(key);
  if (map === undefined || list === undefined) {
    return;
  }
  map.delete(key);
  for (const value of list) {
    each(value);
  }
}

/** Empties `map`, handing `each` the values of every list it held. */
function drain<K, V>(
  map: Map<K, V[]> | undefined,
  each?: (value: V) => void,
): void {
  if (map === undefined) {
    return;
  }
  if (each !== undefined) {
    for (const [, list] of map) {
      for (const value of list) {
        each(value);
      }
    }
  }
  map.clear();
}

/** Appends `value` to the list `map` holds for `key`, making the list. */
function append<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list === undefined) {
    map.set(key, [value]);
  } else {
    list.push(value);
  }
}

/**
 * A game trigger: when one of the events registered on it fires, it
 * evaluates its conditions, and runs its actions when they all hold.
 * @remarks
 * - `on()` creates one Trigger per handler from an Event descriptor, with a
 *   typed payload. Use a Trigger directly for an event no descriptor covers,
 *   or for several events sharing one action.
 * - The `register*`, `add*` and `remove*` members return the Trigger, so
 *   calls chain. An event cannot be unregistered: disable the Trigger or
 *   destroy it.
 * - `removeAction` and `removeCondition` take the very function (or
 *   `boolexpr`) given to `addAction` or `addCondition`, as
 *   `removeEventListener` takes what `addEventListener` was given.
 * - In Dev mode every function a Trigger receives (action, condition,
 *   filter) runs under `pcall`, and a failure is reported naming the
 *   Trigger and the member that received it.
 * @example Registering an event, a condition and an action
 * {@includeCode ../../examples/harness/trigger-create.ts}
 * @native trigger
 */
export class Trigger extends Handle<trigger> {
  /**
   * Creates a Trigger with no event, condition or action.
   * @returns The new Trigger, enabled.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Trigger`, at the calling line. In Dev
   * mode also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateTrigger
   */
  public static create(): Trigger {
    return this.expect(CreateTrigger());
  }

  /**
   * Whether the Trigger responds to its events: false disables it until it
   * is set back to true. A disabled Trigger keeps its events, conditions and
   * actions.
   * @native EnableTrigger
   * @native DisableTrigger
   */
  public set enabled(flag: boolean) {
    if (flag) {
      EnableTrigger(this.handle);
    } else {
      DisableTrigger(this.handle);
    }
  }

  /**
   * Gets whether the Trigger responds to its events.
   * @returns True unless it was disabled; a new Trigger is enabled.
   * @native IsTriggerEnabled
   */
  public get enabled() {
    return IsTriggerEnabled(this.handle);
  }

  /**
   * Gets how many times the Trigger's conditions were evaluated since it
   * was created or last `reset`.
   * @returns The number of evaluations, 0 or more.
   * @native GetTriggerEvalCount
   */
  public get evalCount() {
    return GetTriggerEvalCount(this.handle);
  }

  /**
   * Gets the event that fired the running Trigger.
   * @returns The event's id, to compare with the `EVENT_*` constant it was
   * registered with; meaningful only inside a Trigger's condition or action.
   * @native GetTriggerEventId
   */
  public static get eventId() {
    return GetTriggerEventId();
  }

  /**
   * Gets how many times the Trigger's actions ran since it was created or
   * last `reset`.
   * @returns The number of runs, 0 or more: a firing whose conditions fail
   * counts in `evalCount`, not here.
   * @native GetTriggerExecCount
   */
  public get execCount() {
    return GetTriggerExecCount(this.handle);
  }

  /**
   * Gets whether the Trigger is running.
   * @remarks
   * The Native, added in 3.0.0, comes with no documentation from the Patch
   * beyond its name.
   * @returns True while the game reports the Trigger as running.
   * @native BlzTriggerIsRunning
   */
  public get isRunning(): boolean {
    return BlzTriggerIsRunning(this.handle);
  }

  /**
   * Whether an `execWait` made by the Trigger's actions also waits for the
   * `TriggerSleepAction` waits of the Trigger it runs. It is a mark on the
   * Trigger read when a run starts: runs already going keep the value they
   * started with.
   * @native TriggerWaitOnSleeps
   */
  public set waitOnSleeps(flag: boolean) {
    TriggerWaitOnSleeps(this.handle, flag);
  }

  /**
   * Gets whether an `execWait` made by the Trigger's actions waits for the
   * sleeps of the Trigger it runs.
   * @returns The value `waitOnSleeps` was last set to.
   * @native IsTriggerWaitOnSleeps
   */
  public get waitOnSleeps() {
    return IsTriggerWaitOnSleeps(this.handle);
  }

  /**
   * Adds a function the Trigger runs each time it fires and its conditions
   * hold, after the actions added before it.
   * @remarks
   * - In Dev mode the action runs under `pcall`: one that throws is
   *   reported as `Trigger#<id> Trigger.addAction` and the trigger's next
   *   action still runs. On a Trigger carrying a damage event it also runs
   *   one level deeper in the damage depth `Unit.damageTarget` checks, the
   *   registration made before or after. With Dev mode off `TriggerAddAction`
   *   receives `actionFunc` itself.
   * - The Trigger keeps the `triggeraction` the Native returns under
   *   `actionFunc`: `removeAction(actionFunc)` removes this action. Adding
   *   the same function twice adds two actions, both removed together.
   * - When `TriggerAddAction` returns nothing, the Trigger keeps nothing and
   *   the call still returns the Trigger. On a destroyed trigger the game
   *   returns a placeholder `triggeraction` of id 0 instead, which the
   *   Trigger keeps.
   * @param actionFunc - The action; it reads the event through the lookups,
   * such as `Unit.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerAddAction
   */
  public addAction(actionFunc: () => void) {
    const action = TriggerAddAction(
      this.handle,
      this.damageNesting(protect(this, "Trigger.addAction", actionFunc)),
    );
    if (action !== undefined) append(this.record().actions, actionFunc, action);
    return this;
  }

  /**
   * Adds a condition the Trigger evaluates when it fires: its actions run
   * only when every condition returns true. A condition is a `boolexpr`, or
   * a function the Trigger wraps with `Condition`.
   * @remarks
   * - Every condition is evaluated, in the order added, without
   *   short-circuiting: join them with `And` or `Or` for that.
   * - In Dev mode a function condition runs under `pcall`: one that throws
   *   is reported as `Trigger#<id> Trigger.addCondition` and evaluates
   *   false, as the game evaluates a crashed condition. The same holds for
   *   the function filters of the `register*` members, reported under the
   *   member. On a Trigger carrying a damage event a function condition also
   *   runs one level deeper in the damage depth `Unit.damageTarget` checks.
   * - In both modes `Condition` receives a closure the Trigger makes around
   *   a function condition, so every add owns its own `Condition`: the game
   *   may return one `boolexpr` for the same function, and the Trigger never
   *   destroys one it shares with another add or with a `Condition(fn)` of
   *   yours.
   * - The Trigger keeps the `triggercondition` the Native returns under
   *   `condition`: `removeCondition(condition)` removes this condition, and
   *   destroys the `Condition` made for a function. Adding the same value
   *   twice adds two conditions, both removed together.
   * @example
   * {@includeCode ../../examples/harness/trigger-add-condition.ts}
   * @param condition - The condition which must evaluate to true in order to run the trigger's actions.
   * @returns The Trigger, for chaining.
   * @native TriggerAddCondition
   * @native Condition
   * @native DestroyCondition
   */
  public addCondition(condition: BoolexprInput) {
    let made: MadeCondition | undefined;
    let expr: boolexpr;
    if (typeof condition === "function") {
      made = new MadeCondition(
        // The damage nesting goes outside the protection, so what it wraps
        // never throws in Dev mode.
        this.damageNesting(
          protect(this, "Trigger.addCondition", condition, false),
        ),
      );
      expr = made.expr;
    } else {
      expr = condition;
    }
    const handle = TriggerAddCondition(this.handle, expr);
    if (handle !== undefined) {
      append(this.record().conditions, condition, { condition: handle, made });
    } else {
      // A failed add keeps nothing, not even the Condition made for it.
      made?.destroy();
    }
    return this;
  }

  /** The record of the handles this Trigger's add members produced, made on first use. */
  private record(): TriggerRecord {
    let record = records.get(this.handle);
    if (record === undefined) {
      record = { actions: new Map(), conditions: new Map() };
      records.set(this.handle, record);
    }
    return record;
  }

  /**
   * Marks the Trigger as carrying a damage event when `event` is one, at
   * registration, in both modes.
   */
  private noteEvent(event: playerunitevent | unitevent): void {
    if (isDamageEvent(event)) {
      damageTriggers.add(this.handle);
    }
  }

  /**
   * What the action or condition wrappers hand the Native for the protected
   * `callback`: with Dev mode off, `callback` itself; in Dev mode, a
   * function that runs it one level deeper in the damage depth whenever the
   * Trigger carries a damage event. The mark is read at each run, so an
   * action added before the damage registration is counted too.
   */
  private damageNesting<R>(callback: () => R): () => R {
    if (!configuration.devMode) {
      return callback;
    }
    const handle = this.handle;
    return () =>
      damageTriggers.has(handle) ? damageNested(callback) : callback();
  }

  /**
   * Destroys the Trigger through its Native.
   * @remarks
   * - The `Condition`s the Trigger made for the functions `addCondition`
   *   received are destroyed with it, and it forgets what its add members
   *   added. A `boolexpr` the caller passed is left alone.
   * - In Dev mode the destroyed Wrapper becomes a tombstone: any later
   *   access, a second `destroy()` included, raises
   *   `reforged-ts: used after destroy: <Class>#<id>`, and
   *   `Reforged.debug.report()` counts it destroyed.
   * @example The handles a feature owns, destroyed when it ends
   * {@includeCode ../../examples/game/destroy-owned.ts}
   * @native DestroyTrigger
   * @native DestroyCondition
   * @bug Destroying the Trigger that is running, while waits are involved,
   * can corrupt the handle stack:
   * http://www.wc3c.net/showthread.php?t=110519.
   */
  public destroy() {
    DestroyTrigger(this.handle);
    drain(records.get(this.handle)?.conditions, destroyMade);
    records.delete(this.handle);
    this.release();
  }

  /**
   * Evaluates the Trigger's conditions now, without running its actions.
   * @remarks
   * - The result is the logical and of what every condition returns.
   * - A condition that returns `0`, `0.0` or `null` counts as false, while
   *   one returning `""` counts as true: a condition returning a string
   *   gives `null` for false.
   * - A condition that crashes its thread, or returns nothing, makes `eval`
   *   return false.
   * - Every condition runs, in the order `addCondition` added them, even
   *   after one returned false; to stop at the first false, combine them
   *   into one with `And` or `Or`.
   * @returns True when every condition holds, or when the Trigger has none.
   * @native TriggerEvaluate
   */
  public eval() {
    return TriggerEvaluate(this.handle);
  }

  /**
   * Runs the Trigger's actions now, in a new thread, without evaluating its
   * conditions.
   * @remarks
   * The call returns when the actions finish, or as soon as one of them
   * sleeps with `TriggerSleepAction`: `execWait` can wait for the sleeps.
   * @native TriggerExecute
   */
  public exec() {
    TriggerExecute(this.handle);
  }

  /**
   * Runs the Trigger's actions as `exec` does and, when the running Trigger
   * has `waitOnSleeps` set, waits for them to finish their
   * `TriggerSleepAction` waits too.
   * @remarks
   * After a sleep in the actions, the call returns with a short delay.
   * @native TriggerExecuteWait
   */
  public execWait() {
    TriggerExecuteWait(this.handle);
  }

  /**
   * Interrupts the Trigger.
   * @remarks
   * The Native, added in 3.0.0, comes with no documentation from the Patch
   * beyond its name.
   * @native BlzTriggerInterrupt
   */
  public interrupt() {
    BlzTriggerInterrupt(this.handle);
  }

  /**
   * Registers a player-unit event for the units of every player slot, with
   * no filter.
   * @remarks
   * The players are read when it is called. A damage event marks the Trigger
   * for the Dev-mode damage depth (see `addAction`).
   * @param whichPlayerUnitEvent - The event, such as
   * `EVENT_PLAYER_UNIT_DEATH`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerUnitEvent
   */
  public registerAnyUnitEvent(whichPlayerUnitEvent: playerunitevent) {
    this.noteEvent(whichPlayerUnitEvent);
    forEachPlayerSlot((whichPlayer) => {
      TriggerRegisterPlayerUnitEvent(
        this.handle,
        whichPlayer.handle,
        whichPlayerUnitEvent,
      );
    });
    return this;
  }

  /**
   * Registers a click on the command button of an ability, identified by
   * the ability and its order string.
   * @param whichAbility - The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.
   * @param order - The order string of the button, such as `"blizzard"`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterCommandEvent
   */
  public registerCommandEvent(whichAbility: Rawcode<"ability">, order: string) {
    TriggerRegisterCommandEvent(this.handle, whichAbility, order);
    return this;
  }

  /**
   * Registers the death of a widget: a unit, an item or a destructable.
   * @param whichWidget - The widget whose death fires the Trigger; read it
   * back with `Widget.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterDeathEvent
   */
  public registerDeathEvent(whichWidget: Widget) {
    TriggerRegisterDeathEvent(this.handle, whichWidget.handle);
    return this;
  }

  /**
   * Registers a click on one dialog button.
   * @param whichButton - The button; read it back with
   * `DialogButton.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterDialogButtonEvent
   */
  public registerDialogButtonEvent(whichButton: DialogButton) {
    TriggerRegisterDialogButtonEvent(this.handle, whichButton.handle);
    return this;
  }

  /**
   * Registers a click on any button of a dialog.
   * @param whichDialog - The dialog; read the clicked button with
   * `DialogButton.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterDialogEvent
   */
  public registerDialogEvent(whichDialog: Dialog) {
    TriggerRegisterDialogEvent(this.handle, whichDialog.handle);
    return this;
  }

  /**
   * Registers a unit entering a region, for the units the filter accepts.
   * @remarks
   * In Dev mode a function filter runs under `pcall`: one that throws is
   * reported as `Trigger#<id> Trigger.registerEnterRegion` and rejects the
   * unit.
   * @param whichRegion - The region; read the entering unit with
   * `Unit.fromEntering()`.
   * @param filter - A `boolexpr`, or a function returning whether the unit
   * counts, read with `Unit.fromFilter()`; every unit when left out.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterEnterRegion
   */
  public registerEnterRegion(
    whichRegion: Region,
    filter?: boolexpr | (() => boolean),
  ) {
    TriggerRegisterEnterRegion(
      this.handle,
      whichRegion.handle,
      filterOf(this, "Trigger.registerEnterRegion", filter),
    );
    return this;
  }

  /**
   * Registers a unit event on one unit, when the filter accepts it.
   * @remarks
   * A damage event marks the Trigger for the Dev-mode damage depth (see
   * `addAction`). In Dev mode a function filter runs under `pcall`: one that
   * throws is reported as `Trigger#<id> Trigger.registerFilterUnitEvent` and
   * evaluates false.
   * @param whichUnit - The unit the event is registered on.
   * @param whichEvent - The event, such as `EVENT_UNIT_DAMAGED`.
   * @param filter - A `boolexpr`, or a function returning whether the event
   * counts; every event when left out.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterFilterUnitEvent
   */
  public registerFilterUnitEvent(
    whichUnit: Unit,
    whichEvent: unitevent,
    filter?: boolexpr | (() => boolean),
  ) {
    this.noteEvent(whichEvent);
    TriggerRegisterFilterUnitEvent(
      this.handle,
      whichUnit.handle,
      whichEvent,
      filterOf(this, "Trigger.registerFilterUnitEvent", filter),
    );
    return this;
  }

  /**
   * Registers the frame event `event` of `frame`.
   * @param frame - The Frame; read it back with `Frame.fromEvent()`.
   * @param event - The frame event type, such as `FRAMEEVENT_CONTROL_CLICK`.
   * @returns The Trigger, for chaining.
   * @native BlzTriggerRegisterFrameEvent
   */
  public registerFrameEvent(frame: Frame, event: frameeventtype) {
    BlzTriggerRegisterFrameEvent(this.handle, frame.handle, event);
    return this;
  }

  /**
   * Registers a game event.
   * @param whichGameEvent - The event, such as `EVENT_GAME_BUILD_SUBMENU`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterGameEvent
   */
  public registerGameEvent(whichGameEvent: gameevent) {
    TriggerRegisterGameEvent(this.handle, whichGameEvent);
    return this;
  }

  /**
   * Registers a game state reaching a limit.
   * @param whichState - The state, such as `GAME_STATE_TIME_OF_DAY`.
   * @param opcode - How the state compares with the limit, such as
   * `GREATER_THAN_OR_EQUAL`.
   * @param limitval - The value the state is compared with, in the state's
   * own unit: hours for the time of day, such as 6 for dawn.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterGameStateEvent
   */
  public registerGameStateEvent(
    whichState: gamestate,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterGameStateEvent(this.handle, whichState, opcode, limitval);
    return this;
  }

  /**
   * Registers a unit leaving a region, for the units the filter accepts.
   * @remarks
   * In Dev mode a function filter runs under `pcall`: one that throws is
   * reported as `Trigger#<id> Trigger.registerLeaveRegion` and rejects the
   * unit.
   * @param whichRegion - The region; read the leaving unit with
   * `Unit.fromLeaving()`.
   * @param filter - A `boolexpr`, or a function returning whether the unit
   * counts, read with `Unit.fromFilter()`; every unit when left out.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterLeaveRegion
   */
  public registerLeaveRegion(
    whichRegion: Region,
    filter?: boolexpr | (() => boolean),
  ) {
    TriggerRegisterLeaveRegion(
      this.handle,
      whichRegion.handle,
      filterOf(this, "Trigger.registerLeaveRegion", filter),
    );
    return this;
  }

  /**
   * Registers a player changing one of its alliance settings toward another
   * player.
   * @param whichPlayer - The player whose setting changes.
   * @param whichAlliance - The setting, such as `ALLIANCE_SHARED_VISION`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerAllianceChange
   */
  public registerPlayerAllianceChange(
    whichPlayer: MapPlayer,
    whichAlliance: alliancetype,
  ) {
    TriggerRegisterPlayerAllianceChange(
      this.handle,
      whichPlayer.handle,
      whichAlliance,
    );
    return this;
  }

  /**
   * Registers a chat message of a player that contains a text, or equals it.
   * @param whichPlayer - The player whose messages are watched.
   * @param chatMessageToDetect - The text to detect; `""` detects every
   * message.
   * @param exactMatchOnly - True to fire only when the message equals the
   * text, false when it contains it.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerChatEvent
   */
  public registerPlayerChatEvent(
    whichPlayer: MapPlayer,
    chatMessageToDetect: string,
    exactMatchOnly: boolean,
  ) {
    TriggerRegisterPlayerChatEvent(
      this.handle,
      whichPlayer.handle,
      chatMessageToDetect,
      exactMatchOnly,
    );
    return this;
  }

  /**
   * Registers a player event of one player.
   * @param whichPlayer - The player; read it back with
   * `MapPlayer.fromEvent()`.
   * @param whichPlayerEvent - The event, such as `EVENT_PLAYER_LEAVE`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerEvent
   */
  public registerPlayerEvent(
    whichPlayer: MapPlayer,
    whichPlayerEvent: playerevent,
  ) {
    TriggerRegisterPlayerEvent(
      this.handle,
      whichPlayer.handle,
      whichPlayerEvent,
    );
    return this;
  }

  /**
   * Registers a player pressing or releasing a key while holding modifier
   * keys. The game syncs key events between players.
   * @param whichPlayer - The player at the keyboard.
   * @param whichKey - The key, such as `OSKEY_ESCAPE`.
   * @param metaKey - The modifier keys that must be held, as a bit set: 0
   * none, 1 Shift, 2 Ctrl, 4 Alt, 8 the Windows key; add them to combine.
   * @param fireOnKeyDown - True to fire when the key goes down, repeatedly
   * while it is held; false to fire once when it is released.
   * @returns The Trigger, for chaining.
   * @native BlzTriggerRegisterPlayerKeyEvent
   */
  public registerPlayerKeyEvent(
    whichPlayer: MapPlayer,
    whichKey: oskeytype,
    metaKey: number,
    fireOnKeyDown: boolean,
  ) {
    BlzTriggerRegisterPlayerKeyEvent(
      this.handle,
      whichPlayer.handle,
      whichKey,
      metaKey,
      fireOnKeyDown,
    );
    return this;
  }

  /**
   * Registers the player event of the mouse event `kind` for the player.
   * @param whichPlayer - The player at the mouse.
   * @param kind - The mouse event: a button pressed, released, or the mouse
   * moving.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerEvent
   */
  public registerPlayerMouseEvent(
    whichPlayer: MapPlayer,
    kind: MouseEventKind,
  ) {
    TriggerRegisterPlayerEvent(
      this.handle,
      whichPlayer.handle,
      mouseEvent(kind),
    );
    return this;
  }

  /**
   * Registers a player state of one player reaching a limit.
   * @param whichPlayer - The player whose state is watched.
   * @param whichState - The state, such as `PLAYER_STATE_RESOURCE_GOLD`.
   * @param opcode - How the state compares with the limit, such as
   * `GREATER_THAN_OR_EQUAL`.
   * @param limitval - The value the state is compared with, in the state's
   * own unit, such as an amount of gold.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerStateEvent
   */
  public registerPlayerStateEvent(
    whichPlayer: MapPlayer,
    whichState: playerstate,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterPlayerStateEvent(
      this.handle,
      whichPlayer.handle,
      whichState,
      opcode,
      limitval,
    );
    return this;
  }

  /**
   * Registers the arrival, at every player, of the data a player sent with
   * `BlzSendSyncData` under a prefix.
   * @param whichPlayer - The player who sends the data.
   * @param prefix - The prefix the sender passes to `BlzSendSyncData`; data
   * sent under another prefix does not fire the Trigger.
   * @param fromServer - Pass false: the data comes from `whichPlayer`.
   * @returns The Trigger, for chaining.
   * @native BlzTriggerRegisterPlayerSyncEvent
   */
  public registerPlayerSyncEvent(
    whichPlayer: MapPlayer,
    prefix: string,
    fromServer: boolean,
  ) {
    BlzTriggerRegisterPlayerSyncEvent(
      this.handle,
      whichPlayer.handle,
      prefix,
      fromServer,
    );
    return this;
  }

  /**
   * Registers a player-unit event for the units of one player, for the
   * units the filter accepts.
   * @remarks
   * A damage event marks the Trigger for the Dev-mode damage depth (see
   * `addAction`). In Dev mode a function filter runs under `pcall`: one that
   * throws is reported as `Trigger#<id> Trigger.registerPlayerUnitEvent`
   * and rejects the unit.
   * @param whichPlayer - The player whose units are watched.
   * @param whichPlayerUnitEvent - The event, such as
   * `EVENT_PLAYER_UNIT_DEATH`.
   * @param filter - A `boolexpr`, or a function returning whether the unit
   * counts, read with `Unit.fromFilter()`; every unit when left out.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterPlayerUnitEvent
   */
  public registerPlayerUnitEvent(
    whichPlayer: MapPlayer,
    whichPlayerUnitEvent: playerunitevent,
    filter?: boolexpr | (() => boolean),
  ) {
    this.noteEvent(whichPlayerUnitEvent);
    TriggerRegisterPlayerUnitEvent(
      this.handle,
      whichPlayer.handle,
      whichPlayerUnitEvent,
      filterOf(this, "Trigger.registerPlayerUnitEvent", filter),
    );
    return this;
  }

  /**
   * Registers a timeout: the game runs a timer of its own for the Trigger,
   * firing it once or periodically.
   * @remarks
   * Since Patch 1.32 a periodic registration fires at most about 100 times a
   * second, whatever its timeout; a Timer has no such limit.
   * @param timeout - The time before the Trigger fires, in seconds.
   * @param periodic - True to fire every `timeout` seconds, false to fire
   * once.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterTimerEvent
   */
  public registerTimerEvent(timeout: number, periodic: boolean) {
    TriggerRegisterTimerEvent(this.handle, timeout, periodic);
    return this;
  }

  /**
   * Registers the expiry of `timer`.
   * @param timer - The Timer; read it back with `Timer.fromExpired()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterTimerExpireEvent
   */
  public registerTimerExpire(timer: Timer) {
    TriggerRegisterTimerExpireEvent(this.handle, timer.handle);
    return this;
  }

  /**
   * Registers a click on `trackable`.
   * @param trackable - The Trackable; read it back with
   * `Trackable.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterTrackableHitEvent
   */
  public registerTrackableHit(trackable: Trackable) {
    TriggerRegisterTrackableHitEvent(this.handle, trackable.handle);
    return this;
  }

  /**
   * Registers the mouse moving over `trackable`.
   * @param trackable - The Trackable; read it back with
   * `Trackable.fromEvent()`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterTrackableTrackEvent
   */
  public registerTrackableTrack(trackable: Trackable) {
    TriggerRegisterTrackableTrackEvent(this.handle, trackable.handle);
    return this;
  }

  /**
   * Registers a unit event on one unit.
   * @remarks
   * A damage event marks the Trigger for the Dev-mode damage depth (see
   * `addAction`).
   * @param whichUnit - The unit the event is registered on.
   * @param whichEvent - The event, such as `EVENT_UNIT_DEATH`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterUnitEvent
   */
  public registerUnitEvent(whichUnit: Unit, whichEvent: unitevent) {
    this.noteEvent(whichEvent);
    TriggerRegisterUnitEvent(this.handle, whichUnit.handle, whichEvent);
    return this;
  }

  /**
   * Registers a unit coming within a distance of another unit, for the
   * units the filter accepts.
   * @remarks
   * In Dev mode a function filter runs under `pcall`: one that throws is
   * reported as `Trigger#<id> Trigger.registerUnitInRange` and rejects the
   * unit.
   * @param whichUnit - The unit others approach.
   * @param range - The distance, in world units.
   * @param filter - A `boolexpr`, or a function returning whether the
   * approaching unit counts, read with `Unit.fromFilter()`; every unit when
   * left out.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterUnitInRange
   */
  public registerUnitInRange(
    whichUnit: Unit,
    range: number,
    filter?: boolexpr | (() => boolean),
  ) {
    TriggerRegisterUnitInRange(
      this.handle,
      whichUnit.handle,
      range,
      filterOf(this, "Trigger.registerUnitInRange", filter),
    );
    return this;
  }

  /**
   * Registers a unit state of one unit reaching a limit.
   * @param whichUnit - The unit whose state is watched.
   * @param whichState - The state, such as `UNIT_STATE_LIFE`.
   * @param opcode - How the state compares with the limit, such as
   * `LESS_THAN`.
   * @param limitval - The value the state is compared with, in the state's
   * own unit, such as hit points for `UNIT_STATE_LIFE`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterUnitStateEvent
   */
  public registerUnitStateEvent(
    whichUnit: Unit,
    whichState: unitstate,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterUnitStateEvent(
      this.handle,
      whichUnit.handle,
      whichState,
      opcode,
      limitval,
    );
    return this;
  }

  /**
   * Registers a click on the command button of an upgrade.
   * @param whichUpgrade - The upgrade's rawcode, such as Iron Forged Swords',
   * `FourCC("Rhme")`.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterUpgradeCommandEvent
   */
  public registerUpgradeCommandEvent(whichUpgrade: Rawcode<"upgrade">) {
    TriggerRegisterUpgradeCommandEvent(this.handle, whichUpgrade);
    return this;
  }

  /**
   * Registers a global real variable, named as the map script names it,
   * reaching a limit.
   * @param varName - The variable's name, such as `"udg_Score"`.
   * @param opcode - How the variable compares with the limit, such as
   * `EQUAL`.
   * @param limitval - The value the variable is compared with.
   * @returns The Trigger, for chaining.
   * @native TriggerRegisterVariableEvent
   */
  public registerVariableEvent(
    varName: string,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterVariableEvent(this.handle, varName, opcode, limitval);
    return this;
  }

  /**
   * Removes from the Trigger the actions `addAction(action)` added to it.
   * @remarks
   * - The same function added more than once is removed every time it was
   *   added.
   * - A function never added to this Trigger, or already removed, changes
   *   nothing.
   * - Called from inside the action it removes, the action finishes its run
   *   and does not run at the next firing.
   * - A `triggeraction` that `TriggerAddAction` returned when called directly
   *   goes to the Native as is.
   * @example Removing an action by the function added
   * {@includeCode ../../examples/harness/trigger-remove-action.ts}
   * @param action - The function given to `addAction`, or a `triggeraction`
   * `TriggerAddAction` returned.
   * @returns The Trigger, for chaining.
   * @native TriggerRemoveAction
   */
  public removeAction(action: (() => void) | triggeraction) {
    if (typeof action !== "function") {
      TriggerRemoveAction(this.handle, action);
      return this;
    }
    take(records.get(this.handle)?.actions, action, (handle) => {
      TriggerRemoveAction(this.handle, handle);
    });
    return this;
  }

  /**
   * Removes every action of the Trigger; its events and conditions stay.
   * @remarks
   * A later `removeAction` of a function added before changes nothing.
   * @returns The Trigger, for chaining.
   * @native TriggerClearActions
   */
  public removeActions() {
    TriggerClearActions(this.handle);
    drain(records.get(this.handle)?.actions);
    return this;
  }

  /**
   * Removes from the Trigger the conditions `addCondition(condition)` added
   * to it.
   * @remarks
   * - The `Condition` the Trigger made for a function is destroyed with it.
   *   A `boolexpr` the caller passed is never destroyed: the caller owns it.
   * - Called from inside the condition it removes, the condition is removed
   *   at once and its `Condition` is destroyed when that evaluation returns,
   *   never while it runs. `removeConditions` and `destroy` do the same.
   * - The same value added more than once is removed every time it was
   *   added.
   * - A value never added to this Trigger, or already removed, changes
   *   nothing.
   * - A `triggercondition` that `TriggerAddCondition` returned when called
   *   directly goes to the Native as is, told from a `boolexpr` by its handle
   *   type.
   * @param condition - The function or `boolexpr` given to `addCondition`,
   * or a `triggercondition` `TriggerAddCondition` returned.
   * @returns The Trigger, for chaining.
   * @native TriggerRemoveCondition
   * @native DestroyCondition
   */
  public removeCondition(condition: BoolexprInput | triggercondition) {
    if (typeof condition !== "function" && isTriggerCondition(condition)) {
      TriggerRemoveCondition(this.handle, condition);
      return this;
    }
    take(records.get(this.handle)?.conditions, condition, (handles) => {
      TriggerRemoveCondition(this.handle, handles.condition);
      destroyMade(handles);
    });
    return this;
  }

  /**
   * Removes every condition of the Trigger, so its actions run each time it
   * fires; its events and actions stay.
   * @remarks
   * The `Condition`s the Trigger made for the functions `addCondition`
   * received are destroyed, and a later `removeCondition` of a value added
   * before changes nothing. A `boolexpr` the caller passed is left alone.
   * @returns The Trigger, for chaining.
   * @native TriggerClearConditions
   * @native DestroyCondition
   */
  public removeConditions() {
    TriggerClearConditions(this.handle);
    drain(records.get(this.handle)?.conditions, destroyMade);
    return this;
  }

  /**
   * Resets `evalCount` and `execCount` to zero.
   * @native ResetTrigger
   */
  public reset() {
    ResetTrigger(this.handle);
  }

  /**
   * Gets the Trigger whose condition or action is running.
   * @returns The running Trigger, or `undefined` outside a Trigger's
   * condition or action.
   * @native GetTriggeringTrigger
   */
  public static fromEvent(): Trigger | undefined {
    return this.fromHandle(GetTriggeringTrigger());
  }
}
