# Class: Quest

Defined in: [handles/quest.ts:74](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L74)

A quest in the quest menu: a title, an icon, a description and a list of
requirements ([QuestItem](QuestItem.md)).

## Remarks

- The quest menu shows a change only once it is opened again, or
  [Quest.forceQuestDialogUpdate](#forcequestdialogupdate) runs.
- The game crashes when it shows an enabled, discovered quest whose
  description is empty: set the description right after creating one.

## Example

**A quest with two requirements**

```ts
// A main quest with two requirements, set up with the map. Its description
// is set right away: the quest menu crashes on an enabled, discovered quest
// without one. When a hero picks up the relic, the first requirement is
// completed and the menu updated to show it.
import { Init, Item, Quest, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const quest = Quest.create();
  quest.setTitle("The Lost Relic");
  quest.setDescription("Find the relic and bring it back to the village.");
  quest.setIcon("ReplaceableTextures\\CommandButtons\\BTNAnkh.blp");

  const find = quest.addItem("Find the relic");
  quest.addItem("Bring it back to the village");

  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_PICKUP_ITEM)
    .addAction(() => {
      if (Item.fromEvent()?.typeId === FourCC("ankh") && !find.completed) {
        find.completed = true;
        Quest.forceQuestDialogUpdate();
        Quest.flashQuestDialogButton();
      }
    });
});
```

## Native

[quest](/typings/3.0.0/interfaces/quest) ([jassbot](https://lep.duckdns.org/jassbot/doc/quest))

## Extends

- [`Handle`](Handle.md)\<`quest`\>

## Properties

### handle

> `readonly` **handle**: `quest`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### completed

#### Get Signature

> **get** **completed**(): `boolean`

Defined in: [handles/quest.ts:95](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L95)

Whether the quest is marked completed, which the map's code does through
the setter.

##### Native

[IsQuestCompleted](/typings/3.0.0/functions/IsQuestCompleted) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestCompleted))

##### Returns

`boolean`

True when it is marked completed, even when it is also marked
failed; false for a new quest.

#### Set Signature

> **set** **completed**(`completed`): `void`

Defined in: [handles/quest.ts:104](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L104)

Whether the quest is marked completed; its title then gets a "Completed"
label, even when it is also failed.

##### Native

[QuestSetCompleted](/typings/3.0.0/functions/QuestSetCompleted) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetCompleted))

##### Parameters

###### completed

`boolean`

##### Returns

`void`

***

### discovered

#### Get Signature

> **get** **discovered**(): `boolean`

Defined in: [handles/quest.ts:114](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L114)

Whether the quest is discovered: the quest menu shows an undiscovered
one with a placeholder title, icon and description.

##### Native

[IsQuestDiscovered](/typings/3.0.0/functions/IsQuestDiscovered) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestDiscovered))

##### Returns

`boolean`

True when it is discovered, as a new quest is.

#### Set Signature

> **set** **discovered**(`discovered`): `void`

Defined in: [handles/quest.ts:123](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L123)

Whether the quest is discovered; an undiscovered one shows a placeholder
title, icon and description in the quest menu. True for a new quest.

##### Native

[QuestSetDiscovered](/typings/3.0.0/functions/QuestSetDiscovered) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetDiscovered))

##### Parameters

###### discovered

`boolean`

##### Returns

`void`

***

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [handles/quest.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L132)

Whether the quest is enabled, that is listed in the quest menu.

##### Native

[IsQuestEnabled](/typings/3.0.0/functions/IsQuestEnabled) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestEnabled))

##### Returns

`boolean`

True when it is listed, as a new quest is.

#### Set Signature

> **set** **enabled**(`enabled`): `void`

Defined in: [handles/quest.ts:141](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L141)

Whether the quest is enabled, that is listed in the quest menu. True for
a new quest.

##### Native

[QuestSetEnabled](/typings/3.0.0/functions/QuestSetEnabled) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetEnabled))

##### Parameters

###### enabled

`boolean`

##### Returns

`void`

***

### failed

#### Get Signature

> **get** **failed**(): `boolean`

Defined in: [handles/quest.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L152)

Whether the quest is marked failed, which the map's code does through
the setter.

##### Native

[IsQuestFailed](/typings/3.0.0/functions/IsQuestFailed) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestFailed))

##### Returns

`boolean`

True when it is marked failed, even when it is also marked
completed; false for a new quest.

#### Set Signature

> **set** **failed**(`failed`): `void`

