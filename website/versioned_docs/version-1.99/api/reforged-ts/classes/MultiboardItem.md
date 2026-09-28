# Class: MultiboardItem

Defined in: [handles/multiboard.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L16)

One cell of a [Multiboard](Multiboard.md): the handle through which its text, icon,
colour and width are set.

## Remarks

Every [MultiboardItem.create](#create) returns a new handle, even for a cell
that already has one: [MultiboardItem.destroy](#destroy) releases it when done,
and the cell keeps what was set.

## Example

**Filling the cells of a multiboard**

```ts
// A two-column table, a player's name and their gold, one row per player
// slot in use. The game shows no multiboard during map initialization, so a
// Timer builds it once the game runs.
import { Init, MapPlayer, Multiboard, Timer, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  Timer.after(0, () => {
    const players: MapPlayer[] = tsGlobals.Players.filter(
      (player) => player.slotState === PLAYER_SLOT_STATE_PLAYING,
    );
    const board = Multiboard.create();
    board.title = "Gold";
    board.columns = 2;
    // The row count is safe to change by one at a time.
    for (let row = 1; row <= players.length; row++) {
      board.rows = row;
    }
    board.setItemsStyle(true, false);

    players.forEach((player, index) => {
      const name = board.createItem(index + 1, 1);
      name.setValue(player.name);
      name.setWidth(0.1);
      name.destroy();

      const gold = board.createItem(index + 1, 2);
      gold.setValue(String(player.getState(PLAYER_STATE_RESOURCE_GOLD)));
      gold.setValueColor(255, 204, 0, 255);
      gold.destroy();
    });

    board.display(true);
  });
});
```

## Native

[multiboarditem](/typings/3.0.0/interfaces/multiboarditem) ([jassbot](https://lep.duckdns.org/jassbot/doc/multiboarditem))

## Extends

- [`Handle`](Handle.md)\<`multiboarditem`\>

## Properties

### handle

> `readonly` **handle**: `multiboarditem`

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

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [handles/multiboard.ts:45](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L45)

Releases the MultiboardItem's handle through its Native; the cell keeps
its text, icon and style.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[MultiboardReleaseItem](/typings/3.0.0/functions/MultiboardReleaseItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardReleaseItem))

***

### setIcon()

> **setIcon**(`icon`): `void`

Defined in: [handles/multiboard.ts:56](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L56)

Sets the icon shown in the cell.

#### Parameters

##### icon

`string`

The path of the icon's texture, such as
`"ReplaceableTextures\\CommandButtons\\BTNFootman.blp"`.

#### Returns

`void`

#### Native

[MultiboardSetItemIcon](/typings/3.0.0/functions/MultiboardSetItemIcon) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemIcon))

***

### setStyle()

> **setStyle**(`showValue`, `showIcon`): `void`

Defined in: [handles/multiboard.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L67)

Chooses whether the cell shows its text and its icon; a hidden part is
kept, not erased.

#### Parameters

##### showValue

`boolean`

Whether the text shows.

##### showIcon

`boolean`

Whether the icon shows.

#### Returns

`void`

#### Native

[MultiboardSetItemStyle](/typings/3.0.0/functions/MultiboardSetItemStyle) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemStyle))

***

### setValue()

> **setValue**(`val`): `void`

Defined in: [handles/multiboard.ts:76](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L76)

Sets the text shown in the cell; text wider than the cell is cut off.

#### Parameters

##### val

`string`

The text to show, colour codes included.

#### Returns

`void`

#### Native

[MultiboardSetItemValue](/typings/3.0.0/functions/MultiboardSetItemValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemValue))

***

### setValueColor()

> **setValueColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/multiboard.ts:88](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L88)

Sets the colour of the cell's text; a colour code in the text wins over it.

#### Parameters

##### red

`number`

The red component, from 0 to 255.

##### green

`number`

The green component, from 0 to 255.

##### blue

`number`

The blue component, from 0 to 255.

##### alpha

`number`

The opacity, from 0 to 255; the game ignores it, so pass 255.

#### Returns

`void`

#### Native

[MultiboardSetItemValueColor](/typings/3.0.0/functions/MultiboardSetItemValueColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemValueColor))

***

### setWidth()

> **setWidth**(`width`): `void`

Defined in: [handles/multiboard.ts:106](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L106)

Sets the cell's width.

#### Parameters

##### width

`number`

The width, as a fraction of the screen's width: 0.03, the
default, fits a few characters; 1 is the whole screen.

#### Returns

`void`

#### Remarks

The board's width follows the cells of its first row only, and it is
redrawn at the new width only once it is displayed or minimized again.

#### Native

[MultiboardSetItemWidth](/typings/3.0.0/functions/MultiboardSetItemWidth) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemWidth))

***

### create()

> `static` **create**(`board`, `x`, `y`): `MultiboardItem`

Defined in: [handles/multiboard.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L27)

Gets a handle to one cell of a multiboard.

#### Parameters

##### board

[`Multiboard`](Multiboard.md)

The multiboard that holds the cell.

##### x

`number`

The cell's row, counted from 1 at the top.

##### y

`number`

The cell's column, counted from 1 on the left.

#### Returns

`MultiboardItem`

A new handle to the cell.

#### Throws

When the game returns no handle: `reforged-ts: failed to create MultiboardItem`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[MultiboardGetItem](/typings/3.0.0/functions/MultiboardGetItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardGetItem))

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
