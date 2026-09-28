# Class: Multiboard

Defined in: [handles/multiboard.ts:122](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L122)

A table in the top-right corner of the screen, with a title and rows and
columns of cells that each show a text and an icon.

## Remarks

Only one multiboard shows at a time, and none during map initialization:
display it from a Timer once the game runs. Each cell is reached through a
[MultiboardItem](MultiboardItem.md).

## Example

**A score table, one row per player**

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

[multiboard](/typings/3.0.0/interfaces/multiboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/multiboard))

## Extends

- [`Handle`](Handle.md)\<`multiboard`\>

## Properties

### handle

> `readonly` **handle**: `multiboard`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### columns

#### Get Signature

> **get** **columns**(): `number`

Defined in: [handles/multiboard.ts:141](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L141)

The number of columns of cells, 0 on a new board.

##### Native

[MultiboardGetColumnCount](/typings/3.0.0/functions/MultiboardGetColumnCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardGetColumnCount))

##### Returns

`number`

The column count: a cell's column runs from 1 to it.

#### Set Signature

> **set** **columns**(`count`): `void`

Defined in: [handles/multiboard.ts:150](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L150)

The number of columns of cells: `createItem` reaches the columns 1 to
this count, so set it before filling the cells.

##### Native

[MultiboardSetColumnCount](/typings/3.0.0/functions/MultiboardSetColumnCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetColumnCount))

##### Parameters

###### count

`number`

##### Returns

`void`

***

### displayed

#### Get Signature

> **get** **displayed**(): `boolean`

Defined in: [handles/multiboard.ts:160](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L160)

Whether the multiboard is on screen, for every player at once.

##### Native

[IsMultiboardDisplayed](/typings/3.0.0/functions/IsMultiboardDisplayed) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsMultiboardDisplayed))

##### Returns

`boolean`

True when it is shown; false when it is hidden, as a new one
is.

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

### rows

#### Get Signature

> **get** **rows**(): `number`

Defined in: [handles/multiboard.ts:169](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L169)

The number of rows of cells, 0 on a new board.

##### Native

[MultiboardGetRowCount](/typings/3.0.0/functions/MultiboardGetRowCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardGetRowCount))

##### Returns

`number`

The row count: a cell's row runs from 1 to it.

#### Set Signature

> **set** **rows**(`count`): `void`

Defined in: [handles/multiboard.ts:180](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L180)

The number of rows of cells: `createItem` reaches the rows 1 to this
count, so set it before filling the cells.

##### Native

[MultiboardSetRowCount](/typings/3.0.0/functions/MultiboardSetRowCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetRowCount))

##### Bug

Only a change of one row at a time is safe: to add or remove
several, set the count once per row.

##### Parameters

###### count

`number`

##### Returns

`void`

***

### title

#### Get Signature

> **get** **title**(): `string`

Defined in: [handles/multiboard.ts:197](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L197)

The title shown above the cells.

##### Native

[MultiboardGetTitleText](/typings/3.0.0/functions/MultiboardGetTitleText) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardGetTitleText))

##### Returns

`string`

The title, or an empty string when it has none.

#### Set Signature

> **set** **title**(`label`): `void`

Defined in: [handles/multiboard.ts:188](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L188)

The title shown above the cells; the board widens to fit it.

##### Native

[MultiboardSetTitleText](/typings/3.0.0/functions/MultiboardSetTitleText) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetTitleText))

##### Parameters

###### label

`string`

##### Returns

`void`

## Methods

### clear()

> **clear**(): `void`

Defined in: [handles/multiboard.ts:208](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L208)

Removes every cell, leaving no row and no column; the title stays.

#### Returns

`void`

#### Remarks

Release the [MultiboardItem](MultiboardItem.md) handles of the old cells with their
`destroy()`: reusing them after the board grows again is not reliable.

#### Native

[MultiboardClear](/typings/3.0.0/functions/MultiboardClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardClear))

***

### createItem()

> **createItem**(`x`, `y`): [`MultiboardItem`](MultiboardItem.md)

Defined in: [handles/multiboard.ts:221](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L221)

Gets a handle to one cell, as [MultiboardItem.create](MultiboardItem.md#create) does.

#### Parameters

##### x

`number`

The cell's row, counted from 1 at the top.

##### y

`number`

The cell's column, counted from 1 on the left.

#### Returns

[`MultiboardItem`](MultiboardItem.md)

A new handle to the cell.

#### Throws

When the game returns no handle: `reforged-ts: failed to create MultiboardItem`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[MultiboardGetItem](/typings/3.0.0/functions/MultiboardGetItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardGetItem))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/multiboard.ts:234](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L234)

Destroys the Multiboard through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyMultiboard](/typings/3.0.0/functions/DestroyMultiboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyMultiboard))

***

### display()

