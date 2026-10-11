# Class: Trigger

Defined in: [handles/trigger.ts:223](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L223)

A game trigger: when one of the events registered on it fires, it
evaluates its conditions, and runs its actions when they all hold.

## Remarks

- `on()` creates one Trigger per handler from an Event descriptor, with a
  typed payload. Use a Trigger directly for an event no descriptor covers,
  or for several events sharing one action.
- The `register*`, `add*` and `remove*` members return the Trigger, so
  calls chain. An event cannot be unregistered: disable the Trigger or
  destroy it.
- `removeAction` and `removeCondition` take the very function (or
  `boolexpr`) given to `addAction` or `addCondition`, as
  `removeEventListener` takes what `addEventListener` was given.
- In Dev mode every function a Trigger receives (action, condition,
  filter) runs under `pcall`, and a failure is reported naming the
  Trigger and the member that received it.

## Example

**Registering an event, a condition and an action**

```ts
// The chat command "-gold": one Trigger watches every player's messages, its
// condition lets each player claim the gold once, and its action pays it.
import { Init, MapPlayer, Trigger, tsGlobals } from "reforged-ts";

const claimed = new Set<MapPlayer>();

Init.onTriggers(() => {
  const trigger = Trigger.create();
  for (const player of tsGlobals.Players) {
    trigger.registerPlayerChatEvent(player, "-gold", true);
  }
  trigger
    .addCondition(() => {
      const player = MapPlayer.fromEvent();
      return player !== undefined && !claimed.has(player);
    })
    .addAction(() => {
      const player = MapPlayer.fromEvent();
      if (player === undefined) {
        return;
      }
      claimed.add(player);
      const gold = player.getState(PLAYER_STATE_RESOURCE_GOLD);
      player.setState(PLAYER_STATE_RESOURCE_GOLD, gold + 500);
    });
});
```

## Native

[trigger](/typings/3.0.0/interfaces/trigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/trigger))

## Extends

- [`Handle`](Handle.md)\<`trigger`\>

## Properties

### handle

> `readonly` **handle**: `trigger`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [handles/trigger.ts:257](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L257)

Gets whether the Trigger responds to its events.

##### Native

[IsTriggerEnabled](/typings/3.0.0/functions/IsTriggerEnabled) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTriggerEnabled))

##### Returns

`boolean`

True unless it was disabled; a new Trigger is enabled.

#### Set Signature

> **set** **enabled**(`flag`): `void`

Defined in: [handles/trigger.ts:244](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L244)

Whether the Trigger responds to its events: false disables it until it
is set back to true. A disabled Trigger keeps its events, conditions and
actions.

##### Native

[EnableTrigger](/typings/3.0.0/functions/EnableTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/EnableTrigger))

##### Native

[DisableTrigger](/typings/3.0.0/functions/DisableTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisableTrigger))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### evalCount

#### Get Signature

> **get** **evalCount**(): `number`

Defined in: [handles/trigger.ts:267](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L267)

Gets how many times the Trigger's conditions were evaluated since it
was created or last `reset`.

##### Native

[GetTriggerEvalCount](/typings/3.0.0/functions/GetTriggerEvalCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerEvalCount))

##### Returns

`number`

The number of evaluations, 0 or more.

***

### execCount

#### Get Signature

> **get** **execCount**(): `number`

Defined in: [handles/trigger.ts:288](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L288)

Gets how many times the Trigger's actions ran since it was created or
last `reset`.

##### Native

[GetTriggerExecCount](/typings/3.0.0/functions/GetTriggerExecCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerExecCount))

##### Returns

`number`

The number of runs, 0 or more: a firing whose conditions fail
counts in `evalCount`, not here.

***

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L148)

Gets the game's numeric id of the Handle.

##### Remarks

Ids are not recycled immediately when the object is destroyed (a new
Handle created right after gets the next id), and they are allocated
deterministically from map start. An id is never data: key a collection
on the Handle (or use `HandleMap` and `HandleSet`), never on its id.

##### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

##### Returns

`number`

The id, unique among the live Handles.

#### Inherited from

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### isRunning

#### Get Signature

> **get** **isRunning**(): `boolean`

Defined in: [handles/trigger.ts:300](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L300)

Gets whether the Trigger is running.

##### Remarks

The Native, added in 3.0.0, comes with no documentation from the Patch
beyond its name.

##### Native

[BlzTriggerIsRunning](/typings/3.0.0/functions/BlzTriggerIsRunning) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerIsRunning))

##### Returns

`boolean`

True while the game reports the Trigger as running.

***

### waitOnSleeps

#### Get Signature

> **get** **waitOnSleeps**(): `boolean`

Defined in: [handles/trigger.ts:321](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L321)

