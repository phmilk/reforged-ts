# Variable: pawnItem

> `readonly` **pawnItem**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `item`: [`Item`](../../../../classes/Item.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/item.ts:112](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/item.ts#L112)

A unit pawns an item to a shop: `unit` is the pawning unit and `item` the
pawned item, read with `GetSoldItem`: the Patch lists no response for
this event, and a pawn is the item sale seen from the unit.

## Example

**Watching a hero's items**

```ts
/**
 * Reports what one hero does with its items, and every sale of any shop,
 * until the returned Subscriptions end. Every field of an item payload is
 * set; `sellItem`'s `unit` is the shop that sold the item.
 */
export function watchInventory(hero: Unit): Subscription[] {
  return [
    on(UnitEvents.pickupItemOf(hero), ({ item }) => {
      print(`Picked up ${item.name}`);
    }),
    on(UnitEvents.dropItemOf(hero), ({ item }) => {
      print(`Dropped ${item.name}`);
    }),
    on(UnitEvents.useItemOf(hero), ({ item }) => {
      print(`Used ${item.name}, ${String(item.charges)} charges left`);
    }),
    on(UnitEvents.pawnItemOf(hero), ({ item }) => {
      print(`Pawned ${item.name}`);
    }),
    on(UnitEvents.equipOf(hero), ({ item }) => {
      print(`Equipped ${item.name}`);
    }),
    on(UnitEvents.unequipOf(hero), ({ item }) => {
      print(`Unequipped ${item.name}`);
    }),
    on(UnitEvents.sellItem, ({ unit: shop, item }) => {
      print(`${shop.name} sold ${item.name}`);
    }),
  ];
}
```

## Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
