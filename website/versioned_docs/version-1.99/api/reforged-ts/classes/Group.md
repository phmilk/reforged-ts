# Class: Group

Defined in: [handles/group.ts:23](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L23)

A set of units: the result of an enumeration, by area, owner or type, and
a way to order its units together.

## Remarks

A group keeps holding a unit that was removed from the game, such as a
decayed corpse, until the group is cleared or refilled.

## Example

**Collecting units and ordering them together**

```ts
// Three footmen gathered in a group, counted, and sent together to the east
// a second after the game starts.
import { Group, Init, Timer, tsGlobals, Unit } from "reforged-ts";

Init.onTriggers(() => {
  const squad = Group.create();
  for (const x of [0, 64, 128]) {
    squad.addUnit(Unit.create(tsGlobals.Players[0], FourCC("hfoo"), x, 0));
  }
  print(`${String(squad.size)} footmen`);

  for (const footman of squad.getUnits()) {
    print(`Footman ${String(footman.id)} joins the squad`);
  }

  Timer.after(1, () => {
    squad.orderCoords(tsGlobals.OrderId.Move, 1024, 0);
  });
});
```

## Native

[group](/typings/3.0.0/interfaces/group) ([jassbot](https://lep.duckdns.org/jassbot/doc/group))

## Extends

- [`Handle`](Handle.md)\<`group`\>

## Properties

### handle

> `readonly` **handle**: `group`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### first

#### Get Signature

> **get** **first**(): [`Unit`](Unit.md) \| `undefined`

Defined in: [handles/group.ts:374](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L374)

Gets the unit at the head of the group.

##### Native

[FirstOfGroup](/typings/3.0.0/functions/FirstOfGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/FirstOfGroup))

##### Bug

Gives `undefined` while the group still holds units when its head
is a unit removed from the game, such as a decayed corpse: the group
keeps that dead entry until it is cleared. The GroupUtils thread on wc3c
covers it: http://wc3c.net/showthread.php?t=104464.

##### Returns

[`Unit`](Unit.md) \| `undefined`

The first unit, or `undefined` when the group is empty.

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

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [handles/group.ts:384](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L384)

Counts the units the group holds.

##### Native

[BlzGroupGetSize](/typings/3.0.0/functions/BlzGroupGetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGroupGetSize))

##### Returns

`number`

The unit count, 0 for an empty group; `getUnitAt` takes the
positions 0 to `size - 1`.

## Methods

### addGroupFast()

> **addGroupFast**(`source`): `number`

Defined in: [handles/group.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L48)

Adds every unit of `source` to this group, in one Native call; `source`
is left as it was.

#### Parameters

##### source

`Group`

The group whose units are added.

#### Returns

`number`

The number of units added, or 0 on an error.

#### Remarks

The Native adds the units of its first group to its second, so the
member passes `source` first. In w3ts 3.x it passed this group first:
`a.addGroupFast(b)` added the units of `a` to `b`.

#### Native

[BlzGroupAddGroupFast](/typings/3.0.0/functions/BlzGroupAddGroupFast) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGroupAddGroupFast))

***

### addUnit()

> **addUnit**(`whichUnit`): `boolean`

Defined in: [handles/group.ts:59](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L59)

Adds a unit at the end of the group.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit to add.

#### Returns

`boolean`

True when the group gained the unit; false when the unit was in
it already, or the group is destroyed.

#### Native

[GroupAddUnit](/typings/3.0.0/functions/GroupAddUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupAddUnit))

***

### clear()

> **clear**(): `void`

Defined in: [handles/group.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L67)

Removes every unit from the group.

#### Returns

`void`

#### Native

[GroupClear](/typings/3.0.0/functions/GroupClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupClear))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/group.ts:82](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L82)

Destroys the Group through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
freed on one client desyncs the game.

#### Native

[DestroyGroup](/typings/3.0.0/functions/DestroyGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyGroup))

***

### enumUnitsInRange()

> **enumUnitsInRange**(`x`, `y`, `radius`, `filter`): `void`