Gets whether an `execWait` made by the Trigger's actions waits for the
sleeps of the Trigger it runs.

##### Native

[IsTriggerWaitOnSleeps](/typings/3.0.0/functions/IsTriggerWaitOnSleeps) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTriggerWaitOnSleeps))

##### Returns

`boolean`

The value `waitOnSleeps` was last set to.

#### Set Signature

> **set** **waitOnSleeps**(`flag`): `void`

Defined in: [handles/trigger.ts:311](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L311)

Whether an `execWait` made by the Trigger's actions also waits for the
`TriggerSleepAction` waits of the Trigger it runs. It is a mark on the
Trigger read when a run starts: runs already going keep the value they
started with.

##### Native

[TriggerWaitOnSleeps](/typings/3.0.0/functions/TriggerWaitOnSleeps) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerWaitOnSleeps))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### eventId

#### Get Signature

> **get** `static` **eventId**(): `eventid` \| `undefined`

Defined in: [handles/trigger.ts:277](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L277)

Gets the event that fired the running Trigger.

##### Native

[GetTriggerEventId](/typings/3.0.0/functions/GetTriggerEventId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerEventId))

##### Returns

`eventid` \| `undefined`

The event's id, to compare with the `EVENT_*` constant it was
registered with; meaningful only inside a Trigger's condition or action.

## Methods

### addAction()

> **addAction**(`actionFunc`): `Trigger`

Defined in: [handles/trigger.ts:347](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L347)

Adds a function the Trigger runs each time it fires and its conditions
hold, after the actions added before it.

#### Parameters

##### actionFunc

() => `void`

The action; it reads the event through the lookups,
such as `Unit.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

- In Dev mode the action runs under `pcall`: one that throws is
  reported as `Trigger#<id> Trigger.addAction` and the trigger's next
  action still runs. On a Trigger carrying a damage event it also runs
  one level deeper in the damage depth `Unit.damageTarget` checks, the
  registration made before or after. With Dev mode off `TriggerAddAction`
  receives `actionFunc` itself.
- The Trigger keeps the `triggeraction` the Native returns under
  `actionFunc`: `removeAction(actionFunc)` removes this action. Adding
  the same function twice adds two actions, both removed together.
- When `TriggerAddAction` returns nothing, the Trigger keeps nothing and
  the call still returns the Trigger. On a destroyed trigger the game
  returns a placeholder `triggeraction` of id 0 instead, which the
  Trigger keeps.

#### Native

[TriggerAddAction](/typings/3.0.0/functions/TriggerAddAction) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerAddAction))

***

### addCondition()

> **addCondition**(`condition`): `Trigger`

Defined in: [handles/trigger.ts:386](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L386)

Adds a condition the Trigger evaluates when it fires: its actions run
only when every condition returns true. A condition is a `boolexpr`, or
a function the Trigger wraps with `Condition`.

#### Parameters

##### condition

[`BoolexprInput`](../type-aliases/BoolexprInput.md)

The condition which must evaluate to true in order to run the trigger's actions.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

- Every condition is evaluated, in the order added, without
  short-circuiting: join them with `And` or `Or` for that.
- In Dev mode a function condition runs under `pcall`: one that throws
  is reported as `Trigger#<id> Trigger.addCondition` and evaluates
  false, as the game evaluates a crashed condition. The same holds for
  the function filters of the `register*` members, reported under the
  member. On a Trigger carrying a damage event a function condition also
  runs one level deeper in the damage depth `Unit.damageTarget` checks.
- In both modes `Condition` receives a closure the Trigger makes around
  a function condition, so every add owns its own `Condition`: the game
  may return one `boolexpr` for the same function, and the Trigger never
  destroys one it shares with another add or with a `Condition(fn)` of
  yours.
- The Trigger keeps the `triggercondition` the Native returns under
  `condition`: `removeCondition(condition)` removes this condition, and
  destroys the `Condition` made for a function. Adding the same value
  twice adds two conditions, both removed together.

#### Example

```ts
// A Trigger that fires when any unit is attacked, but runs its action only
// when the attacker's name matches: addCondition takes a plain function.
import { Init, Trigger, Unit } from "reforged-ts";

Init.onTriggers(() => {
  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED)
    .addCondition(() => Unit.fromAttacker()?.name === "Attacker Unit")
    .addAction(() => {
      // do something...
    });
});
```

#### Native

[TriggerAddCondition](/typings/3.0.0/functions/TriggerAddCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerAddCondition))

#### Native

[Condition](/typings/3.0.0/functions/Condition) ([jassbot](https://lep.duckdns.org/jassbot/doc/Condition))

#### Native

[DestroyCondition](/typings/3.0.0/functions/DestroyCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyCondition))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/trigger.ts:465](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L465)

