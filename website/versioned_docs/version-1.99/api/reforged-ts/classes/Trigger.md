# Class: Trigger

Defined in: [handles/trigger.ts:84](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L84)

A game trigger: when one of the events registered on it fires, it
evaluates its conditions, and runs its actions when they all hold.

## Remarks

- `on()` creates one Trigger per handler from an Event descriptor, with a
  typed payload. Use a Trigger directly for an event no descriptor covers,
  or for several events sharing one action.
- The `register*` members, `addAction` and `addCondition` return the
  Trigger, so calls chain. An event cannot be unregistered: disable the
  Trigger or destroy it.
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

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

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

Defined in: [handles/trigger.ts:118](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L118)

Gets whether the Trigger responds to its events.

##### Native

[IsTriggerEnabled](/typings/3.0.0/functions/IsTriggerEnabled) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTriggerEnabled))

##### Returns

`boolean`

True unless it was disabled; a new Trigger is enabled.

#### Set Signature

> **set** **enabled**(`flag`): `void`

Defined in: [handles/trigger.ts:105](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L105)

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

Defined in: [handles/trigger.ts:128](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L128)

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

Defined in: [handles/trigger.ts:149](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L149)

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

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L148)

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

Defined in: [handles/trigger.ts:161](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L161)

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

Defined in: [handles/trigger.ts:182](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L182)

Gets whether an `execWait` made by the Trigger's actions waits for the
sleeps of the Trigger it runs.

##### Native

[IsTriggerWaitOnSleeps](/typings/3.0.0/functions/IsTriggerWaitOnSleeps) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTriggerWaitOnSleeps))

##### Returns

`boolean`

The value `waitOnSleeps` was last set to.

#### Set Signature

> **set** **waitOnSleeps**(`flag`): `void`

Defined in: [handles/trigger.ts:172](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L172)

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

Defined in: [handles/trigger.ts:138](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L138)

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

Defined in: [handles/trigger.ts:203](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L203)

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
- The `triggeraction` the Native returns is not kept, so `removeAction`
  cannot remove this action: `removeActions` removes every action.

#### Native

[TriggerAddAction](/typings/3.0.0/functions/TriggerAddAction) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerAddAction))

***

### addCondition()

> **addCondition**(`condition`): `Trigger`

Defined in: [handles/trigger.ts:234](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L234)

Adds a condition the Trigger evaluates when it fires: its actions run
only when every condition returns true. A condition is a `boolexpr`, or
a function the Trigger wraps with `Condition`.

#### Parameters

##### condition

`boolexpr` \| (() => `boolean`)

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
- The `triggercondition` the Native returns is not kept, so
  `removeCondition` cannot remove this condition: `removeConditions`
  removes every condition.

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

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/trigger.ts:288](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L288)

Destroys the Trigger through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyTrigger](/typings/3.0.0/functions/DestroyTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTrigger))

#### Bug

Destroying the Trigger that is running, while waits are involved,
can corrupt the handle stack:
http://www.wc3c.net/showthread.php?t=110519.

***

### eval()

> **eval**(): `boolean`

Defined in: [handles/trigger.ts:308](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L308)

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

Defined in: [handles/trigger.ts:320](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L320)

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

Defined in: [handles/trigger.ts:332](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L332)

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

Defined in: [handles/trigger.ts:343](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L343)

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

Defined in: [handles/trigger.ts:358](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L358)

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

Defined in: [handles/trigger.ts:378](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L378)

Registers a click on the command button of an ability, identified by
the ability and its order string.

#### Parameters

##### whichAbility

`number`

The ability's rawcode, such as `FourCC("AHbz")`.

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

Defined in: [handles/trigger.ts:390](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L390)

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

Defined in: [handles/trigger.ts:402](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L402)

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

Defined in: [handles/trigger.ts:414](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L414)

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

Defined in: [handles/trigger.ts:432](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L432)

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

Defined in: [handles/trigger.ts:458](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L458)

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

Defined in: [handles/trigger.ts:480](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L480)

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