> **display**(`show`): `void`

Defined in: [handles/multiboard.ts:248](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L248)

Shows or hides the multiboard for every player; showing it again redraws
it.

#### Parameters

##### show

`boolean`

True to show it, false to hide it.

#### Returns

`void`

#### Remarks

A multiboard does not appear when shown during map
initialisation: show it after a wait, or from a Timer of zero seconds, to
have it up as early as the game allows.

#### Native

[MultiboardDisplay](/typings/3.0.0/functions/MultiboardDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardDisplay))

***

### minimize()

> **minimize**(`flag`): `void`

Defined in: [handles/multiboard.ts:258](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L258)

Minimizes the multiboard to its title, or opens it to show its cells, as
the arrow button on it does; either way it is redrawn.

#### Parameters

##### flag

`boolean`

True to minimize it, false to open it.

#### Returns

`void`

#### Native

[MultiboardMinimize](/typings/3.0.0/functions/MultiboardMinimize) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardMinimize))

***

### minimized()

> **minimized**(): `boolean`

Defined in: [handles/multiboard.ts:271](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L271)

**`Async`**

Whether the multiboard is minimized to its title on the local client.

#### Returns

`boolean`

True when it is minimized, false when its cells show.

#### Remarks

A player can minimize or open the board themselves, so the value can
differ between clients: never let it decide game state.

#### Native

[IsMultiboardMinimized](/typings/3.0.0/functions/IsMultiboardMinimized) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsMultiboardMinimized))

***

### setItemsIcons()

> **setItemsIcons**(`icon`): `void`

Defined in: [handles/multiboard.ts:280](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L280)

Sets the icon shown in every cell.

#### Parameters

##### icon

`string`

The path of the icon's texture.

#### Returns

`void`

#### Native

[MultiboardSetItemsIcon](/typings/3.0.0/functions/MultiboardSetItemsIcon) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemsIcon))

***

### setItemsStyle()

> **setItemsStyle**(`showValues`, `showIcons`): `void`

Defined in: [handles/multiboard.ts:290](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L290)

Chooses whether every cell shows its text and its icon.

#### Parameters

##### showValues

`boolean`

Whether the texts show.

##### showIcons

`boolean`

Whether the icons show.

#### Returns

`void`

#### Native

[MultiboardSetItemsStyle](/typings/3.0.0/functions/MultiboardSetItemsStyle) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemsStyle))

***

### setItemsValue()

> **setItemsValue**(`value`): `void`

Defined in: [handles/multiboard.ts:299](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L299)

Sets the text shown in every cell.

#### Parameters

##### value

`string`

The text every cell shows, colour codes included.

#### Returns

`void`

#### Native

[MultiboardSetItemsValue](/typings/3.0.0/functions/MultiboardSetItemsValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemsValue))

***

### setItemsValueColor()

> **setItemsValueColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/multiboard.ts:311](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L311)

Sets the colour of every cell's text; a colour code in a text wins over it.

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

[MultiboardSetItemsValueColor](/typings/3.0.0/functions/MultiboardSetItemsValueColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemsValueColor))

***

### setItemsWidth()

> **setItemsWidth**(`width`): `void`

Defined in: [handles/multiboard.ts:326](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L326)

Sets the width of every cell.

#### Parameters

##### width

`number`

The width, as a fraction of the screen's width: 0.03, the
default, fits a few characters; 1 is the whole screen.

#### Returns

`void`

#### Native

[MultiboardSetItemsWidth](/typings/3.0.0/functions/MultiboardSetItemsWidth) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetItemsWidth))

***

### setTitleTextColor()

> **setTitleTextColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/multiboard.ts:338](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L338)

Sets the colour of the title; a colour code in the title wins over it.

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

[MultiboardSetTitleTextColor](/typings/3.0.0/functions/MultiboardSetTitleTextColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSetTitleTextColor))

***

### create()

> `static` **create**(): `Multiboard`

Defined in: [handles/multiboard.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L132)

Creates a multiboard with no title, no row and no column, hidden and
maximized.

#### Returns

`Multiboard`

The new multiboard.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Multiboard`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[CreateMultiboard](/typings/3.0.0/functions/CreateMultiboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateMultiboard))

#### Bug

Called from a global variable's initial value, it crashes the game.

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

### suppressDisplay()

> `static` **suppressDisplay**(`flag`): `void`

Defined in: [handles/multiboard.ts:354](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/multiboard.ts#L354)

Hides every multiboard while suppressed, without changing whether each
one is displayed, as for a cinematic.

#### Parameters

##### flag

`boolean`

True to hide every multiboard; false to show again the one
displayed last.

#### Returns

`void`

#### Native

[MultiboardSuppressDisplay](/typings/3.0.0/functions/MultiboardSuppressDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/MultiboardSuppressDisplay))
