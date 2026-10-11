# Class: Item

Defined in: [handles/item.ts:21](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L21)

An item, lying on the map or carried in a unit's inventory.

## Example

**Creating items on the map**

```ts
// Two Claws of Attack +15, `FourCC("ratf")`, on the ground near the map's
// centre, the second in the skin of Boots of Speed, `FourCC("bspd")`: given a
// skin, `Item.create` calls BlzCreateItemWithSkin.
import { Init, Item } from "reforged-ts";

Init.onTriggers(() => {
  Item.create(FourCC("ratf"), 256, -128);
  Item.create(FourCC("ratf"), 320, -128, FourCC("bspd"));
});
```

## Native

[item](/typings/3.0.0/interfaces/item) ([jassbot](https://lep.duckdns.org/jassbot/doc/item))

## Extends

- [`Widget`](Widget.md)

## Properties

### handle

> `readonly` **handle**: `item`

Defined in: [handles/item.ts:23](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L23)

The game's `item` Handle this Wrapper owns.

#### Overrides

[`Widget`](Widget.md).[`handle`](Widget.md#handle)

## Accessors

### charges

#### Get Signature

> **get** **charges**(): `number`

Defined in: [handles/item.ts:58](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L58)

Gets the item's charges, the uses a charged item has left.

##### Native

[GetItemCharges](/typings/3.0.0/functions/GetItemCharges) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemCharges))

##### Returns

`number`

The charges; 0 for an item with none.

#### Set Signature

> **set** **charges**(`value`): `void`

Defined in: [handles/item.ts:66](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L66)

The item's charges, the uses a charged item has left.

##### Native

[SetItemCharges](/typings/3.0.0/functions/SetItemCharges) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemCharges))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### color

#### Set Signature

> **set** **color**(`color`): `void`

Defined in: [handles/item.ts:75](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L75)

The item's colour, set like `MapPlayer.color`. Write-only: the game has
no Native that reads it back.

##### Native

[SetItemColor](/typings/3.0.0/functions/SetItemColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemColor))

##### Parameters

###### color

`playercolor`

##### Returns

`void`

***

### description

#### Get Signature

> **get** **description**(): `string`

Defined in: [handles/item.ts:152](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L152)

**`Async`**

Gets the item's description, in the local client's language.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Showing names in the local language**

```ts
// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts, here Claws of Attack +15's,
  // `FourCC("ratf")`; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
```

##### Native

[BlzGetItemDescription](/typings/3.0.0/functions/BlzGetItemDescription) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemDescription))

##### Returns

`string`

The description; an empty string when the game gives none.

#### Set Signature

> **set** **description**(`description`): `void`

Defined in: [handles/item.ts:161](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L161)

The item's description, the text of its item type's Description field
in the object editor, for this item only.

##### Native

[BlzSetItemDescription](/typings/3.0.0/functions/BlzSetItemDescription) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemDescription))

##### Parameters

###### description

`string`

##### Returns

`void`

***

### equipmentType

#### Get Signature

> **get** **equipmentType**(): [`EquipmentType`](../enumerations/EquipmentType.md)

Defined in: [handles/item.ts:90](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L90)

Gets the equipment type of the item, the loadout slots it can be
equipped in.

##### Throws

When the game returns an equipment type no member names, such as
one a later Patch adds:
`reforged-ts: GetItemEquipmentType returned a value EquipmentType does not name`,
at the line that read it.

##### Native

[GetItemEquipmentType](/typings/3.0.0/functions/GetItemEquipmentType) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemEquipmentType))

##### Returns

[`EquipmentType`](../enumerations/EquipmentType.md)

The equipment type; `EquipmentType.None` for an item that cannot
be equipped.

***

### extendedTooltip

#### Get Signature

> **get** **extendedTooltip**(): `string`

Defined in: [handles/item.ts:175](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L175)

**`Async`**

Gets the item's extended tooltip, in the local client's language.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Showing names in the local language**

```ts
// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts, here Claws of Attack +15's,
  // `FourCC("ratf")`; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
```

##### Native

[BlzGetItemExtendedTooltip](/typings/3.0.0/functions/BlzGetItemExtendedTooltip) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemExtendedTooltip))

##### Returns

`string`

The extended tooltip; an empty string when the game gives none.