Destroys the Trigger through its Native.

#### Returns

`void`

#### Remarks

- The `Condition`s the Trigger made for the functions `addCondition`
  received are destroyed with it, and it forgets what its add members
  added. A `boolexpr` the caller passed is left alone.
- In Dev mode the destroyed Wrapper becomes a tombstone: any later
  access, a second `destroy()` included, raises
  `reforged-ts: used after destroy: <Class>#<id>`, and
  `Reforged.debug.report()` counts it destroyed.

#### Example

**The handles a feature owns, destroyed when it ends**

```ts
// A shrine that stands for 60 seconds, with everything it shows. Its
// handles belong to it alone: its end destroys each of them once, on every
// client, and drops the object that held them, so no reference survives.
// Any later use of a destroyed Wrapper raises in Dev mode
// (`reforged-ts: used after destroy: <Class>#<id>`); without Dev mode it
// reaches a Handle the game has freed.
import {
  Effect,
  FogModifier,
  Image,
  ImageType,
  Init,
  MapPlayer,
  Rectangle,
  Region,
  TextTag,
  Timer,
  Trigger,
  tsGlobals,
  Ubersplat,
  Unit,
  WeatherEffect,
} from "reforged-ts";

interface Shrine {
  readonly area: Rectangle;
  readonly region: Region;
  readonly trigger: Trigger;
  readonly timer: Timer;
  readonly glow: Effect;
  readonly label: TextTag;
  readonly circle: Image;
  readonly splat: Ubersplat;
  readonly vision: FogModifier;
  readonly rain: WeatherEffect;
}

let shrine: Shrine | undefined;

/** Ends the shrine: every handle it owns is destroyed, then forgotten. */
export function endShrine(): void {
  if (shrine === undefined) {
    return;
  }
  const { area, region, trigger, timer, glow, label } = shrine;
  const { circle, splat, vision, rain } = shrine;
  shrine = undefined;
  trigger.destroy();
  region.destroy();
  rain.destroy();
  area.destroy();
  glow.destroy();
  label.destroy();
  circle.destroy();
  splat.destroy();
  vision.destroy();
  timer.destroy();
}

/** Raises a shrine at (x, y) for `owner`, healing the heroes who enter. */
export function raiseShrine(owner: MapPlayer, x: number, y: number): void {
  endShrine();
  const area = Rectangle.create(x - 256, y - 256, x + 256, y + 256);
  const region = Region.create();
  region.addRect(area);
  const trigger = Trigger.create().registerEnterRegion(region, () => {
    return Unit.fromFilter()?.isHero() === true;
  });
  trigger.addAction(() => {
    const hero = Unit.fromEntering();
    if (hero !== undefined) {
      hero.life = hero.maxLife;
    }
  });
  const rain = WeatherEffect.create(area, FourCC("RAlr"));
  rain.enable(true);
  const label = TextTag.create();
  label.setText("Shrine", 12, true);
  label.setPos(x, y, 128);
  const circle = Image.create(
    "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp",
    512,
    512,
    0,
    x - 256,
    y - 256,
    0,
    0,
    0,
    0,
    ImageType.Indicator,
  );
  circle.setRender(true);
  const splat = Ubersplat.create(x, y, "HMED", 255, 255, 255, 255, true, true);
  splat.show(true);
  const vision = FogModifier.create(
    owner,
    FOG_OF_WAR_VISIBLE,
    x,
    y,
    512,
    true,
    false,
  );
  vision.start();
  shrine = {
    area,
    region,
    trigger,
    timer: Timer.create().start(60, false, endShrine),
    glow: Effect.create(
      "Abilities\\Spells\\Human\\HolyBolt\\HolyBoltSpecialArt.mdl",
      x,
      y,
    ),
    label,
    circle,
    splat,
    vision,
    rain,
  };
}