Defined in: [handles/group.ts:100](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L100)

Fills the group with the units within `radius` of a point.

#### Parameters

##### x

`number`

The x-coordinate of the center, in world units.

##### y

`number`

The y-coordinate of the center, in world units.

##### radius

`number`

The radius, in world units.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRange](/typings/3.0.0/functions/GroupEnumUnitsInRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRange))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumUnitsInRangeCounted()

> **enumUnitsInRangeCounted**(`x`, `y`, `radius`, `filter`, `countLimit`): `void`

Defined in: [handles/group.ts:131](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L131)

Fills the group with at most `countLimit` of the units within `radius`
of a point.

#### Parameters

##### x

`number`

The x-coordinate of the center, in world units.

##### y

`number`

The y-coordinate of the center, in world units.

##### radius

`number`

The radius, in world units.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

##### countLimit

`number`

The most units the group receives.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRangeCounted](/typings/3.0.0/functions/GroupEnumUnitsInRangeCounted) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRangeCounted))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

#### Bug

Its behaviour turns erratic with large numbers.

***

### enumUnitsInRangeOfPoint()

> **enumUnitsInRangeOfPoint**(`whichPoint`, `radius`, `filter`): `void`

Defined in: [handles/group.ts:160](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L160)

Fills the group with the units within `radius` of a Point.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The center of the circle searched.

##### radius

`number`

The radius, in world units.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRangeOfLoc](/typings/3.0.0/functions/GroupEnumUnitsInRangeOfLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRangeOfLoc))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumUnitsInRangeOfPointCounted()

> **enumUnitsInRangeOfPointCounted**(`whichPoint`, `radius`, `filter`, `countLimit`): `void`

Defined in: [handles/group.ts:188](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L188)

Fills the group with at most `countLimit` of the units within `radius`
of a Point.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The center of the circle searched.

##### radius

`number`

The radius, in world units.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

##### countLimit

`number`

The most units the group receives.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRangeOfLocCounted](/typings/3.0.0/functions/GroupEnumUnitsInRangeOfLocCounted) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRangeOfLocCounted))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

#### Bug

Its behaviour turns erratic with large numbers.

***

### enumUnitsInRect()

> **enumUnitsInRect**(`r`, `filter`): `void`

Defined in: [handles/group.ts:214](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L214)

Fills the group with the units inside a Rectangle.

#### Parameters

##### r

[`Rectangle`](Rectangle.md)

The area to search.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRect](/typings/3.0.0/functions/GroupEnumUnitsInRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRect))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumUnitsInRectCounted()

> **enumUnitsInRectCounted**(`r`, `filter`, `countLimit`): `void`

Defined in: [handles/group.ts:236](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L236)

Fills the group with at most `countLimit` of the units inside a
Rectangle.

#### Parameters

##### r

[`Rectangle`](Rectangle.md)

The area to search.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

##### countLimit

`number`

The most units the group receives.

#### Returns

`void`

#### Remarks

Clears the group first: it holds only the units found afterwards.

#### Native

[GroupEnumUnitsInRectCounted](/typings/3.0.0/functions/GroupEnumUnitsInRectCounted) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsInRectCounted))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

#### Bug

Its behaviour turns erratic with large numbers.

***

### enumUnitsOfPlayer()

> **enumUnitsOfPlayer**(`whichPlayer`, `filter`): `void`

Defined in: [handles/group.ts:260](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L260)

Fills the group with the units a player owns.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose units to collect.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

Units with the Locust ability are included, unlike the
enumerations by area.

#### Native

[GroupEnumUnitsOfPlayer](/typings/3.0.0/functions/GroupEnumUnitsOfPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsOfPlayer))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumUnitsOfType()

> **enumUnitsOfType**(`unitName`, `filter`): `void`

Defined in: [handles/group.ts:287](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L287)

Fills the group with the units of one unit type, found by its internal
name.

#### Parameters

##### unitName

`string`

The type's internal name, such as `"footman"`; a
custom type's is `"custom_"` followed by its rawcode, such as
`"custom_h000"`.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