#### Set Signature

> **set** **extendedTooltip**(`tooltip`): `void`

Defined in: [handles/item.ts:183](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L183)

The item's extended tooltip, the body text shown under its tooltip.

##### Native

[BlzSetItemExtendedTooltip](/typings/3.0.0/functions/BlzSetItemExtendedTooltip) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemExtendedTooltip))

##### Parameters

###### tooltip

`string`

##### Returns

`void`

***

### icon

#### Get Signature

> **get** **icon**(): `string`

Defined in: [handles/item.ts:193](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L193)

Gets the path of the item's icon.

##### Native

[BlzGetItemIconPath](/typings/3.0.0/functions/BlzGetItemIconPath) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemIconPath))

##### Returns

`string`

The icon's texture path; an empty string when the game gives
none.

#### Set Signature

> **set** **icon**(`path`): `void`

Defined in: [handles/item.ts:201](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L201)

The path of the item's icon, a `.blp` texture of the game or the map.

##### Native

[BlzSetItemIconPath](/typings/3.0.0/functions/BlzSetItemIconPath) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemIconPath))

##### Parameters

###### path

`string`

##### Returns

`void`

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

[`Widget`](Widget.md).[`id`](Widget.md#id)

***

### invulnerable

#### Get Signature

> **get** **invulnerable**(): `boolean`

Defined in: [handles/item.ts:110](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L110)

Tells whether the item cannot be attacked or destroyed.

##### Native

[IsItemInvulnerable](/typings/3.0.0/functions/IsItemInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemInvulnerable))

##### Returns

`boolean`

`true` when the item is invulnerable.

#### Set Signature

> **set** **invulnerable**(`flag`): `void`

Defined in: [handles/item.ts:101](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L101)

Whether the item cannot be attacked or destroyed.

##### Native

[SetItemInvulnerable](/typings/3.0.0/functions/SetItemInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemInvulnerable))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### isEquipped

#### Get Signature

> **get** **isEquipped**(): `boolean`

Defined in: [handles/item.ts:119](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L119)

Tells whether a unit has the item equipped in one of its loadout slots.

##### Native

[IsItemEquipped](/typings/3.0.0/functions/IsItemEquipped) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemEquipped))

##### Returns

`boolean`

`true` when the item is equipped.

***

### isInBag

#### Get Signature

> **get** **isInBag**(): `boolean`

Defined in: [handles/item.ts:128](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L128)

Tells whether the item lies in a unit's bag.

##### Native

[IsItemInBag](/typings/3.0.0/functions/IsItemInBag) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemInBag))

##### Returns

`boolean`

`true` when the item is in a bag.

***

### level

#### Get Signature

> **get** **level**(): `number`

Defined in: [handles/item.ts:138](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L138)

Gets the item's level, as its item type sets it in the object editor.

##### Native

[GetItemLevel](/typings/3.0.0/functions/GetItemLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemLevel))

##### Returns

`number`

