# Class: QuestItem

Defined in: [handles/quest.ts:15](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L15)

One requirement of a [Quest](Quest.md): a line of its log in the quest menu,
which can be marked completed.

## Remarks

The quest menu shows a change only once the quest is selected again, the
menu is opened again, or [Quest.forceQuestDialogUpdate](Quest.md#forcequestdialogupdate) runs.

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

[questitem](/typings/3.0.0/interfaces/questitem) ([jassbot](https://lep.duckdns.org/jassbot/doc/questitem))

## Extends

- [`Handle`](Handle.md)\<`questitem`\>

## Properties

### handle

> `readonly` **handle**: `questitem`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

***

### quest?

> `readonly` `optional` **quest?**: [`Quest`](Quest.md)

Defined in: [handles/quest.ts:17](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L17)

The quest the item belongs to, set when it is created.

## Accessors

### completed

#### Get Signature

> **get** **completed**(): `boolean`

Defined in: [handles/quest.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L49)

Whether the requirement is marked completed: the game never marks one
itself, the map's code does through the setter.

##### Native

[IsQuestItemCompleted](/typings/3.0.0/functions/IsQuestItemCompleted) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsQuestItemCompleted))

##### Returns

`boolean`

True when it is marked completed, false for a new one.

#### Set Signature

> **set** **completed**(`completed`): `void`

Defined in: [handles/quest.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L57)

Whether the requirement is marked completed; false for a new one.

##### Native

[QuestItemSetCompleted](/typings/3.0.0/functions/QuestItemSetCompleted) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestItemSetCompleted))

##### Parameters

###### completed

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

## Methods

### setDescription()

> **setDescription**(`description`): `void`

Defined in: [handles/quest.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L39)

Changes the line the quest menu shows for the requirement.

#### Parameters

##### description

`string`

The requirement as the player reads it, such as
`"Find the lost sword"`.

#### Returns

`void`

#### Native

[QuestItemSetDescription](/typings/3.0.0/functions/QuestItemSetDescription) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestItemSetDescription))

***

### create()

> `static` **create**(`whichQuest`): `QuestItem`

Defined in: [handles/quest.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/quest.ts#L27)

Adds a requirement, with no description, below the quest's earlier ones.

#### Parameters

##### whichQuest

[`Quest`](Quest.md)

The quest that gets the requirement.

#### Returns

`QuestItem`

The new requirement.

#### Throws

When the game returns no handle: `reforged-ts: failed to create QuestItem`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[QuestCreateItem](/typings/3.0.0/functions/QuestCreateItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/QuestCreateItem))

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
