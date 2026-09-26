/** @noSelfInFile */

import { configuration } from "../reforged/configuration";
import { damageNested } from "../reforged/damage";
import { protect } from "../reforged/protect";
import { filterOf } from "./boolexpr";
import { Dialog, DialogButton } from "./dialog";
import { Frame } from "./frame";
import { Handle } from "./handle";
import { MapPlayer } from "./player";
import { Region } from "./region";
import { forEachPlayerSlot } from "./slots";
import { Timer } from "./timer";
import { Trackable } from "./trackable";
import { Unit } from "./unit";
import { Widget } from "./widget";

/** The mouse events `Trigger.registerPlayerMouseEvent` registers. */
export const enum MouseEventKind {
  /** A mouse button is pressed. */
  Down = "down",
  /** A mouse button is released. */
  Up = "up",
  /** The mouse moves. */
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

export class Trigger extends Handle<trigger> {
  public static create(): Trigger {
    return this.expect(CreateTrigger());
  }

  public set enabled(flag: boolean) {
    if (flag) {
      EnableTrigger(this.handle);
    } else {
      DisableTrigger(this.handle);
    }
  }

  public get enabled() {
    return IsTriggerEnabled(this.handle);
  }

  public get evalCount() {
    return GetTriggerEvalCount(this.handle);
  }

  public static get eventId() {
    return GetTriggerEventId();
  }

  public get execCount() {
    return GetTriggerExecCount(this.handle);
  }

  /** Whether the Trigger is running, through `BlzTriggerIsRunning` (3.0.0). */
  public get isRunning(): boolean {
    return BlzTriggerIsRunning(this.handle);
  }

  /**
   * Marks the given trigger to wait/no longer wait for `TriggerSleepAction`s in sub trigger executions started via `TriggerExecuteWait`.
   * Since this is an attribute of the execution rather than the trigger object, this affects future runs of the given trigger, and not
   * those already started.
   */
  public set waitOnSleeps(flag: boolean) {
    TriggerWaitOnSleeps(this.handle, flag);
  }

  public get waitOnSleeps() {
    return IsTriggerWaitOnSleeps(this.handle);
  }

  /**
   * Adds an action to the trigger.
   * @remarks In Dev mode the action runs under `pcall`: one that throws is
   * reported as `Trigger#<id> Trigger.addAction` and the trigger's next
   * action still runs. On a Trigger carrying a damage event it also runs
   * one level deeper in the damage depth `Unit.damageTarget` checks, the
   * registration made before or after. With Dev mode off `TriggerAddAction`
   * receives `actionFunc` itself.
   */
  public addAction(actionFunc: () => void) {
    TriggerAddAction(
      this.handle,
      this.damageNesting(protect(this, "Trigger.addAction", actionFunc)),
    );
    return this;
  }

  /**
   * Adds a new condition to the trigger: a `boolexpr`, or a function the
   * trigger wraps with `Condition`.
   *
   * Adding more conditions later wil join them by AND (that means all conditions need to evaluate to `true`)
   *
   * @example
   * {@includeCode ../../examples/trigger-add-condition.ts}
   * @param condition The condition which must evaluate to true in order to run the trigger's actions.
   * @remarks In Dev mode a function condition runs under `pcall`: one that
   * throws is reported as `Trigger#<id> Trigger.addCondition` and evaluates
   * false, as the game evaluates a crashed condition. The same holds for the
   * function filters of the `register*` members, reported under the member.
   * On a Trigger carrying a damage event a function condition also runs one
   * level deeper in the damage depth `Unit.damageTarget` checks.
   */
  public addCondition(condition: boolexpr | (() => boolean)) {
    TriggerAddCondition(
      this.handle,
      typeof condition === "function"
        ? Condition(
            // The damage nesting goes outside the protection, so what it
            // wraps never throws.
            this.damageNesting(
              protect(this, "Trigger.addCondition", condition, false),
            ),
          )
        : condition,
    );
    return this;
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
   * @bug Do not destroy the current running Trigger (when waits are involved)
   * as it can cause handle stack corruption as documented [here](http://www.wc3c.net/showthread.php?t=110519).
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    DestroyTrigger(this.handle);
    this.release();
  }

  /**
   * Evaluates all functions that were added to the trigger via `addCondition`.
   * All return-values from all added condition-functions are `and`ed together as the final return-value.
   * Returns the boolean value of the return value from the condition-function.
   * So if 0/0.0/null would be returned in the condition-function, `eval`
   * would return false. Note that `""` would return `true`.
   * @note If a condition-function crashes the thread or does not return any value `eval` will return false.
   * @note If you want to return false for a condition-function that returns string (for whatever reason) return `null` instead of `""`
   * @note *All* functions added via `addCondition` are run. There is no short-circuting. If you want short-circuting use `And` or `Or`.
   * @note All functions added via `addCondition` are run in the order they were added.
   */
  public eval() {
    return TriggerEvaluate(this.handle);
  }

  /**
   * Calls the actions of a trigger in a new execution context.
   * Control will return to the caller when the trigger has finished or has been suspended via TriggerSleepAction.
   */
  public exec() {
    TriggerExecute(this.handle);
  }

  /**
   * Does the same as `exec` but if the caller has been marked with `waitOnSleeps` before its
   * execution, it will additionally wait for `TriggerSleepAction`s of the callee, so this really ensures that
   * the callee has finished. If there was a `TriggerSleepAction`, there will be a short delay before returning.
   */
  public execWait() {
    TriggerExecuteWait(this.handle);
  }

  /** Interrupts the Trigger, through `BlzTriggerInterrupt` (3.0.0). */
  public interrupt() {
    BlzTriggerInterrupt(this.handle);
  }

  /** Registers the player unit event for the player in every slot, with no filter. */
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

  public registerCommandEvent(whichAbility: number, order: string) {
    TriggerRegisterCommandEvent(this.handle, whichAbility, order);
    return this;
  }

  public registerDeathEvent(whichWidget: Widget) {
    TriggerRegisterDeathEvent(this.handle, whichWidget.handle);
    return this;
  }

  public registerDialogButtonEvent(whichButton: DialogButton) {
    TriggerRegisterDialogButtonEvent(this.handle, whichButton.handle);
    return this;
  }

  public registerDialogEvent(whichDialog: Dialog) {
    TriggerRegisterDialogEvent(this.handle, whichDialog.handle);
    return this;
  }

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

  /** Registers the frame event `event` of `frame`. */
  public registerFrameEvent(frame: Frame, event: frameeventtype) {
    BlzTriggerRegisterFrameEvent(this.handle, frame.handle, event);
    return this;
  }

  public registerGameEvent(whichGameEvent: gameevent) {
    TriggerRegisterGameEvent(this.handle, whichGameEvent);
    return this;
  }

  public registerGameStateEvent(
    whichState: gamestate,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterGameStateEvent(this.handle, whichState, opcode, limitval);
    return this;
  }

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

  /** Registers the player event of the mouse event `kind` for the player. */
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

  // Creates it's own timer and triggers when it expires
  public registerTimerEvent(timeout: number, periodic: boolean) {
    TriggerRegisterTimerEvent(this.handle, timeout, periodic);
    return this;
  }

  /** Registers the expiry of `timer`. */
  public registerTimerExpire(timer: Timer) {
    TriggerRegisterTimerExpireEvent(this.handle, timer.handle);
    return this;
  }

  /** Registers a click on `trackable`. */
  public registerTrackableHit(trackable: Trackable) {
    TriggerRegisterTrackableHitEvent(this.handle, trackable.handle);
    return this;
  }

  /** Registers the mouse moving over `trackable`. */
  public registerTrackableTrack(trackable: Trackable) {
    TriggerRegisterTrackableTrackEvent(this.handle, trackable.handle);
    return this;
  }

  public registerUnitEvent(whichUnit: Unit, whichEvent: unitevent) {
    this.noteEvent(whichEvent);
    TriggerRegisterUnitEvent(this.handle, whichUnit.handle, whichEvent);
    return this;
  }

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

  public registerUpgradeCommandEvent(whichUpgrade: number) {
    TriggerRegisterUpgradeCommandEvent(this.handle, whichUpgrade);
    return this;
  }

  public registerVariableEvent(
    varName: string,
    opcode: limitop,
    limitval: number,
  ) {
    TriggerRegisterVariableEvent(this.handle, varName, opcode, limitval);
    return this;
  }

  public removeAction(whichAction: triggeraction) {
    TriggerRemoveAction(this.handle, whichAction);
  }

  public removeActions() {
    TriggerClearActions(this.handle);
  }

  public removeCondition(whichCondition: triggercondition) {
    TriggerRemoveCondition(this.handle, whichCondition);
  }

  public removeConditions() {
    TriggerClearConditions(this.handle);
  }

  public reset() {
    ResetTrigger(this.handle);
  }

  public static fromEvent(): Trigger | undefined {
    return this.fromHandle(GetTriggeringTrigger());
  }
}