Init.onGameStart(() => {
  raiseShrine(tsGlobals.Players[0], 0, 0);
});
```

#### Native

[DestroyTrigger](/typings/3.0.0/functions/DestroyTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTrigger))

#### Native

[DestroyCondition](/typings/3.0.0/functions/DestroyCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyCondition))

#### Bug

Destroying the Trigger that is running, while waits are involved,
can corrupt the handle stack:
http://www.wc3c.net/showthread.php?t=110519.

***

### eval()

> **eval**(): `boolean`

Defined in: [handles/trigger.ts:487](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L487)

Evaluates the Trigger's conditions now, without running its actions.

#### Returns

`boolean`

True when every condition holds, or when the Trigger has none.

#### Remarks

- The result is the logical and of what every condition returns.
- A condition that returns `0`, `0.0` or `null` counts as false, while
  one returning `""` counts as true: a condition returning a string
  gives `null` for false.
- A condition that crashes its thread, or returns nothing, makes `eval`
  return false.
- Every condition runs, in the order `addCondition` added them, even
  after one returned false; to stop at the first false, combine them
  into one with `And` or `Or`.

#### Native

[TriggerEvaluate](/typings/3.0.0/functions/TriggerEvaluate) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerEvaluate))

***

### exec()

> **exec**(): `void`

Defined in: [handles/trigger.ts:499](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L499)

Runs the Trigger's actions now, in a new thread, without evaluating its
conditions.

#### Returns

`void`

#### Remarks

The call returns when the actions finish, or as soon as one of them
sleeps with `TriggerSleepAction`: `execWait` can wait for the sleeps.

#### Native

[TriggerExecute](/typings/3.0.0/functions/TriggerExecute) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerExecute))

***

### execWait()

> **execWait**(): `void`

Defined in: [handles/trigger.ts:511](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L511)

Runs the Trigger's actions as `exec` does and, when the running Trigger
has `waitOnSleeps` set, waits for them to finish their
`TriggerSleepAction` waits too.

#### Returns

`void`

#### Remarks

After a sleep in the actions, the call returns with a short delay.

#### Native

[TriggerExecuteWait](/typings/3.0.0/functions/TriggerExecuteWait) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerExecuteWait))

***

### interrupt()

> **interrupt**(): `void`

Defined in: [handles/trigger.ts:522](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L522)

Interrupts the Trigger.

#### Returns

`void`

#### Remarks

The Native, added in 3.0.0, comes with no documentation from the Patch
beyond its name.

#### Native

[BlzTriggerInterrupt](/typings/3.0.0/functions/BlzTriggerInterrupt) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerInterrupt))

***

### registerAnyUnitEvent()

> **registerAnyUnitEvent**(`whichPlayerUnitEvent`): `Trigger`

Defined in: [handles/trigger.ts:537](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L537)

Registers a player-unit event for the units of every player slot, with
no filter.

#### Parameters

##### whichPlayerUnitEvent

`playerunitevent`

The event, such as
`EVENT_PLAYER_UNIT_DEATH`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

The players are read when it is called. A damage event marks the Trigger
for the Dev-mode damage depth (see `addAction`).

#### Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))

***

### registerCommandEvent()

> **registerCommandEvent**(`whichAbility`, `order`): `Trigger`

Defined in: [handles/trigger.ts:557](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L557)

Registers a click on the command button of an ability, identified by
the ability and its order string.

#### Parameters

##### whichAbility

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

##### order

`string`

The order string of the button, such as `"blizzard"`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterCommandEvent](/typings/3.0.0/functions/TriggerRegisterCommandEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterCommandEvent))

***

### registerDeathEvent()

> **registerDeathEvent**(`whichWidget`): `Trigger`

Defined in: [handles/trigger.ts:569](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L569)

Registers the death of a widget: a unit, an item or a destructable.

#### Parameters

##### whichWidget

[`Widget`](Widget.md)

The widget whose death fires the Trigger; read it
back with `Widget.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterDeathEvent](/typings/3.0.0/functions/TriggerRegisterDeathEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterDeathEvent))

***

### registerDialogButtonEvent()

> **registerDialogButtonEvent**(`whichButton`): `Trigger`

Defined in: [handles/trigger.ts:581](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L581)

Registers a click on one dialog button.

#### Parameters

##### whichButton

[`DialogButton`](DialogButton.md)

The button; read it back with
`DialogButton.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterDialogButtonEvent](/typings/3.0.0/functions/TriggerRegisterDialogButtonEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterDialogButtonEvent))

***

### registerDialogEvent()

> **registerDialogEvent**(`whichDialog`): `Trigger`

Defined in: [handles/trigger.ts:593](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L593)

Registers a click on any button of a dialog.

#### Parameters

##### whichDialog

[`Dialog`](Dialog.md)

The dialog; read the clicked button with
`DialogButton.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterDialogEvent](/typings/3.0.0/functions/TriggerRegisterDialogEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterDialogEvent))

***

### registerEnterRegion()

> **registerEnterRegion**(`whichRegion`, `filter?`): `Trigger`

Defined in: [handles/trigger.ts:611](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L611)

Registers a unit entering a region, for the units the filter accepts.

#### Parameters

##### whichRegion

[`Region`](Region.md)

The region; read the entering unit with
`Unit.fromEntering()`.

##### filter?

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning whether the unit
counts, read with `Unit.fromFilter()`; every unit when left out.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

In Dev mode a function filter runs under `pcall`: one that throws is
reported as `Trigger#<id> Trigger.registerEnterRegion` and rejects the
unit.

#### Native

[TriggerRegisterEnterRegion](/typings/3.0.0/functions/TriggerRegisterEnterRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterEnterRegion))