- Clears the group first: it holds only the units found afterwards.
- Units with the Locust ability are included, unlike the enumerations by
  area.

#### Native

[GroupEnumUnitsOfType](/typings/3.0.0/functions/GroupEnumUnitsOfType) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsOfType))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumUnitsOfTypeCounted()

> **enumUnitsOfTypeCounted**(`unitName`, `filter`, `countLimit`): `void`

Defined in: [handles/group.ts:313](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L313)

Fills the group with at most `countLimit` of the units of one unit type,
found by its internal name.

#### Parameters

##### unitName

`string`

The type's internal name, such as `"footman"`; a
custom type's is `"custom_"` followed by its rawcode, such as
`"custom_h000"`.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

##### countLimit

`number`

The most units the group receives.

#### Returns

`void`

#### Remarks

- Clears the group first: it holds only the units found afterwards.
- Units with the Locust ability are included, unlike the enumerations by
  area.

#### Native

[GroupEnumUnitsOfTypeCounted](/typings/3.0.0/functions/GroupEnumUnitsOfTypeCounted) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsOfTypeCounted))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

#### Bug

Its behaviour turns erratic with large numbers.

***

### enumUnitsSelected()

> **enumUnitsSelected**(`whichPlayer`, `filter`): `void`

Defined in: [handles/group.ts:338](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L338)

Fills the group with the units a player has selected.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose selection is read.

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a unit when it returns true; inside it,
`Unit.fromFilter()` gives the unit. A plain function is wrapped in a
`Filter` for the call.

#### Returns

`void`

#### Remarks

The game knows another client's selection only as last synchronized:
call `SyncSelections` first for an up-to-date one.

#### Native

[GroupEnumUnitsSelected](/typings/3.0.0/functions/GroupEnumUnitsSelected) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupEnumUnitsSelected))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### for()

> **for**(`callback`): `void`

Defined in: [handles/group.ts:360](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L360)

Runs `callback` once per unit of the group, `Unit.fromEnum()` answering
that unit.

#### Parameters

##### callback

() => `void`

Runs once per unit, before `for` returns.

#### Returns

`void`

#### Remarks

In Dev mode the callback runs under `pcall`: a call that throws
is reported as `Group#<id> Group.for` and the enumeration continues with
the next unit. With Dev mode off `ForGroup` receives `callback` itself.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`:
`reforged-ts: Group.for inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[ForGroup](/typings/3.0.0/functions/ForGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForGroup))

***

### getUnitAt()

> **getUnitAt**(`index`): [`Unit`](Unit.md) \| `undefined`

Defined in: [handles/group.ts:414](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L414)

Gets the unit at one position of the group.

#### Parameters

##### index

`number`

The position, from 0 to `size - 1`.

#### Returns

[`Unit`](Unit.md) \| `undefined`

The unit, or `undefined` when `index` is out of range or the
unit there was removed from the game.

#### Native

[BlzGroupUnitAt](/typings/3.0.0/functions/BlzGroupUnitAt) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGroupUnitAt))

***

### getUnits()

> **getUnits**(): [`Unit`](Unit.md)[]

Defined in: [handles/group.ts:396](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L396)

Gets the units of the group, in the group's order.

#### Returns

[`Unit`](Unit.md)[]

