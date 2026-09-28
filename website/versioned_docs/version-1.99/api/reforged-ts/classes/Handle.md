# Abstract Class: Handle\<T\>

Defined in: [handles/handle.ts:125](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L125)

The Handle base: every Wrapper extends it, directly or through another
Wrapper. It holds the registry (one Wrapper object per Handle), the
wrapping logic and the creation helper, and applies one error rule:
creation throws, lookup returns undefined.

A Wrapper declares no public constructor. The base's protected constructor
takes the Handle and only stores it. A field set from a creation argument
(`Effect.attachWidget`, `GameCache.filename`) is a `readonly` field filled
through `expect`'s `init`, with no constructor; a Wrapper declares a
protected constructor taking the Handle and calling `super(handle)` only
for fields that need initialisers or other constructor work.

Its lookups return `this.fromHandle(Native(...))`, typed `X | undefined`;
its creation members return `this.expect(Native(...), detail)`, typed `X`.
A member whose Native allocates another Wrapper's Handle calls that
Wrapper's protected `expect`: `return Point.expect(GetUnitLoc(this.handle))`.
An event lookup whose Native allocates a new Handle on each call, and
returns nothing outside its event (`Point.fromOrderPoint`), is a creation
typed `X | undefined`: it returns `this.fromAllocated(Native())`, which
returns undefined for nothing and otherwise counts and guards the Wrapper
as `expect` does.
Two exceptions to "lookups go through `fromHandle`":

- The documented non-null path: `unit.getOwner()` and
  `MapPlayer.fromLocal()` read an existing Handle but assert an invariant
  the Typings cannot express (a live unit has an owner, `GetLocalPlayer`
  never returns nothing) through `expectFound`, so they are typed
  non-null and, should the game break the invariant, throw the standard
  message (`reforged-ts: failed to create MapPlayer`); being lookups, they
  skip the Dev-mode creation Guards and are not counted as creations.
  Each says why in its doc comment; no other lookup does this.
- `Frame` overrides `fromHandle`, because the game's "not found" frame has
  handle id 0.

Naming rule: a Wrapper class is named after its Native type, capitalised
(`timer` is `Timer`, `unit` is `Unit`), unless that name collides with a
Native function; then it takes a descriptive noun instead (`rect` is
`Rectangle`, because `Rect` is a Native; `player` is `MapPlayer`, because
`Player` is one).

## Example

**Wrapping a Handle a Native returned**

```ts
// A group made by a Native call outside the library, wrapped afterwards: the
// same Handle always gives the same Wrapper, so either path reaches it.
import { Group, Init } from "reforged-ts";

Init.onTriggers(() => {
  const raw = CreateGroup();
  const group = Group.fromHandle(raw);
  if (group !== undefined && Group.fromHandle(raw) === group) {
    print(`Group ${String(group.id)} wraps the Handle once`);
  }
});
```

## Native

[handle](/typings/3.0.0/interfaces/handle) ([jassbot](https://lep.duckdns.org/jassbot/doc/handle))

## Extended by

- [`CameraSetup`](CameraSetup.md)
- [`DialogButton`](DialogButton.md)
- [`Dialog`](Dialog.md)
- [`Effect`](Effect.md)
- [`FogModifier`](FogModifier.md)
- [`Force`](Force.md)
- [`Frame`](Frame.md)
- [`GameCache`](GameCache.md)
- [`Group`](Group.md)
- [`Image`](Image.md)
- [`Leaderboard`](Leaderboard.md)
- [`MultiboardItem`](MultiboardItem.md)
- [`Multiboard`](Multiboard.md)
- [`MapPlayer`](MapPlayer.md)
- [`Point`](Point.md)
- [`QuestItem`](QuestItem.md)
- [`Quest`](Quest.md)
- [`Rectangle`](Rectangle.md)
- [`Region`](Region.md)
- [`Sound`](Sound.md)
- [`TextTag`](TextTag.md)
- [`Timer`](Timer.md)
- [`TimerDialog`](TimerDialog.md)
- [`Trackable`](Trackable.md)
- [`Trigger`](Trigger.md)
- [`Ubersplat`](Ubersplat.md)
- [`WeatherEffect`](WeatherEffect.md)
- [`Widget`](Widget.md)

## Type Parameters

### T

`T` *extends* `handle`

The Native Handle type the Wrapper owns.

## Properties

### handle

> `readonly` **handle**: `T`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

## Accessors

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

## Methods

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

`C` *extends* `Handle`\<`handle`\>

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
