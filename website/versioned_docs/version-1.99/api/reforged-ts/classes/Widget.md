# Class: Widget

Defined in: [handles/widget.ts:13](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L13)

A game object that has hit points and a position: a unit, an item or a
destructable. The base of `Unit`, `Item` and `Destructable`, and what a
Native taking any of them (a death event, a target order) gives back.

## Example

**Reacting to the death of a unit or a destructable alike**

```ts
// One death handler for a unit and a tree: both are widgets, so the Trigger
// takes either, and Widget.fromEvent reads the one that died.
import {
  Destructable,
  Init,
  Trigger,
  tsGlobals,
  Unit,
  Widget,
} from "reforged-ts";

Init.onTriggers(() => {
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });

  const trigger = Trigger.create()
    .registerDeathEvent(footman)
    .registerDeathEvent(tree);
  trigger.addAction(() => {
    const widget = Widget.fromEvent();
    if (widget !== undefined) {
      print(`Died at ${String(widget.x)}, ${String(widget.y)}`);
    }
  });
});
```

## Native

[widget](/typings/3.0.0/interfaces/widget) ([jassbot](https://lep.duckdns.org/jassbot/doc/widget))

## Extends

- [`Handle`](Handle.md)\<`widget`\>

## Extended by

- [`Destructable`](Destructable.md)
- [`Item`](Item.md)
- [`Unit`](Unit.md)

## Properties

### handle

> `readonly` **handle**: `widget`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

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

#### Inherited from

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### life

#### Get Signature

> **get** **life**(): `number`

Defined in: [handles/widget.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L19)

Gets how many hit points the widget has left.

##### Native

[GetWidgetLife](/typings/3.0.0/functions/GetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetLife))

##### Returns

`number`

The hit points left, an amount rather than a percentage.

#### Set Signature

> **set** **life**(`value`): `void`

Defined in: [handles/widget.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L27)

The widget's current hit points, an amount rather than a percentage.

##### Native

[SetWidgetLife](/typings/3.0.0/functions/SetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetWidgetLife))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/widget.ts:36](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L36)

Gets the x-coordinate of the widget's position.

##### Native

[GetWidgetX](/typings/3.0.0/functions/GetWidgetX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetX))

##### Returns

`number`

The x-coordinate, in world units.

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/widget.ts:45](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L45)

Gets the y-coordinate of the widget's position.

##### Native

[GetWidgetY](/typings/3.0.0/functions/GetWidgetY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetY))

##### Returns

`number`

The y-coordinate, in world units.

## Methods

### addIndicator()

> **addIndicator**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/widget.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L57)

Adds a colored indicator to the widget, through `AddIndicator`.

#### Parameters

##### red

`number`

The red channel, from 0 to 255.

##### green

`number`

The green channel, from 0 to 255.

##### blue

`number`

The blue channel, from 0 to 255.

##### alpha

`number`

The alpha channel, from 0 to 255.

#### Returns

`void`

#### Native

[AddIndicator](/typings/3.0.0/functions/AddIndicator) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddIndicator))

***

### fromEvent()

> `static` **fromEvent**(): `Widget` \| `undefined`

Defined in: [handles/widget.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L67)

Gets the widget a trigger event is about, such as the one that died in
a death event (`Trigger.registerDeathEvent`).

#### Returns

`Widget` \| `undefined`

The widget, or `undefined` outside an event about one.

#### Native

[GetTriggerWidget](/typings/3.0.0/functions/GetTriggerWidget) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerWidget))

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

***

### fromOrderTarget()

> `static` **fromOrderTarget**(): `Widget` \| `undefined`

Defined in: [handles/widget.ts:77](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L77)

Gets the target of the order being issued.

#### Returns

`Widget` \| `undefined`

The unit, item or destructable the order targets, or
`undefined` outside a target order.

#### Native

[GetOrderTarget](/typings/3.0.0/functions/GetOrderTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderTarget))