The level, the one [Item.chooseRandomWithFilter](#chooserandomwithfilter) filters
item types by.

***

### life

#### Get Signature

> **get** **life**(): `number`

Defined in: [handles/widget.ts:19](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/widget.ts#L19)

Gets how many hit points the widget has left.

##### Native

[GetWidgetLife](/typings/3.0.0/functions/GetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetLife))

##### Returns

`number`

The hit points left, an amount rather than a percentage.

#### Set Signature

> **set** **life**(`value`): `void`

Defined in: [handles/widget.ts:27](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/widget.ts#L27)

The widget's current hit points, an amount rather than a percentage.

##### Native

[SetWidgetLife](/typings/3.0.0/functions/SetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetWidgetLife))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Widget`](Widget.md).[`life`](Widget.md#life)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [handles/item.ts:215](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L215)

**`Async`**

Gets the item's name, in the local client's language.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Showing names in the local language**

```ts
// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts, here Claws of Attack +15's,
  // `FourCC("ratf")`; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
```

##### Native

[GetItemName](/typings/3.0.0/functions/GetItemName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemName))

##### Returns

`string`

The name; an empty string when the game gives none.

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [handles/item.ts:224](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L224)

The item's name, for this item only: other items of its type keep
theirs.

##### Native

[BlzSetItemName](/typings/3.0.0/functions/BlzSetItemName) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemName))

##### Parameters

###### value

`string`

##### Returns

`void`

***

### pawnable

#### Get Signature

> **get** **pawnable**(): `boolean`

Defined in: [handles/item.ts:256](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L256)

Tells whether a unit can sell the item to a shop (pawn it).

##### Native

[IsItemPawnable](/typings/3.0.0/functions/IsItemPawnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemPawnable))

##### Returns

`boolean`

`true` when the item can be pawned.

#### Set Signature

> **set** **pawnable**(`flag`): `void`

Defined in: [handles/item.ts:264](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L264)

Whether a unit can sell the item to a shop (pawn it).

##### Native

[SetItemPawnable](/typings/3.0.0/functions/SetItemPawnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPawnable))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### skin

#### Get Signature

> **get** **skin**(): `Rawcode`\<`"item"`\>

Defined in: [handles/item.ts:358](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L358)

Gets the rawcode of the skin the item shows.

##### Native

[BlzGetItemSkin](/typings/3.0.0/functions/BlzGetItemSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemSkin))

##### Returns

`Rawcode`\<`"item"`\>

The skin's rawcode, such as Boots of Speed's, `FourCC("bspd")`;
the item type's own when no skin was set.

#### Set Signature

> **set** **skin**(`skinId`): `void`

Defined in: [handles/item.ts:367](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L367)

The rawcode of the skin the item shows, the model of another item type,
such as Boots of Speed's, `FourCC("bspd")`.

##### Native

[BlzSetItemSkin](/typings/3.0.0/functions/BlzSetItemSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemSkin))

##### Parameters

###### skinId

`Rawcode`\<`"item"`\>

##### Returns

`void`

***

### tag

#### Get Signature

> **get** **tag**(): [`ItemTag`](../enumerations/ItemTag.md)

Defined in: [handles/item.ts:303](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L303)

Gets the item's tag, the [ItemTag](../enumerations/ItemTag.md) category its item type puts it
in, such as a quest reward, a boss drop or a shop item.

##### Throws

When the game returns a tag no member names, such as one a later
Patch adds: `reforged-ts: GetItemTag returned a value ItemTag does not name`,
at the line that read it.

##### Native

[GetItemTag](/typings/3.0.0/functions/GetItemTag) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemTag))

##### Returns

[`ItemTag`](../enumerations/ItemTag.md)

The tag; `ItemTag.Undefined` for an item with none.

***

### tooltip

#### Get Signature

> **get** **tooltip**(): `string`

Defined in: [handles/item.ts:238](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L238)

**`Async`**

Gets the item's tooltip, in the local client's language.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Showing names in the local language**

```ts
// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts, here Claws of Attack +15's,
  // `FourCC("ratf")`; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
```

##### Native

[BlzGetItemTooltip](/typings/3.0.0/functions/BlzGetItemTooltip) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemTooltip))

##### Returns

`string`

The tooltip; an empty string when the game gives none.

#### Set Signature

> **set** **tooltip**(`tooltip`): `void`

Defined in: [handles/item.ts:247](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L247)

The item's tooltip, the title line shown when the cursor is over its
icon.

##### Native

[BlzSetItemTooltip](/typings/3.0.0/functions/BlzSetItemTooltip) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemTooltip))

##### Parameters

###### tooltip

`string`

##### Returns

`void`

***

### type

#### Get Signature

> **get** **type**(): `itemtype`

Defined in: [handles/item.ts:290](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L290)

Gets the item's classification, such as `ITEM_TYPE_PERMANENT` or
`ITEM_TYPE_CHARGED`.

##### Native

[GetItemType](/typings/3.0.0/functions/GetItemType) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemType))

##### Returns

`itemtype`

The game's `itemtype` value, or `undefined` when the game gives
none.

***

### typeId

#### Get Signature

> **get** **typeId**(): `Rawcode`\<`"item"`\>

Defined in: [handles/item.ts:312](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L312)

Gets the rawcode of the item's type.

##### Native

[GetItemTypeId](/typings/3.0.0/functions/GetItemTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemTypeId))

##### Returns

`Rawcode`\<`"item"`\>

The rawcode, such as Claws of Attack +15's, `FourCC("ratf")`.

***

### userData

#### Get Signature

> **get** **userData**(): `number`

Defined in: [handles/item.ts:321](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L321)

Gets the number the Map project attached to the item.

##### Native

[GetItemUserData](/typings/3.0.0/functions/GetItemUserData) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemUserData))

##### Returns

`number`

The number; 0 until one is set.

#### Set Signature

> **set** **userData**(`value`): `void`

Defined in: [handles/item.ts:330](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L330)

A number the Map project attaches to the item, which the game never
reads.

##### Native

[SetItemUserData](/typings/3.0.0/functions/SetItemUserData) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemUserData))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [handles/item.ts:339](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L339)

Tells whether the item is shown on the map.

##### Native

[IsItemVisible](/typings/3.0.0/functions/IsItemVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemVisible))

##### Returns

`boolean`

`true` when the item is visible.

#### Set Signature

> **set** **visible**(`flag`): `void`

Defined in: [handles/item.ts:348](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L348)

Whether the item is shown on the map; a hidden item cannot be seen or
picked up.

##### Native

[SetItemVisible](/typings/3.0.0/functions/SetItemVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemVisible))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/item.ts:376](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L376)

Gets the item's x-coordinate on the map.

##### Native

[GetItemX](/typings/3.0.0/functions/GetItemX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemX))

##### Returns

`number`

The x-coordinate, in world units.

#### Set Signature

> **set** **x**(`value`): `void`

Defined in: [handles/item.ts:386](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L386)

The item's x-coordinate on the map, in world units; moving the item keeps
its y-coordinate.

##### Native

[SetItemPosition](/typings/3.0.0/functions/SetItemPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPosition))

##### Native

[GetItemY](/typings/3.0.0/functions/GetItemY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemY))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Overrides

[`Widget`](Widget.md).[`x`](Widget.md#x)

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/item.ts:395](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L395)

Gets the item's y-coordinate on the map.

##### Native

[GetItemY](/typings/3.0.0/functions/GetItemY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemY))

##### Returns

`number`

The y-coordinate, in world units.

#### Set Signature

> **set** **y**(`value`): `void`

Defined in: [handles/item.ts:405](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L405)

The item's y-coordinate on the map, in world units; moving the item keeps
its x-coordinate.

##### Native

[SetItemPosition](/typings/3.0.0/functions/SetItemPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPosition))

##### Native

[GetItemX](/typings/3.0.0/functions/GetItemX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemX))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Overrides

[`Widget`](Widget.md).[`y`](Widget.md#y)

## Methods

### addAbility()

> **addAbility**(`abilCode`): `void`

Defined in: [handles/item.ts:417](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L417)

Adds an ability to the item, which the unit carrying it gains.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Item Damage Bonus's,
`FourCC("AIat")`.

#### Returns

`void`

#### Remarks

It works only on an item that a unit carries.

#### Native

[BlzItemAddAbility](/typings/3.0.0/functions/BlzItemAddAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzItemAddAbility))

***

### addIndicator()

> **addIndicator**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/widget.ts:57](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/widget.ts#L57)

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

#### Inherited from

[`Widget`](Widget.md).[`addIndicator`](Widget.md#addindicator)

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/item.ts:469](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L469)

Destroys the Item through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Example

**Removing game objects without a death**

```ts
// Removing a unit, an item or a destructable from the game at once with
// destroy(), where kill() would let it die. A destroyed unit fires no death
// event, leaves no corpse and gives no bounty, so call destroy() for what
// must vanish without a trace, such as a dummy unit or a used token.
// Every reference to it is dead afterwards: remove it from the maps and
// groups that hold it, since in Dev mode any use of a destroyed Wrapper
// raises `reforged-ts: used after destroy: <Class>#<id>`.
import {
  Destructable,
  HandleMap,
  Init,
  Item,
  tsGlobals,
  Unit,
} from "reforged-ts";

/** The token each hero carries, while it carries one. */
const tokens = new HandleMap<Unit, Item>();

/** Spends `hero`'s token: the item vanishes and the entry goes with it. */
export function spendToken(hero: Unit): void {
  const token = tokens.get(hero);
  if (token === undefined) {
    return;
  }
  tokens.delete(hero);
  token.destroy();
}

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
  const token = Item.create(FourCC("ratf"), 64, 0);
  hero.addItem(token);
  tokens.set(hero, token);
  spendToken(hero);

  // A dummy unit, removed once its work is done: no death, no corpse.
  const dummy = Unit.create(owner, FourCC("hfoo"), 128, 0);
  dummy.destroy();

  // A gate removed when opened, rather than left as a broken one.
  const gate = Destructable.create({ typeId: FourCC("LTg1"), x: 256, y: 0 });
  gate.destroy();
});
```

#### Native

[RemoveItem](/typings/3.0.0/functions/RemoveItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveItem))

***

### getAbility()

> **getAbility**(`abilCode`): `ability` \| `undefined`

Defined in: [handles/item.ts:429](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L429)

Gets one of the item's abilities by its rawcode.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Item Damage Bonus's,
`FourCC("AIat")`.

#### Returns

`ability` \| `undefined`

The game's `ability` Handle, or `undefined` when the item has no
ability of that rawcode.

#### Native

[BlzGetItemAbility](/typings/3.0.0/functions/BlzGetItemAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemAbility))

***

### getAbilityByIndex()

> **getAbilityByIndex**(`index`): `ability` \| `undefined`

Defined in: [handles/item.ts:444](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L444)

Gets one of the item's abilities by its position on the item.

#### Parameters

##### index

`number`

The ability's index, from 0.

#### Returns

`ability` \| `undefined`

The game's `ability` Handle, or `undefined` when the index is
past the item's last ability.

#### Remarks

Which of two active abilities the game casts first is unspecified, and
their order can change, for example when the carrying unit dies and
revives.

#### Native

[BlzGetItemAbilityByIndex](/typings/3.0.0/functions/BlzGetItemAbilityByIndex) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemAbilityByIndex))

***

### getField()

> **getField**(`field`): `string` \| `number` \| `boolean` \| `undefined`

Defined in: [handles/item.ts:490](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L490)

Reads one of the item's object-editor fields, through the Native for the
field's type.

#### Parameters

##### field

`itembooleanfield` \| `itemintegerfield` \| `itemrealfield` \| `itemstringfield`

The field, an `ITEM_BF_`, `ITEM_IF_`, `ITEM_RF_` or
`ITEM_SF_` constant.

#### Returns

`string` \| `number` \| `boolean` \| `undefined`

The field's value: a boolean, an integer, a real or a string,
as the field's type is; 0 for a field of no item field type.

#### Remarks

w3ts 3.x compared the field's type with the unit field type names, so it
returned 0 for every item field without calling a Native; this reads
the item field.

#### Native

[BlzGetItemBooleanField](/typings/3.0.0/functions/BlzGetItemBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemBooleanField))

#### Native

[BlzGetItemIntegerField](/typings/3.0.0/functions/BlzGetItemIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemIntegerField))

#### Native

[BlzGetItemRealField](/typings/3.0.0/functions/BlzGetItemRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemRealField))

#### Native

[BlzGetItemStringField](/typings/3.0.0/functions/BlzGetItemStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetItemStringField))

***

### getOwner()

> **getOwner**(): [`MapPlayer`](MapPlayer.md) \| `undefined`

Defined in: [handles/item.ts:279](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L279)

Gets the player who owns the item.

#### Returns

[`MapPlayer`](MapPlayer.md) \| `undefined`

The owner, or `undefined` when the game gives none.

#### Remarks

In w3ts 3.x this was the `player` accessor, which returned the raw
`player` Handle the caller wrapped with `MapPlayer.fromHandle`; it now
returns that `MapPlayer`. Unlike `Unit.getOwner`, it does not throw
when there is no owner: an item need not have one, so `undefined` is
an answer, not a failure.

#### Native

[GetItemPlayer](/typings/3.0.0/functions/GetItemPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetItemPlayer))

***

### isOwned()

> **isOwned**(): `boolean`

Defined in: [handles/item.ts:515](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L515)

Tells whether a unit carries the item in its inventory.

#### Returns

`boolean`

`true` when the item is carried.

#### Native

[IsItemOwned](/typings/3.0.0/functions/IsItemOwned) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemOwned))

***

### isPawnable()

> **isPawnable**(): `boolean`

Defined in: [handles/item.ts:525](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L525)

Tells whether a unit can sell the item to a shop (pawn it), as the
`pawnable` getter does.

#### Returns

`boolean`

`true` when the item can be pawned.

#### Native

[IsItemPawnable](/typings/3.0.0/functions/IsItemPawnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemPawnable))

***

### isPowerup()

> **isPowerup**(): `boolean`

Defined in: [handles/item.ts:535](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L535)

Tells whether the item is a power-up, used at once when picked up, such
as a tome.

#### Returns

`boolean`

`true` when the item is a power-up.

#### Native

[IsItemPowerup](/typings/3.0.0/functions/IsItemPowerup) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemPowerup))

***

### isSellable()

> **isSellable**(): `boolean`

Defined in: [handles/item.ts:544](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L544)

Tells whether a shop can sell the item, as a marketplace's random stock.

#### Returns

`boolean`

`true` when the item is sellable.

#### Native

[IsItemSellable](/typings/3.0.0/functions/IsItemSellable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemSellable))

***

### removeAbility()

> **removeAbility**(`abilCode`): `void`

Defined in: [handles/item.ts:454](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L454)

Removes an ability from the item.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Item Damage Bonus's,
`FourCC("AIat")`.

#### Returns

`void`

#### Native

[BlzItemRemoveAbility](/typings/3.0.0/functions/BlzItemRemoveAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzItemRemoveAbility))

***

### setDropId()

> **setDropId**(`unitId`): `void`

Defined in: [handles/item.ts:555](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L555)

Records the unit type the item counts as dropped by, as the game does
for an item a creep drops.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Faceless One
Trickster's, `FourCC("nfor")`.

#### Returns

`void`

#### Native

[SetItemDropID](/typings/3.0.0/functions/SetItemDropID) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemDropID))

***

### setDropOnDeath()

> **setDropOnDeath**(`flag`): `void`

Defined in: [handles/item.ts:564](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L564)

Sets whether a unit carrying the item drops it when the unit dies.

#### Parameters

##### flag

`boolean`

`true` to drop it on death.

#### Returns

`void`

#### Native

[SetItemDropOnDeath](/typings/3.0.0/functions/SetItemDropOnDeath) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemDropOnDeath))

***

### setDroppable()

> **setDroppable**(`flag`): `void`

Defined in: [handles/item.ts:573](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L573)

Sets whether a unit carrying the item can drop it from its inventory.

#### Parameters

##### flag

`boolean`

`false` to make the item undroppable.

#### Returns

`void`

#### Native

[SetItemDroppable](/typings/3.0.0/functions/SetItemDroppable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemDroppable))

***

### setField()

> **setField**(`field`, `value`): `boolean`

Defined in: [handles/item.ts:596](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L596)

Writes one of the item's object-editor fields, through the Native for
the field's type.

#### Parameters

##### field

`itembooleanfield` \| `itemintegerfield` \| `itemrealfield` \| `itemstringfield`

The field, an `ITEM_BF_`, `ITEM_IF_`, `ITEM_RF_` or
`ITEM_SF_` constant.

##### value

`string` \| `number` \| `boolean`

The new value: a boolean for a boolean field, a number
for an integer or real field, a string for a string field.

#### Returns

`boolean`

What the Native returns, `true` when the game set the field;
`false` when `value` does not match the field's type, without calling a
Native.

#### Remarks

w3ts 3.x compared the field's type with the unit field type names, so it
returned `false` for every item field without calling a Native; this
writes the item field.

#### Native

[BlzSetItemBooleanField](/typings/3.0.0/functions/BlzSetItemBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemBooleanField))

#### Native

[BlzSetItemIntegerField](/typings/3.0.0/functions/BlzSetItemIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemIntegerField))

#### Native

[BlzSetItemRealField](/typings/3.0.0/functions/BlzSetItemRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemRealField))

#### Native

[BlzSetItemStringField](/typings/3.0.0/functions/BlzSetItemStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetItemStringField))

***

### setOwner()

> **setOwner**(`whichPlayer`, `changeColor`): `void`

Defined in: [handles/item.ts:637](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L637)

Gives the item to a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The new owner.

##### changeColor

`boolean`

`true` to show the item in the new owner's colour.

#### Returns

`void`

#### Native

[SetItemPlayer](/typings/3.0.0/functions/SetItemPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPlayer))

***

### setPoint()

> **setPoint**(`whichPoint`): `void`

Defined in: [handles/item.ts:646](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L646)

Moves the item to a point of the map.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point to move it to; its z-coordinate is ignored.

#### Returns

`void`

#### Native

[SetItemPosition](/typings/3.0.0/functions/SetItemPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPosition))

***

### setPosition()

> **setPosition**(`x`, `y`): `void`

Defined in: [handles/item.ts:656](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L656)

Moves the item to the given coordinates.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`void`

#### Native

[SetItemPosition](/typings/3.0.0/functions/SetItemPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemPosition))

***

### chooseRandomWithFilter()

> `static` **chooseRandomWithFilter**(`type`, `level`, `equipmentType`, `tag`): `Rawcode`\<`"item"`\>

Defined in: [handles/item.ts:678](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L678)

Picks a random item type that matches every filter given.

#### Parameters

##### type

`itemtype`

The classification, such as `ITEM_TYPE_PERMANENT`, or
`ITEM_TYPE_ANY` for every one.

##### level

`number`

The item level; -1 for any level.

##### equipmentType

[`EquipmentType`](../enumerations/EquipmentType.md)

The equipment type, or `EquipmentType.Any` for
every one.

##### tag

[`ItemTag`](../enumerations/ItemTag.md)

The tag, or `ItemTag.Any` for every one.

#### Returns

`Rawcode`\<`"item"`\>

The rawcode of the item type chosen, such as Claws of Attack
+15's, `FourCC("ratf")`, or 0 when no item type matches.

#### Remarks

It returns an id, not a Handle, so it is not a lookup: it creates
nothing, and chooses among every item type of the map, not among the
items placed on it.

#### Native

[ChooseRandomItemExWithFilter](/typings/3.0.0/functions/ChooseRandomItemExWithFilter) ([jassbot](https://lep.duckdns.org/jassbot/doc/ChooseRandomItemExWithFilter))

#### Native

[ConvertEquipmentType](/typings/3.0.0/functions/ConvertEquipmentType) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertEquipmentType))

#### Native

[ConvertItemTag](/typings/3.0.0/functions/ConvertItemTag) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertItemTag))

***

### create()

> `static` **create**(`itemId`, `x`, `y`, `skinId?`): `Item`

Defined in: [handles/item.ts:39](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L39)

Creates an item on the map at the given point.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Claws of Attack +15's,
`FourCC("ratf")`.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### skinId?

`Rawcode`\<`"item"`\>

The skin's rawcode, such as Boots of Speed's,
`FourCC("bspd")`; the item type's own model when left out.

#### Returns

`Item`

The new item.

#### Throws

When the game returns no handle, for example an unknown rawcode:
`reforged-ts: failed to create Item (<rawcode>)`, at the calling line.

#### Native

[CreateItem](/typings/3.0.0/functions/CreateItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateItem))

#### Native

[BlzCreateItemWithSkin](/typings/3.0.0/functions/BlzCreateItemWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateItemWithSkin))

***

### fromAbsorbing()

> `static` **fromAbsorbing**(): `Item` \| `undefined`

Defined in: [handles/item.ts:698](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L698)

Gets the stacking item that absorbs a picked-up item.

#### Returns

`Item` \| `undefined`

The absorbing item, or `undefined` outside a pickup event or
when the picked-up item stacks with none.

#### Native

[BlzGetAbsorbingItem](/typings/3.0.0/functions/BlzGetAbsorbingItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetAbsorbingItem))

***

### fromEnum()

> `static` **fromEnum**(): `Item` \| `undefined`

Defined in: [handles/item.ts:707](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L707)

Gets the item an item enumeration is at.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside an enumeration.

#### Native

[GetEnumItem](/typings/3.0.0/functions/GetEnumItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumItem))

***

### fromEquipped()

> `static` **fromEquipped**(): `Item` \| `undefined`

Defined in: [handles/item.ts:716](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L716)

Gets the item a unit equips.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside an equip event.

#### Native

[GetEquippedItem](/typings/3.0.0/functions/GetEquippedItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEquippedItem))

***

### fromEvent()

> `static` **fromEvent**(): `Item` \| `undefined`

Defined in: [handles/item.ts:725](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L725)

Gets the item a unit picks up, drops or uses.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a pickup, drop or use event.

#### Native

[GetManipulatedItem](/typings/3.0.0/functions/GetManipulatedItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetManipulatedItem))

#### Overrides

[`Widget`](Widget.md).[`fromEvent`](Widget.md#fromevent)

***

### fromFilter()

> `static` **fromFilter**(): `Item` \| `undefined`

Defined in: [handles/item.ts:734](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L734)

Gets the item an item enumeration's filter is testing.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a filter.

#### Native

[GetFilterItem](/typings/3.0.0/functions/GetFilterItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFilterItem))

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

[`Widget`](Widget.md).[`fromHandle`](Widget.md#fromhandle)

***

### fromOrderTarget()

> `static` **fromOrderTarget**(): `Item` \| `undefined`

Defined in: [handles/item.ts:744](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L744)

Gets the item a target order targets.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a target order or when the
target is not an item.

#### Native

[GetOrderTargetItem](/typings/3.0.0/functions/GetOrderTargetItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderTargetItem))

#### Overrides

[`Widget`](Widget.md).[`fromOrderTarget`](Widget.md#fromordertarget)

***

### fromSold()

> `static` **fromSold**(): `Item` \| `undefined`

Defined in: [handles/item.ts:763](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L763)

Gets the item a shop sells or a unit pawns.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a sell or pawn event.

#### Native

[GetSoldItem](/typings/3.0.0/functions/GetSoldItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoldItem))

***

### fromSpellTarget()

> `static` **fromSpellTarget**(): `Item` \| `undefined`

Defined in: [handles/item.ts:754](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L754)

Gets the item a spell targets.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a spell event or when the
spell targets no item.

#### Native

[GetSpellTargetItem](/typings/3.0.0/functions/GetSpellTargetItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellTargetItem))

***

### fromStackingSource()

> `static` **fromStackingSource**(): `Item` \| `undefined`

Defined in: [handles/item.ts:772](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L772)

Gets the item that loses its charges to another when items stack.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a stack event.

#### Native

[BlzGetStackingItemSource](/typings/3.0.0/functions/BlzGetStackingItemSource) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetStackingItemSource))

***

### fromStackingTarget()

> `static` **fromStackingTarget**(): `Item` \| `undefined`

Defined in: [handles/item.ts:781](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L781)

Gets the item that gains the charges when items stack.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside a stack event.

#### Native

[BlzGetStackingItemTarget](/typings/3.0.0/functions/BlzGetStackingItemTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetStackingItemTarget))

***

### fromUnequipped()

> `static` **fromUnequipped**(): `Item` \| `undefined`

Defined in: [handles/item.ts:790](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L790)

Gets the item a unit unequips.

#### Returns

`Item` \| `undefined`

The item, or `undefined` outside an unequip event.

#### Native

[GetUnequippedItem](/typings/3.0.0/functions/GetUnequippedItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnequippedItem))

***

### isIdPawnable()

> `static` **isIdPawnable**(`itemId`): `boolean`

Defined in: [handles/item.ts:801](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L801)

Tells whether a unit can sell items of a type to a shop (pawn them).

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Claws of Attack +15's,
`FourCC("ratf")`.

#### Returns

`boolean`

`true` when items of that type can be pawned.

#### Native

[IsItemIdPawnable](/typings/3.0.0/functions/IsItemIdPawnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemIdPawnable))

***

### isIdPowerup()

> `static` **isIdPowerup**(`itemId`): `boolean`

Defined in: [handles/item.ts:812](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L812)

Tells whether items of a type are power-ups, used at once when picked up.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Tome of Agility's,
`FourCC("tdex")`.

#### Returns

`boolean`

`true` when items of that type are power-ups.

#### Native

[IsItemIdPowerup](/typings/3.0.0/functions/IsItemIdPowerup) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemIdPowerup))

***

### isIdSellable()

> `static` **isIdSellable**(`itemId`): `boolean`

Defined in: [handles/item.ts:824](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/item.ts#L824)

Tells whether a shop can sell items of a type, as a marketplace's random
stock.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Claws of Attack +15's,
`FourCC("ratf")`.

#### Returns

`boolean`

`true` when items of that type are sellable.

#### Native

[IsItemIdSellable](/typings/3.0.0/functions/IsItemIdSellable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsItemIdSellable))
