/** @noSelfInFile */
// PROTOTYPE: the same three surfaces with the PROPOSED API. Compare with today.usage.ts.

import { on, TimerEvents, Trigger, UnitEvents } from "./proposed/events";
import { Init } from "./proposed/lifecycle";
import { MapPlayer } from "./proposed/player";
import { Timer } from "./proposed/timer";
import { Item, Unit, Widget } from "./proposed/unit";

// ---------------------------------------------------------------- 1. units

export function proposedUnits(): void {
  const owner = MapPlayer.fromIndex(0); // MapPlayer | undefined: a lookup
  if (owner === undefined) return;

  // create: typed Unit (throws on a bad rawcode). No check at the call site.
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0, 270);
  footman.kill();

  // lookup: identity preserved, typed Unit | undefined.
  const same = Unit.fromHandle(footman.handle);
  print(same === footman); // true

  // registry upgrade: a Widget cached first does not hide the Unit.
  const asWidget = Widget.fromHandle(footman.handle); // Widget | undefined (unit is a widget)
  const asUnit = Unit.fromHandle(footman.handle); // a real Unit, replaces the Widget entry
  print(asWidget, asUnit, asUnit instanceof Unit);

  // sugar on the same rules
  print(footman.owner.name, footman.name);
}

// ---------------------------------------------------------------- 2. timers

export function proposedTimers(): void {
  // the handler receives the Timer
  const t = Timer.create();
  t.start(1.0, true, (timer) => {
    if (timer.elapsed > 10) timer.destroy();
  });

  // one-shot, nothing to own
  Timer.after(0.5, () => print("half a second later"));

  // periodic, caller owns
  const heartbeat = Timer.every(30, (timer) => print(`tick ${timer.elapsed}`));
  heartbeat.pause();
}

// ---------------------------------------------------------------- 3. events

export function proposedEventsV1(): void {
  // V1: same shape as today, typed inputs, wrapper accessors.
  const onDeath = Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
    .addCondition(() => Unit.fromEvent()?.name !== "Sheep")
    .addAction(() => {
      const dying = Unit.fromEvent(); // still Unit | undefined here: V1 cannot know the event
      const killer = Unit.fromKilling();
      if (dying !== undefined) print(`${dying.name} died to ${killer?.name ?? "nobody"}`);
    });

  // timer expiry through a trigger takes the Wrapper (P6)
  const t = Timer.create();
  Trigger.create().registerTimerExpire(t);
  onDeath.enabled = false;
}

export function proposedEventsV2(): void {
  // V2: typed payload; the event guarantees `unit`, so no check.
  const deaths = on(
    UnitEvents.death,
    ({ unit, killer }) => print(`${unit.name} died to ${killer?.name ?? "nobody"}`),
    ({ unit }) => unit.name !== "Sheep" // condition, runs before the action
  );

  // 3.0.0 equip/unequip
  on(UnitEvents.equip, ({ unit, item }) => print(`${unit.name} equipped ${item.name}`));
  on(UnitEvents.unequip, ({ unit, item }) => print(`${unit.name} unequipped ${item.name}`));

  // per-instance
  const owner = MapPlayer.fromIndex(0);
  if (owner !== undefined) {
    const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
    on(UnitEvents.deathOf(hero), ({ unit }) => print(`the hero ${unit.name} fell`));
    const sword = Item.create(FourCC("ratf"), 0, 0);
    hero.equip(sword);
  }

  // timer through the same door
  const t = Timer.create();
  const expiry = on(TimerEvents.expired(t), ({ timer }) => print(timer.elapsed));

  // subscriptions are owned, explicit, destroyable
  deaths.destroy();
  expiry.destroy();
}

// ---------------------------------------------------------------- 4. lifecycle

Init.onGlobals(() => {
  // library-level Handles belong here, not at Lua root (P5)
});

Init.onGameStart(() => {
  proposedUnits();
  proposedTimers();
  proposedEventsV1();
  proposedEventsV2();
});
