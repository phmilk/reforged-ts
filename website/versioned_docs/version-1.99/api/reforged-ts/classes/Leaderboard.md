# Class: Leaderboard

Defined in: [handles/leaderboard.ts:17](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L17)

A board in the top-right corner of the screen that lists items under a
title, each a label, an integer value and a player's icon.

## Remarks

A player sees a leaderboard only once it is theirs
([Leaderboard.setPlayerBoard](#setplayerboard)) and it is displayed. Items are indexed
from 0, in their current order.

## Example

**A score board for every player**

```ts
// A kill count for every playing player, best first. The board is built
// once the game runs, from a Timer, and grows to fit its items only when
// told to.
import {
  Init,
  Leaderboard,
  MapPlayer,
  Timer,
  Trigger,
  Unit,
  tsGlobals,
} from "reforged-ts";

Init.onTriggers(() => {
  Timer.after(0, () => {
    const board = Leaderboard.create();
    const kills = new Map<MapPlayer, number>();
    board.label = "Kills";
    for (const player of tsGlobals.Players) {
      if (player.slotState === PLAYER_SLOT_STATE_PLAYING) {
        kills.set(player, 0);
        board.addItem(player.name, 0, player);
        board.setPlayerBoard(player);
      }
    }
    const size = board.itemCount;
    board.itemCount = size;
    board.display();

    Trigger.create()
      .registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
      .addAction(() => {
        const owner = Unit.fromKilling()?.getOwner();
        const count = owner === undefined ? undefined : kills.get(owner);
        if (owner === undefined || count === undefined) {
          return;
        }
        kills.set(owner, count + 1);
        board.setItemValue(board.getPlayerIndex(owner), count + 1);
        board.sortByValue(false);
      });
  });
});
```

## Native

[leaderboard](/typings/3.0.0/interfaces/leaderboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/leaderboard))

## Extends

- [`Handle`](Handle.md)\<`leaderboard`\>

## Properties

### handle

> `readonly` **handle**: `leaderboard`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### displayed

#### Get Signature

> **get** **displayed**(): `boolean`

Defined in: [handles/leaderboard.ts:82](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L82)

Whether the leaderboard is on screen for the players whose leaderboard
it is.

##### Native

[IsLeaderboardDisplayed](/typings/3.0.0/functions/IsLeaderboardDisplayed) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsLeaderboardDisplayed))

##### Returns

`boolean`

True when it is shown, false when it is hidden.

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

### itemCount

#### Get Signature

> **get** **itemCount**(): `number`

Defined in: [handles/leaderboard.ts:93](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L93)

Counts the items on the leaderboard, whether or not the board is sized
to show them all.

##### Native

[LeaderboardGetItemCount](/typings/3.0.0/functions/LeaderboardGetItemCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardGetItemCount))

##### Returns

`number`

The item count, the value to give the `itemCount` setter so the
board fits its items.

#### Set Signature

> **set** **itemCount**(`count`): `void`

Defined in: [handles/leaderboard.ts:103](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L103)

The number of items the leaderboard is sized for. Setting it adds or
removes no item: it resizes the board, which does not grow as items are
added, so set it to [Leaderboard.itemCount](#itemcount) after adding some.

##### Native

[LeaderboardSetSizeByItemCount](/typings/3.0.0/functions/LeaderboardSetSizeByItemCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetSizeByItemCount))

##### Parameters

###### count

`number`

##### Returns

`void`

***

### label

#### Get Signature

> **get** **label**(): `string`

Defined in: [handles/leaderboard.ts:337](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L337)

The title shown above the items.

##### Native

[LeaderboardGetLabelText](/typings/3.0.0/functions/LeaderboardGetLabelText) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardGetLabelText))

##### Returns

`string`

The title, or an empty string when it has none.

#### Set Signature

> **set** **label**(`value`): `void`

Defined in: [handles/leaderboard.ts:328](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L328)

The title shown above the items.

##### Native

[LeaderboardSetLabel](/typings/3.0.0/functions/LeaderboardSetLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetLabel))

##### Parameters

###### value

`string`

##### Returns

`void`

## Methods

### addItem()

> **addItem**(`label`, `value`, `p`): `void`

Defined in: [handles/leaderboard.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L41)

Adds an item for a player at the bottom of the leaderboard.

#### Parameters

##### label

`string`

The item's label, usually the player's name.

##### value

`number`

The item's integer value, such as a score.

##### p

[`MapPlayer`](MapPlayer.md)

The player the item belongs to, whose icon it shows.

#### Returns

`void`

#### Remarks

The board does not grow by itself: set [Leaderboard.itemCount](#itemcount) to
its own value afterwards so the new item fits.

#### Native

[LeaderboardAddItem](/typings/3.0.0/functions/LeaderboardAddItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardAddItem))

