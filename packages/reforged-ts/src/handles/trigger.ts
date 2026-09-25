/** @noSelfInFile */

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
  Down = "down",
  Up = "up",
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

/** The `boolexpr` a registration passes: a function goes through `Filter`. */
function filterOf(
  filter: boolexpr | (() => boolean) | undefined,
): boolexpr | undefined {
  return typeof filter === "function" ? Filter(filter) : filter;
}

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

  public addAction(actionFunc: () => void) {
    TriggerAddAction(this.handle, actionFunc);
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
   */
  public addCondition(condition: boolexpr | (() => boolean)) {
    TriggerAddCondition(
      this.handle,
      typeof condition === "function" ? Condition(condition) : condition,
    );
    return this;
  }

  /**
   * @bug Do not destroy the current running Trigger (when waits are involved)
   * as it can cause handle stack corruption as documented [here](http://www.wc3c.net/showthread.php?t=110519).
   */
  public destroy() {
    DestroyTrigger(this.handle);
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

  public interrupt() {
    BlzTriggerInterrupt(this.handle);
  }

  public isRunning(): boolean {
    return BlzTriggerIsRunning(this.handle);
  }

  /** Registers the player unit event for the player in every slot, with no filter. */
  public registerAnyUnitEvent(whichPlayerUnitEvent: playerunitevent) {
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
      filterOf(filter),
    );
    return this;
  }

  public registerFilterUnitEvent(
    whichUnit: Unit,
    whichEvent: unitevent,
    filter?: boolexpr | (() => boolean),
  ) {
    TriggerRegisterFilterUnitEvent(
      this.handle,
      whichUnit.handle,
      whichEvent,
      filterOf(filter),
    );
    return this;
  }

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
      filterOf(filter),
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
    TriggerRegisterPlayerUnitEvent(
      this.handle,
      whichPlayer.handle,
      whichPlayerUnitEvent,
      filterOf(filter),
    );
    return this;
  }

  // Creates it's own timer and triggers when it expires
  public registerTimerEvent(timeout: number, periodic: boolean) {
    TriggerRegisterTimerEvent(this.handle, timeout, periodic);
    return this;
  }

  // Triggers when the timer you tell it about expires
  public registerTimerExpire(timer: Timer) {
    TriggerRegisterTimerExpireEvent(this.handle, timer.handle);
    return this;
  }

  public registerTrackableHit(trackable: Trackable) {
    TriggerRegisterTrackableHitEvent(this.handle, trackable.handle);
    return this;
  }

  public registerTrackableTrack(trackable: Trackable) {
    TriggerRegisterTrackableTrackEvent(this.handle, trackable.handle);
    return this;
  }

  public registerUnitEvent(whichUnit: Unit, whichEvent: unitevent) {
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
      filterOf(filter),
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