Defined in: [handles/trigger.ts:491](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L491)

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

Defined in: [handles/trigger.ts:506](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L506)

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

Defined in: [handles/trigger.ts:528](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L528)

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

Defined in: [handles/trigger.ts:548](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L548)

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

Defined in: [handles/trigger.ts:570](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L570)

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

Defined in: [handles/trigger.ts:592](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L592)

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

Defined in: [handles/trigger.ts:616](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L616)

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

Defined in: [handles/trigger.ts:640](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L640)

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

Defined in: [handles/trigger.ts:663](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L663)

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

Defined in: [handles/trigger.ts:689](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L689)

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

Defined in: [handles/trigger.ts:719](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L719)

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

Defined in: [handles/trigger.ts:746](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L746)

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

Defined in: [handles/trigger.ts:757](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L757)

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

Defined in: [handles/trigger.ts:769](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L769)

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

Defined in: [handles/trigger.ts:781](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L781)

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

Defined in: [handles/trigger.ts:796](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L796)

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

Defined in: [handles/trigger.ts:817](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L817)

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

Defined in: [handles/trigger.ts:842](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L842)

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

Defined in: [handles/trigger.ts:864](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L864)

Registers a click on the command button of an upgrade.

#### Parameters

##### whichUpgrade

`number`

The upgrade's rawcode, such as `FourCC("Rhme")`.

#### Returns

`Trigger`

The Trigger, for chaining.

#### Native

[TriggerRegisterUpgradeCommandEvent](/typings/3.0.0/functions/TriggerRegisterUpgradeCommandEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUpgradeCommandEvent))

***

### registerVariableEvent()

> **registerVariableEvent**(`varName`, `opcode`, `limitval`): `Trigger`

Defined in: [handles/trigger.ts:879](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L879)

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

> **removeAction**(`whichAction`): `void`

Defined in: [handles/trigger.ts:896](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L896)

Removes one action from the Trigger.

#### Parameters

##### whichAction

`triggeraction`

The action, as `TriggerAddAction` returned it.

#### Returns

`void`

#### Remarks

`addAction` does not return the `triggeraction` this takes: only an
action added with `TriggerAddAction` directly can be removed.

#### Native

[TriggerRemoveAction](/typings/3.0.0/functions/TriggerRemoveAction) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRemoveAction))

***

### removeActions()

> **removeActions**(): `void`

Defined in: [handles/trigger.ts:904](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L904)

Removes every action of the Trigger; its events and conditions stay.

#### Returns

`void`

#### Native

[TriggerClearActions](/typings/3.0.0/functions/TriggerClearActions) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerClearActions))

***

### removeCondition()

> **removeCondition**(`whichCondition`): `void`

Defined in: [handles/trigger.ts:917](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L917)

Removes one condition from the Trigger.

#### Parameters

##### whichCondition

`triggercondition`

The condition, as `TriggerAddCondition` returned
it.

#### Returns

`void`

#### Remarks

`addCondition` does not return the `triggercondition` this takes: only a
condition added with `TriggerAddCondition` directly can be removed.

#### Native

[TriggerRemoveCondition](/typings/3.0.0/functions/TriggerRemoveCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRemoveCondition))

***

### removeConditions()

> **removeConditions**(): `void`

Defined in: [handles/trigger.ts:926](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L926)

Removes every condition of the Trigger, so its actions run each time it
fires; its events and actions stay.

#### Returns

`void`

#### Native

[TriggerClearConditions](/typings/3.0.0/functions/TriggerClearConditions) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerClearConditions))

***

### reset()

> **reset**(): `void`

Defined in: [handles/trigger.ts:934](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L934)

Resets `evalCount` and `execCount` to zero.

#### Returns

`void`

#### Native

[ResetTrigger](/typings/3.0.0/functions/ResetTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetTrigger))

***

### create()

> `static` **create**(): `Trigger`

Defined in: [handles/trigger.ts:94](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L94)

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

Defined in: [handles/trigger.ts:944](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trigger.ts#L944)

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

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L195)

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
