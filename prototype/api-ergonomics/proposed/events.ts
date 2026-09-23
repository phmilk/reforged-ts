/** @noSelfInFile */
// PROTOTYPE: two event surfaces.
//   V1  Trigger: the evolved 1:1 class (typed inputs, same shape as today; P6).
//   V2  Event descriptors + `on()`: typed payloads, one Trigger per subscription.
// V2 is built on V1; both can ship.

import { Handle } from "./handle";
import { MapPlayer } from "./player";
import { Timer } from "./timer";
import { Item, Unit } from "./unit";

// ---------------------------------------------------------------- V1: Trigger

export class Trigger extends Handle<trigger> {
  public static create(): Trigger {
    return this.expect(CreateTrigger(), "trigger");
  }

  public static fromEvent(): Trigger | undefined {
    return this.fromHandle(GetTriggeringTrigger());
  }

  public addAction(action: () => void): this {
    TriggerAddAction(this.handle, action);
    return this;
  }

  /** Accepts a plain function; the `Condition` allocation is hidden. */
  public addCondition(condition: boolexpr | (() => boolean)): this {
    const expr = typeof condition === "function" ? Condition(condition) : condition;
    if (expr !== undefined) TriggerAddCondition(this.handle, expr);
    return this;
  }

  public registerAnyUnitEvent(event: playerunitevent): this {
    TriggerRegisterAnyUnitEventBJ(this.handle, event);
    return this;
  }

  public registerUnitEvent(unit: Unit, event: unitevent): this {
    TriggerRegisterUnitEvent(this.handle, unit.handle, event);
    return this;
  }

  public registerPlayerUnitEvent(
    player: MapPlayer,
    event: playerunitevent,
    filter?: boolexpr | (() => boolean)
  ): this {
    const expr = typeof filter === "function" ? Filter(filter) : filter;
    TriggerRegisterPlayerUnitEvent(this.handle, player.handle, event, expr);
    return this;
  }

  /** P6: takes the Wrapper, not the raw `timer`. */
  public registerTimerExpire(timer: Timer): this {
    TriggerRegisterTimerExpireEvent(this.handle, timer.handle);
    return this;
  }

  public get enabled(): boolean {
    return IsTriggerEnabled(this.handle);
  }

  public set enabled(value: boolean) {
    if (value) EnableTrigger(this.handle);
    else DisableTrigger(this.handle);
  }

  public destroy(): void {
    DestroyTrigger(this.handle);
  }
}

// ---------------------------------------------------------------- V2: descriptors

/** Describes one event: how to register it and how to read its payload. */
export interface EventDescriptor<P> {
  readonly register: (trigger: Trigger) => void;
  readonly read: () => P;
}

/** What `on()` hands back: the Trigger it owns, and a way to end the subscription. */
export interface Subscription {
  readonly trigger: Trigger;
  destroy(): void;
}

/**
 * Subscribes. One Trigger per call, owned by the Subscription.
 * `when` runs as a trigger condition (cheap, before the action).
 */
export function on<P>(
  event: EventDescriptor<P>,
  handler: (payload: P) => void,
  when?: (payload: P) => boolean
): Subscription {
  const trigger = Trigger.create();
  event.register(trigger);
  if (when !== undefined) trigger.addCondition(() => when(event.read()));
  trigger.addAction(() => handler(event.read()));
  return { trigger, destroy: () => trigger.destroy() };
}

/** The event guarantees this value; `undefined` here is a library or engine bug. */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) error(`reforged-ts: event payload missing ${what}.`, 2);
  return value;
}

function anyUnit<P>(native: playerunitevent, read: () => P): EventDescriptor<P> {
  return { register: (t) => t.registerAnyUnitEvent(native), read };
}

export const UnitEvents = {
  death: anyUnit(EVENT_PLAYER_UNIT_DEATH, () => ({
    unit: required(Unit.fromEvent(), "dying unit"),
    killer: Unit.fromKilling(), // legitimately undefined (no killer)
  })),

  // 3.0.0
  equip: anyUnit(EVENT_PLAYER_UNIT_EQUIP_ITEM, () => ({
    unit: required(Unit.fromEvent(), "equipping unit"),
    item: required(Item.fromEquipped(), "equipped item"),
  })),

  unequip: anyUnit(EVENT_PLAYER_UNIT_UNEQUIP_ITEM, () => ({
    unit: required(Unit.fromEvent(), "unequipping unit"),
    item: required(Item.fromEquipped(), "unequipped item"),
  })),

  /** Per-instance variant: registers on one unit only. */
  deathOf(unit: Unit): EventDescriptor<{ unit: Unit; killer: Unit | undefined }> {
    return {
      register: (t) => t.registerUnitEvent(unit, EVENT_UNIT_DEATH),
      read: () => ({ unit, killer: Unit.fromKilling() }),
    };
  },
};

export const TimerEvents = {
  expired(timer: Timer): EventDescriptor<{ timer: Timer }> {
    return { register: (t) => t.registerTimerExpire(timer), read: () => ({ timer }) };
  },
};