***

### registerFilterUnitEvent()

> **registerFilterUnitEvent**(`whichUnit`, `whichEvent`, `filter?`): `Trigger`

Defined in: [handles/trigger.ts:637](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L637)

Registers a unit event on one unit, when the filter accepts it.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit the event is registered on.

##### whichEvent

`unitevent`

The event, such as `EVENT_UNIT_DAMAGED`.

##### filter?

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning whether the event
counts; every event when left out.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

A damage event marks the Trigger for the Dev-mode damage depth (see
`addAction`). In Dev mode a function filter runs under `pcall`: one that
throws is reported as `Trigger#<id> Trigger.registerFilterUnitEvent` and
evaluates false.

#### Native

[TriggerRegisterFilterUnitEvent](/typings/3.0.0/functions/TriggerRegisterFilterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterFilterUnitEvent))

***

### registerFrameEvent()

> **registerFrameEvent**(`frame`, `event`): `Trigger`

Defined in: [handles/trigger.ts:659](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L659)

Registers the frame event `event` of `frame`.

#### Parameters

##### frame

[`Frame`](Frame.md)

The Frame; read it back with `Frame.fromEvent()`.

##### event

`frameeventtype`

The frame event type, such as `FRAMEEVENT_CONTROL_CLICK`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[BlzTriggerRegisterFrameEvent](/typings/3.0.0/functions/BlzTriggerRegisterFrameEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerRegisterFrameEvent))

***

### registerGameEvent()

> **registerGameEvent**(`whichGameEvent`): `Trigger`

Defined in: [handles/trigger.ts:670](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L670)

Registers a game event.

#### Parameters

##### whichGameEvent

`gameevent`

The event, such as `EVENT_GAME_BUILD_SUBMENU`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterGameEvent](/typings/3.0.0/functions/TriggerRegisterGameEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterGameEvent))

***

### registerGameStateEvent()

> **registerGameStateEvent**(`whichState`, `opcode`, `limitval`): `Trigger`

Defined in: [handles/trigger.ts:685](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L685)

Registers a game state reaching a limit.

#### Parameters

##### whichState

`gamestate`

The state, such as `GAME_STATE_TIME_OF_DAY`.

##### opcode

`limitop`

How the state compares with the limit, such as
`GREATER_THAN_OR_EQUAL`.

##### limitval

`number`

The value the state is compared with, in the state's
own unit: hours for the time of day, such as 6 for dawn.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterGameStateEvent](/typings/3.0.0/functions/TriggerRegisterGameStateEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterGameStateEvent))

***

### registerLeaveRegion()

> **registerLeaveRegion**(`whichRegion`, `filter?`): `Trigger`

Defined in: [handles/trigger.ts:707](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L707)

Registers a unit leaving a region, for the units the filter accepts.

#### Parameters

##### whichRegion

[`Region`](Region.md)

The region; read the leaving unit with
`Unit.fromLeaving()`.

##### filter?

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning whether the unit
counts, read with `Unit.fromFilter()`; every unit when left out.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

In Dev mode a function filter runs under `pcall`: one that throws is
reported as `Trigger#<id> Trigger.registerLeaveRegion` and rejects the
unit.

#### Native

[TriggerRegisterLeaveRegion](/typings/3.0.0/functions/TriggerRegisterLeaveRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterLeaveRegion))

***

### registerPlayerAllianceChange()

> **registerPlayerAllianceChange**(`whichPlayer`, `whichAlliance`): `Trigger`

Defined in: [handles/trigger.ts:727](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L727)

Registers a player changing one of its alliance settings toward another
player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose setting changes.

##### whichAlliance

`alliancetype`

The setting, such as `ALLIANCE_SHARED_VISION`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterPlayerAllianceChange](/typings/3.0.0/functions/TriggerRegisterPlayerAllianceChange) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerAllianceChange))

***

### registerPlayerChatEvent()

> **registerPlayerChatEvent**(`whichPlayer`, `chatMessageToDetect`, `exactMatchOnly`): `Trigger`

Defined in: [handles/trigger.ts:749](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L749)

Registers a chat message of a player that contains a text, or equals it.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose messages are watched.

##### chatMessageToDetect

`string`

The text to detect; `""` detects every
message.

##### exactMatchOnly

`boolean`

True to fire only when the message equals the
text, false when it contains it.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterPlayerChatEvent](/typings/3.0.0/functions/TriggerRegisterPlayerChatEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerChatEvent))

***

### registerPlayerEvent()

> **registerPlayerEvent**(`whichPlayer`, `whichPlayerEvent`): `Trigger`

Defined in: [handles/trigger.ts:771](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L771)

Registers a player event of one player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player; read it back with
`MapPlayer.fromEvent()`.

