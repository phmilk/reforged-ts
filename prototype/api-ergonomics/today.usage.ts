/** @noSelfInFile */
// PROTOTYPE: the three surfaces written with TODAY's API (handles/*), for comparison.
// Type-checks against war3-types-strict/1.33.0 plus the 3.0.0 stub.

import { Item } from "../../handles/item";
import { MapPlayer } from "../../handles/player";
import { Timer } from "../../handles/timer";
import { Trigger } from "../../handles/trigger";
import { Unit } from "../../handles/unit";
import { Widget } from "../../handles/widget";
import { addScriptHook, W3TS_HOOK } from "../../hooks/index";

// ---------------------------------------------------------------- 1. units

export function todayUnits(): void {
  const owner = MapPlayer.fromIndex(0); // MapPlayer | undefined
  if (owner === undefined) return;

  // create: returns Unit | undefined (CreateUnit may fail), so every caller checks.
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0, 270);
  if (footman === undefined) return;
  footman.kill();

  // lookup: fromHandle also returns Unit | undefined.
  const same = Unit.fromHandle(footman.handle);
  print(same === footman); // true: the WeakMap registry keeps identity

  // registry is not class-aware: the first wrapper cached for a handle wins.
  const asWidget = Widget.fromHandle(footman.handle as widget); // Widget | undefined
  const asUnit = Unit.fromHandle(footman.handle); // typed Unit, but at runtime it is whatever was cached first
  print(asWidget, asUnit);
}

// ---------------------------------------------------------------- 2. timers

export function todayTimers(): void {
  // Timer.create is one of the five non-optional factories (no check, no throw).
  const t = Timer.create();
  t.start(1.0, true, () => {
    // the handler gets nothing; the timer is fetched from the trigger context.
    const expired = Timer.fromExpired(); // Timer | undefined
    if (expired !== undefined && expired.elapsed > 10) expired.destroy();
  });
}

// ---------------------------------------------------------------- 3. events

export function todayEvents(): void {
  // a unit dies: make a Trigger, register, add an action, read globals inside it.
  const onDeath = Trigger.create();
  onDeath.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH);
  onDeath.addCondition(() => Unit.fromEvent()?.name !== "Sheep");
  onDeath.addAction(() => {
    const dying = Unit.fromEvent(); // Unit | undefined, even though the event guarantees it
    const killer = Unit.fromHandle(GetKillingUnit()); // no fromKilling accessor today
    if (dying !== undefined) print(`${dying.name} died to ${killer?.name ?? "nobody"}`);
  });

  // 3.0.0 equip event, today-style: the accessor is a raw native call wrapped by hand.
  const onEquip = Trigger.create();
  onEquip.registerAnyUnitEvent(EVENT_PLAYER_UNIT_EQUIP_ITEM);
  onEquip.addAction(() => {
    const unit = Unit.fromEvent();
    const item = Item.fromHandle(GetEquippedItem());
    if (unit !== undefined && item !== undefined) print(`${unit.name} equipped ${item.name}`);
  });

  // timer expiry through a trigger takes the RAW handle (design review P6).
  const t = Timer.create();
  const onExpire = Trigger.create();
  onExpire.registerTimerExpireEvent(t.handle);
}

// ---------------------------------------------------------------- 4. lifecycle

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
  todayUnits();
  todayTimers();
  todayEvents();
});