A new array, which later changes to the group do not affect.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`, as `for`
does.

#### Native

[ForGroup](/typings/3.0.0/functions/ForGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForGroup))

#### Native

[GetEnumUnit](/typings/3.0.0/functions/GetEnumUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumUnit))

***

### hasUnit()

> **hasUnit**(`whichUnit`): `boolean`

Defined in: [handles/group.ts:424](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L424)

Tests whether a unit is in the group.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit to look for.

#### Returns

`boolean`

True when the group holds the unit.

#### Native

[IsUnitInGroup](/typings/3.0.0/functions/IsUnitInGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInGroup))

***

### orderCoords()

> **orderCoords**(`order`, `x`, `y`): `void`

Defined in: [handles/group.ts:437](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L437)

Orders every unit of the group to a point given by its coordinates.

#### Parameters

##### order

`string` \| `number`

The order's name, such as `"move"`, or its id, such as
one of `tsGlobals.OrderId`.

##### x

`number`

The target's x-coordinate, in world units.

##### y

`number`

The target's y-coordinate, in world units.

#### Returns

`void`

#### Native

[GroupPointOrder](/typings/3.0.0/functions/GroupPointOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupPointOrder))

#### Native

[GroupPointOrderById](/typings/3.0.0/functions/GroupPointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupPointOrderById))

***

### orderImmediate()

> **orderImmediate**(`order`): `void`

Defined in: [handles/group.ts:453](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L453)

Gives every unit of the group an order that takes no target, such as
`"stop"`.

#### Parameters

##### order

`string` \| `number`

The order's name, such as `"move"`, or its id, such as
one of `tsGlobals.OrderId`.

#### Returns

`void`

#### Native

[GroupImmediateOrder](/typings/3.0.0/functions/GroupImmediateOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupImmediateOrder))

#### Native

[GroupImmediateOrderById](/typings/3.0.0/functions/GroupImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupImmediateOrderById))

***

### orderPoint()

> **orderPoint**(`order`, `whichPoint`): `void`

Defined in: [handles/group.ts:469](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L469)

Orders every unit of the group to a Point.

#### Parameters

##### order

`string` \| `number`

The order's name, such as `"move"`, or its id, such as
one of `tsGlobals.OrderId`.

##### whichPoint

[`Point`](Point.md)

The point the order targets.

#### Returns

`void`

#### Native

[GroupPointOrderLoc](/typings/3.0.0/functions/GroupPointOrderLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupPointOrderLoc))

#### Native

[GroupPointOrderByIdLoc](/typings/3.0.0/functions/GroupPointOrderByIdLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupPointOrderByIdLoc))

***

### orderTarget()

> **orderTarget**(`order`, `targetWidget`): `void`

Defined in: [handles/group.ts:486](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L486)

Orders every unit of the group to target a unit, an item or a
destructable.

#### Parameters

##### order

`string` \| `number`

The order's name, such as `"move"`, or its id, such as
one of `tsGlobals.OrderId`.

##### targetWidget

[`Widget`](Widget.md) \| [`Unit`](Unit.md)

The unit, item or destructable the order targets.

#### Returns

`void`

#### Native

[GroupTargetOrder](/typings/3.0.0/functions/GroupTargetOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupTargetOrder))

#### Native

[GroupTargetOrderById](/typings/3.0.0/functions/GroupTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupTargetOrderById))

***

### removeGroupFast()

> **removeGroupFast**(`source`): `number`

Defined in: [handles/group.ts:505](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L505)

Removes every unit of `source` from this group, in one Native call;
`source` is left as it was.

#### Parameters

##### source

`Group`

The group whose units are removed.

#### Returns

`number`

The number of units removed, or 0 on an error.

#### Remarks

The Native removes the units of its first group from its second, so the
member passes `source` first. In w3ts 3.x it passed this group first:
`a.removeGroupFast(b)` removed the units of `a` from `b`.

#### Native

[BlzGroupRemoveGroupFast](/typings/3.0.0/functions/BlzGroupRemoveGroupFast) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGroupRemoveGroupFast))

***

### removeUnit()

> **removeUnit**(`whichUnit`): `boolean`

Defined in: [handles/group.ts:516](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L516)

Removes a unit from the group.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit to remove.

#### Returns

`boolean`

True when the unit was removed; false when it was not in the
group.

#### Native

[GroupRemoveUnit](/typings/3.0.0/functions/GroupRemoveUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GroupRemoveUnit))

***

### create()

> `static` **create**(): `Group`

Defined in: [handles/group.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/group.ts#L33)

Creates an empty group.

#### Returns

`Group`

The new group.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Group`, at the calling line. In Dev mode,
also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateGroup](/typings/3.0.0/functions/CreateGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateGroup))

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