Defined in: [handles/quest.ts:161](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L161)

Whether the quest is marked failed; its title then gets a "Failed" label,
unless it is also completed.

##### Native

[QuestSetFailed](/typings/3.0.0/functions/QuestSetFailed) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetFailed))

##### Parameters

###### failed

`boolean`

##### Returns

`void`

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

### required

#### Get Signature

> **get** **required**(): `boolean`

Defined in: [handles/quest.ts:170](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L170)

Whether the quest is a main quest rather than an optional one.

##### Native

[IsQuestRequired](/typings/3.0.0/functions/IsQuestRequired) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestRequired))

##### Returns

`boolean`

True for a main quest, false for an optional one.

#### Set Signature

> **set** **required**(`required`): `void`

Defined in: [handles/quest.ts:179](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L179)

Whether the quest is listed with the main quests, rather than the
optional ones. True for a new quest.

##### Native

[QuestSetRequired](/typings/3.0.0/functions/QuestSetRequired) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetRequired))

##### Parameters

###### required

`boolean`

##### Returns

`void`

## Methods

### addItem()

> **addItem**(`description`): [`QuestItem`](QuestItem.md)

Defined in: [handles/quest.ts:192](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L192)

Adds a requirement with a description below the quest's earlier ones.

#### Parameters

##### description

`string`

The text of the requirement's line.

#### Returns

[`QuestItem`](QuestItem.md)

The new requirement.

#### Throws

When the game returns no handle: `reforged-ts: failed to create QuestItem`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[QuestCreateItem](/typings/3.0.0/functions/QuestCreateItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestCreateItem))

#### Native

[QuestItemSetDescription](/typings/3.0.0/functions/QuestItemSetDescription) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestItemSetDescription))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/quest.ts:208](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L208)

Destroys the Quest through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyQuest](/typings/3.0.0/functions/DestroyQuest) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyQuest))

***

### setDescription()

> **setDescription**(`description`): `void`

Defined in: [handles/quest.ts:220](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L220)

Sets the quest's description, the text the quest menu shows while the
quest is picked there.

#### Parameters

##### description

`string`

The text; never empty on an enabled, discovered
quest, which crashes the game.

#### Returns

`void`

#### Native

[QuestSetDescription](/typings/3.0.0/functions/QuestSetDescription) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetDescription))

***

### setIcon()

> **setIcon**(`iconPath`): `void`

Defined in: [handles/quest.ts:231](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L231)

Sets the icon shown next to the quest's title.

#### Parameters

##### iconPath

`string`

The path of the icon's texture, such as
`"ReplaceableTextures\\CommandButtons\\BTNFootman.blp"`; an empty path
shows a plain green square.

#### Returns

`void`

#### Native

[QuestSetIconPath](/typings/3.0.0/functions/QuestSetIconPath) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetIconPath))

***

### setTitle()

> **setTitle**(`title`): `void`

Defined in: [handles/quest.ts:240](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L240)

Sets the title shown in the quest menu's list and above the description.

#### Parameters

##### title

`string`

The quest's name, such as `"The Lost Sword"`.

#### Returns

`void`

#### Native

[QuestSetTitle](/typings/3.0.0/functions/QuestSetTitle) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestSetTitle))

***

### create()

> `static` **create**(): `Quest`

Defined in: [handles/quest.ts:84](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L84)

Creates a quest, enabled, discovered and required, with no title, icon
or description.

#### Returns

`Quest`

The new quest.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Quest`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[CreateQuest](/typings/3.0.0/functions/CreateQuest) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateQuest))

#### Bug

Called from a global variable's initial value, it crashes the game.

***

### flashQuestDialogButton()

> `static` **flashQuestDialogButton**(): `void`

Defined in: [handles/quest.ts:249](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L249)

Makes the quest menu's button flash, for every player, until it is
clicked or for about ten seconds.

#### Returns

`void`

#### Native

[FlashQuestDialogButton](/typings/3.0.0/functions/FlashQuestDialogButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlashQuestDialogButton))

***

### forceQuestDialogUpdate()

> `static` **forceQuestDialogUpdate**(): `void`

Defined in: [handles/quest.ts:258](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L258)

Redraws the quest menu so that it shows the quests' changes, even while
it is open.

#### Returns

`void`

#### Native

[ForceQuestDialogUpdate](/typings/3.0.0/functions/ForceQuestDialogUpdate) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceQuestDialogUpdate))

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