##### whichPlayerEvent

`playerevent`

The event, such as `EVENT_PLAYER_LEAVE`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterPlayerEvent](/typings/3.0.0/functions/TriggerRegisterPlayerEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerEvent))

***

### registerPlayerKeyEvent()

> **registerPlayerKeyEvent**(`whichPlayer`, `whichKey`, `metaKey`, `fireOnKeyDown`): `Trigger`

Defined in: [handles/trigger.ts:795](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L795)

Registers a player pressing or releasing a key while holding modifier
keys. The game syncs key events between players.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player at the keyboard.

##### whichKey

`oskeytype`

The key, such as `OSKEY_ESCAPE`.

##### metaKey

`number`

The modifier keys that must be held, as a bit set: 0
none, 1 Shift, 2 Ctrl, 4 Alt, 8 the Windows key; add them to combine.

##### fireOnKeyDown

`boolean`

True to fire when the key goes down, repeatedly
while it is held; false to fire once when it is released.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[BlzTriggerRegisterPlayerKeyEvent](/typings/3.0.0/functions/BlzTriggerRegisterPlayerKeyEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerRegisterPlayerKeyEvent))

***

### registerPlayerMouseEvent()

> **registerPlayerMouseEvent**(`whichPlayer`, `kind`): `Trigger`

Defined in: [handles/trigger.ts:819](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L819)

Registers the player event of the mouse event `kind` for the player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player at the mouse.

##### kind

[`MouseEventKind`](../enumerations/MouseEventKind.md)

The mouse event: a button pressed, released, or the mouse
moving.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterPlayerEvent](/typings/3.0.0/functions/TriggerRegisterPlayerEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerEvent))

***

### registerPlayerStateEvent()

> **registerPlayerStateEvent**(`whichPlayer`, `whichState`, `opcode`, `limitval`): `Trigger`

Defined in: [handles/trigger.ts:842](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L842)

Registers a player state of one player reaching a limit.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose state is watched.

##### whichState

`playerstate`

The state, such as `PLAYER_STATE_RESOURCE_GOLD`.

##### opcode

`limitop`

How the state compares with the limit, such as
`GREATER_THAN_OR_EQUAL`.

##### limitval

`number`

The value the state is compared with, in the state's
own unit, such as an amount of gold.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterPlayerStateEvent](/typings/3.0.0/functions/TriggerRegisterPlayerStateEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerStateEvent))

***

### registerPlayerSyncEvent()

> **registerPlayerSyncEvent**(`whichPlayer`, `prefix`, `fromServer`): `Trigger`

Defined in: [handles/trigger.ts:868](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L868)

Registers the arrival, at every player, of the data a player sent with
`BlzSendSyncData` under a prefix.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player who sends the data.

##### prefix

`string`

The prefix the sender passes to `BlzSendSyncData`; data
sent under another prefix does not fire the Trigger.

##### fromServer

`boolean`

Pass false: the data comes from `whichPlayer`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[BlzTriggerRegisterPlayerSyncEvent](/typings/3.0.0/functions/BlzTriggerRegisterPlayerSyncEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTriggerRegisterPlayerSyncEvent))

***

### registerPlayerUnitEvent()

> **registerPlayerUnitEvent**(`whichPlayer`, `whichPlayerUnitEvent`, `filter?`): `Trigger`

Defined in: [handles/trigger.ts:898](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L898)

Registers a player-unit event for the units of one player, for the
units the filter accepts.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose units are watched.

##### whichPlayerUnitEvent

`playerunitevent`

The event, such as
`EVENT_PLAYER_UNIT_DEATH`.

##### filter?

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning whether the unit
counts, read with `Unit.fromFilter()`; every unit when left out.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

A damage event marks the Trigger for the Dev-mode damage depth (see
`addAction`). In Dev mode a function filter runs under `pcall`: one that
throws is reported as `Trigger#<id> Trigger.registerPlayerUnitEvent`
and rejects the unit.

#### Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))

***

### registerTimerEvent()

> **registerTimerEvent**(`timeout`, `periodic`): `Trigger`

Defined in: [handles/trigger.ts:925](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L925)

Registers a timeout: the game runs a timer of its own for the Trigger,
firing it once or periodically.

#### Parameters

##### timeout

`number`

The time before the Trigger fires, in seconds.

##### periodic

`boolean`

True to fire every `timeout` seconds, false to fire
once.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

Since Patch 1.32 a periodic registration fires at most about 100 times a
second, whatever its timeout; a Timer has no such limit.

#### Native

[TriggerRegisterTimerEvent](/typings/3.0.0/functions/TriggerRegisterTimerEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterTimerEvent))

***

### registerTimerExpire()

> **registerTimerExpire**(`timer`): `Trigger`