***

### clear()

> **clear**(): `void`

Defined in: [handles/leaderboard.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L49)

Removes every item from the leaderboard; its title stays.

#### Returns

`void`

#### Native

[LeaderboardClear](/typings/3.0.0/functions/LeaderboardClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardClear))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/leaderboard.ts:62](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L62)

Destroys the Leaderboard through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyLeaderboard](/typings/3.0.0/functions/DestroyLeaderboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyLeaderboard))

***

### display()

> **display**(`flag?`): `void`

Defined in: [handles/leaderboard.ts:72](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L72)

Shows or hides the leaderboard for the players whose leaderboard it is.

#### Parameters

##### flag?

`boolean` = `true`

True, the default, to show it; false to hide it.

#### Returns

`void`

#### Native

[LeaderboardDisplay](/typings/3.0.0/functions/LeaderboardDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardDisplay))

***

### getPlayerIndex()

> **getPlayerIndex**(`p`): `number`

Defined in: [handles/leaderboard.ts:114](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L114)

Gets the index of a player's item.

#### Parameters

##### p

[`MapPlayer`](MapPlayer.md)

The player whose item to find.

#### Returns

`number`

The index of the player's item, counted from 0 in the current
order.

#### Native

[LeaderboardGetPlayerIndex](/typings/3.0.0/functions/LeaderboardGetPlayerIndex) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardGetPlayerIndex))

***

### hasPlayerItem()

> **hasPlayerItem**(`p`): `void`

Defined in: [handles/leaderboard.ts:127](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L127)

Asks the game whether a player has an item on the leaderboard, and drops
the answer.

#### Parameters

##### p

[`MapPlayer`](MapPlayer.md)

The player to look for.

#### Returns

`void`

#### Remarks

This method returns nothing: the answer of its Native is lost. Call
`LeaderboardHasPlayerItem(board.handle, player.handle)` to read it.

#### Native

[LeaderboardHasPlayerItem](/typings/3.0.0/functions/LeaderboardHasPlayerItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardHasPlayerItem))

***

### removeItem()

> **removeItem**(`index`): `void`

Defined in: [handles/leaderboard.ts:136](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L136)

Removes the item at an index.

#### Parameters

##### index

`number`

The item's index, counted from 0.

#### Returns

`void`

#### Native

[LeaderboardRemoveItem](/typings/3.0.0/functions/LeaderboardRemoveItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardRemoveItem))

***

### removePlayerItem()

> **removePlayerItem**(`p`): `void`

Defined in: [handles/leaderboard.ts:145](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L145)

Removes a player's item.

#### Parameters

##### p

[`MapPlayer`](MapPlayer.md)

The player whose item to remove.

#### Returns

`void`

#### Native

[LeaderboardRemovePlayerItem](/typings/3.0.0/functions/LeaderboardRemovePlayerItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardRemovePlayerItem))

***

### setItemLabel()

> **setItemLabel**(`item`, `label`): `void`

Defined in: [handles/leaderboard.ts:155](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L155)

Changes the text one item shows next to its value.

#### Parameters

##### item

`number`

The item's index, counted from 0.

##### label

`string`

The text to show, usually the player's name.

#### Returns

`void`

#### Native

[LeaderboardSetItemLabel](/typings/3.0.0/functions/LeaderboardSetItemLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetItemLabel))

***

### setItemLabelColor()

> **setItemLabelColor**(`item`, `red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/leaderboard.ts:168](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L168)

Sets the colour of one item's label.

#### Parameters

##### item

`number`

The item's index, counted from 0.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[LeaderboardSetItemLabelColor](/typings/3.0.0/functions/LeaderboardSetItemLabelColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetItemLabelColor))

***

### setItemStyle()

> **setItemStyle**(`item`, `showLabel?`, `showValues?`, `showIcons?`): `void`

Defined in: [handles/leaderboard.ts:186](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L186)

Chooses which parts of one item the leaderboard shows.

#### Parameters

##### item

`number`

The item's index, counted from 0.

##### showLabel?

`boolean` = `true`

Whether the item's label shows; true by default.

##### showValues?

`boolean` = `true`

Whether the item's value shows; true by default.

##### showIcons?

`boolean` = `true`

Whether the player's icon shows; true by default.

#### Returns

`void`

#### Native

[LeaderboardSetItemStyle](/typings/3.0.0/functions/LeaderboardSetItemStyle) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetItemStyle))

***

### setItemValue()

> **setItemValue**(`item`, `value`): `void`

Defined in: [handles/leaderboard.ts:207](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L207)

Changes the number one item shows, such as the player's score.

#### Parameters

##### item

`number`

The item's index, counted from 0.

##### value

`number`

The number to show, a whole number.

#### Returns

`void`

#### Native

[LeaderboardSetItemValue](/typings/3.0.0/functions/LeaderboardSetItemValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetItemValue))

***

### setItemValueColor()

> **setItemValueColor**(`item`, `red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/leaderboard.ts:220](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L220)