Defined in: [handles/trigger.ts:936](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L936)

Registers the expiry of `timer`.

#### Parameters

##### timer

[`Timer`](Timer.md)

The Timer; read it back with `Timer.fromExpired()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterTimerExpireEvent](/typings/3.0.0/functions/TriggerRegisterTimerExpireEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterTimerExpireEvent))

***

### registerTrackableHit()

> **registerTrackableHit**(`trackable`): `Trigger`

Defined in: [handles/trigger.ts:948](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L948)

Registers a click on `trackable`.

#### Parameters

##### trackable

[`Trackable`](Trackable.md)

The Trackable; read it back with
`Trackable.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterTrackableHitEvent](/typings/3.0.0/functions/TriggerRegisterTrackableHitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterTrackableHitEvent))

***

### registerTrackableTrack()

> **registerTrackableTrack**(`trackable`): `Trigger`

Defined in: [handles/trigger.ts:960](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L960)

Registers the mouse moving over `trackable`.

#### Parameters

##### trackable

[`Trackable`](Trackable.md)

The Trackable; read it back with
`Trackable.fromEvent()`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterTrackableTrackEvent](/typings/3.0.0/functions/TriggerRegisterTrackableTrackEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterTrackableTrackEvent))

***

### registerUnitEvent()

> **registerUnitEvent**(`whichUnit`, `whichEvent`): `Trigger`

Defined in: [handles/trigger.ts:975](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L975)

Registers a unit event on one unit.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit the event is registered on.

##### whichEvent

`unitevent`

The event, such as `EVENT_UNIT_DEATH`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

A damage event marks the Trigger for the Dev-mode damage depth (see
`addAction`).

#### Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))

***

### registerUnitInRange()

> **registerUnitInRange**(`whichUnit`, `range`, `filter?`): `Trigger`

Defined in: [handles/trigger.ts:996](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L996)

Registers a unit coming within a distance of another unit, for the
units the filter accepts.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit others approach.

##### range

`number`

The distance, in world units.

##### filter?

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning whether the
approaching unit counts, read with `Unit.fromFilter()`; every unit when
left out.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

In Dev mode a function filter runs under `pcall`: one that throws is
reported as `Trigger#<id> Trigger.registerUnitInRange` and rejects the
unit.

#### Native

[TriggerRegisterUnitInRange](/typings/3.0.0/functions/TriggerRegisterUnitInRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitInRange))

***

### registerUnitStateEvent()

> **registerUnitStateEvent**(`whichUnit`, `whichState`, `opcode`, `limitval`): `Trigger`

Defined in: [handles/trigger.ts:1021](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1021)

Registers a unit state of one unit reaching a limit.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit whose state is watched.

##### whichState

`unitstate`

The state, such as `UNIT_STATE_LIFE`.

##### opcode

`limitop`

How the state compares with the limit, such as
`LESS_THAN`.

##### limitval

`number`

The value the state is compared with, in the state's
own unit, such as hit points for `UNIT_STATE_LIFE`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterUnitStateEvent](/typings/3.0.0/functions/TriggerRegisterUnitStateEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitStateEvent))

***

### registerUpgradeCommandEvent()

> **registerUpgradeCommandEvent**(`whichUpgrade`): `Trigger`

Defined in: [handles/trigger.ts:1044](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1044)

Registers a click on the command button of an upgrade.

#### Parameters

##### whichUpgrade

`Rawcode`\<`"upgrade"`\>

The upgrade's rawcode, such as Iron Forged Swords',
`FourCC("Rhme")`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterUpgradeCommandEvent](/typings/3.0.0/functions/TriggerRegisterUpgradeCommandEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUpgradeCommandEvent))

***

### registerVariableEvent()

> **registerVariableEvent**(`varName`, `opcode`, `limitval`): `Trigger`

Defined in: [handles/trigger.ts:1059](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1059)

Registers a global real variable, named as the map script names it,
reaching a limit.

#### Parameters

##### varName

`string`

The variable's name, such as `"udg_Score"`.

##### opcode

`limitop`

How the variable compares with the limit, such as
`EQUAL`.

##### limitval

`number`

The value the variable is compared with.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterVariableEvent](/typings/3.0.0/functions/TriggerRegisterVariableEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterVariableEvent))

***

### removeAction()

> **removeAction**(`action`): `Trigger`

Defined in: [handles/trigger.ts:1086](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1086)

Removes from the Trigger the actions `addAction(action)` added to it.

#### Parameters

##### action

`triggeraction` \| (() => `void`)

The function given to `addAction`, or a `triggeraction`
`TriggerAddAction` returned.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

- The same function added more than once is removed every time it was
  added.
- A function never added to this Trigger, or already removed, changes
  nothing.