Sets the colour of one item's value.

#### Parameters

##### item

`number`

The item's index, counted from 0.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[LeaderboardSetItemValueColor](/typings/3.0.0/functions/LeaderboardSetItemValueColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetItemValueColor))

***

### setLabelColor()

> **setLabelColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/leaderboard.ts:238](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L238)

Sets the colour of every item's label.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[LeaderboardSetLabelColor](/typings/3.0.0/functions/LeaderboardSetLabelColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetLabelColor))

***

### setPlayerBoard()

> **setPlayerBoard**(`p`): `void`

Defined in: [handles/leaderboard.ts:252](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L252)

Makes the leaderboard the one a player sees; a player sees at most one.

#### Parameters

##### p

[`MapPlayer`](MapPlayer.md)

The player who gets the leaderboard.

#### Returns

`void`

#### Native

[PlayerSetLeaderboard](/typings/3.0.0/functions/PlayerSetLeaderboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/PlayerSetLeaderboard))

***

### setStyle()

> **setStyle**(`showLabel?`, `showNames?`, `showValues?`, `showIcons?`): `void`

Defined in: [handles/leaderboard.ts:264](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L264)

Chooses which parts the leaderboard shows.

#### Parameters

##### showLabel?

`boolean` = `true`

Whether its title shows; true by default.

##### showNames?

`boolean` = `true`

Whether the items' labels show; true by default.

##### showValues?

`boolean` = `true`

Whether the items' values show; true by default.

##### showIcons?

`boolean` = `true`

Whether the players' icons show; true by default.

#### Returns

`void`

#### Native

[LeaderboardSetStyle](/typings/3.0.0/functions/LeaderboardSetStyle) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetStyle))

***

### setValueColor()

> **setValueColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/leaderboard.ts:287](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L287)

Sets the colour of every item's value.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[LeaderboardSetValueColor](/typings/3.0.0/functions/LeaderboardSetValueColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSetValueColor))

***

### sortByLabel()

> **sortByLabel**(`asc?`): `void`

Defined in: [handles/leaderboard.ts:301](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L301)

Sorts the items by label, alphabetically.

#### Parameters

##### asc?

`boolean` = `true`

True, the default, for ascending order; false for descending.

#### Returns

`void`

#### Native

[LeaderboardSortItemsByLabel](/typings/3.0.0/functions/LeaderboardSortItemsByLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSortItemsByLabel))

***

### sortByPlayer()

> **sortByPlayer**(`asc?`): `void`

Defined in: [handles/leaderboard.ts:310](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L310)

Sorts the items by the players they belong to.

#### Parameters

##### asc?

`boolean` = `true`

True, the default, for ascending order; false for descending.

#### Returns

`void`

#### Native

[LeaderboardSortItemsByPlayer](/typings/3.0.0/functions/LeaderboardSortItemsByPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSortItemsByPlayer))

***

### sortByValue()

> **sortByValue**(`asc?`): `void`

Defined in: [handles/leaderboard.ts:320](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L320)

Sorts the items by value.

#### Parameters

##### asc?

`boolean` = `true`

True, the default, for ascending order, the lowest value
first; false for descending, the highest first.

#### Returns

`void`

#### Native

[LeaderboardSortItemsByValue](/typings/3.0.0/functions/LeaderboardSortItemsByValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/LeaderboardSortItemsByValue))

***

### create()

> `static` **create**(): `Leaderboard`

Defined in: [handles/leaderboard.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L27)

Creates an empty leaderboard, which no player sees yet.

#### Returns

`Leaderboard`

The new leaderboard.

#### Remarks

It starts with no row, no column and no label.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Leaderboard`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[CreateLeaderboard](/typings/3.0.0/functions/CreateLeaderboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateLeaderboard))

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

### fromPlayer()

> `static` **fromPlayer**(`p`): `Leaderboard` \| `undefined`

Defined in: [handles/leaderboard.ts:348](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/leaderboard.ts#L348)

Gets the leaderboard a player sees.

#### Parameters

##### p

[`MapPlayer`](MapPlayer.md)

The player whose leaderboard to get.

#### Returns

`Leaderboard` \| `undefined`

The player's leaderboard, or `undefined` when none was set for
them.

#### Native

[PlayerGetLeaderboard](/typings/3.0.0/functions/PlayerGetLeaderboard) ([jassbot](https://lep.duckdns.org/jassbot/doc/PlayerGetLeaderboard))