- Called from inside the action it removes, the action finishes its run
  and does not run at the next firing.
- A `triggeraction` that `TriggerAddAction` returned when called directly
  goes to the Native as is.

#### Example

**Removing an action by the function added**

```ts
// A greeting that runs on the first chat message only: the action removes
// itself, by the function addAction was given.
import { Init, MapPlayer, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const first = MapPlayer.fromIndex(0);
  if (first === undefined) {
    return;
  }
  const trigger = Trigger.create().registerPlayerChatEvent(first, "", false);
  const greet = () => {
    print("Welcome!");
    trigger.removeAction(greet);
  };
  trigger.addAction(greet);
});
```

#### Native

[TriggerRemoveAction](/typings/3.0.0/functions/TriggerRemoveAction) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRemoveAction))

***

### removeActions()

> **removeActions**(): `Trigger`

Defined in: [handles/trigger.ts:1104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1104)

Removes every action of the Trigger; its events and conditions stay.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

A later `removeAction` of a function added before changes nothing.

#### Native

[TriggerClearActions](/typings/3.0.0/functions/TriggerClearActions) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerClearActions))

***

### removeCondition()

> **removeCondition**(`condition`): `Trigger`

Defined in: [handles/trigger.ts:1132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1132)

Removes from the Trigger the conditions `addCondition(condition)` added
to it.

#### Parameters

##### condition

[`BoolexprInput`](../type-aliases/BoolexprInput.md) \| `triggercondition`

The function or `boolexpr` given to `addCondition`,
or a `triggercondition` `TriggerAddCondition` returned.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

- The `Condition` the Trigger made for a function is destroyed with it.
  A `boolexpr` the caller passed is never destroyed: the caller owns it.
- Called from inside the condition it removes, the condition is removed
  at once and its `Condition` is destroyed when that evaluation returns,
  never while it runs. `removeConditions` and `destroy` do the same.
- The same value added more than once is removed every time it was
  added.
- A value never added to this Trigger, or already removed, changes
  nothing.
- A `triggercondition` that `TriggerAddCondition` returned when called
  directly goes to the Native as is, told from a `boolexpr` by its handle
  type.

#### Native

[TriggerRemoveCondition](/typings/3.0.0/functions/TriggerRemoveCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRemoveCondition))

#### Native

[DestroyCondition](/typings/3.0.0/functions/DestroyCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyCondition))

***

### removeConditions()

> **removeConditions**(): `Trigger`

Defined in: [handles/trigger.ts:1155](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1155)

Removes every condition of the Trigger, so its actions run each time it
fires; its events and actions stay.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Remarks

The `Condition`s the Trigger made for the functions `addCondition`
received are destroyed, and a later `removeCondition` of a value added
before changes nothing. A `boolexpr` the caller passed is left alone.

#### Native

[TriggerClearConditions](/typings/3.0.0/functions/TriggerClearConditions) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerClearConditions))

#### Native

[DestroyCondition](/typings/3.0.0/functions/DestroyCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyCondition))

***

### reset()

> **reset**(): `void`

Defined in: [handles/trigger.ts:1165](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1165)

Resets `evalCount` and `execCount` to zero.

#### Returns

`void`

#### Native

[ResetTrigger](/typings/3.0.0/functions/ResetTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetTrigger))

***

### create()

> `static` **create**(): `Trigger`

Defined in: [handles/trigger.ts:233](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L233)

Creates a Trigger with no event, condition or action.

#### Returns

`Trigger`

The new Trigger, enabled.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Trigger`, at the calling line. In Dev
mode also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateTrigger](/typings/3.0.0/functions/CreateTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTrigger))

***

### fromEvent()

> `static` **fromEvent**(): `Trigger` \| `undefined`

Defined in: [handles/trigger.ts:1175](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/trigger.ts#L1175)

Gets the Trigger whose condition or action is running.

#### Returns

`Trigger` \| `undefined`

The running Trigger, or `undefined` outside a Trigger's
condition or action.

#### Native

[GetTriggeringTrigger](/typings/3.0.0/functions/GetTriggeringTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggeringTrigger))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L195)

Gets the Wrapper for `handle`, making it on first use. The same Handle
always gives the same object; when the object cached for it is of a less
specific class than the one asked for (a `Timer` cached,
`MyTimer.fromHandle` asked), a new object of the class asked for replaces
it. `Unit.fromHandle(h)` is typed `Unit | undefined`.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper of the class it is called on.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

A Handle of the class's Native type.

#### Returns

`C` \| `undefined`

The Wrapper, or `undefined` when `handle` is undefined.

#### Remarks

It creates no Handle, so none of the creation Guards of Dev mode apply:
wrap a Handle that Native code outside the library returned.

#### Inherited from

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)
