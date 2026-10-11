# Variable: selectedOf

> `readonly` **selectedOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `player`: [`MapPlayer`](../../../../classes/MapPlayer.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/selection.ts:33](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/selection.ts#L33)

The event of `selected` on one Unit: `player` selects `unit`.
Every field is set.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `player`: [`MapPlayer`](../../../../classes/MapPlayer.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

## Example

**Counting who selects a unit**

```ts
/**
 * Counts how many players have `unit` selected, until the Subscriptions
 * end. `player` is the one who selected or deselected it.
 */
export function countSelections(unit: Unit): Subscription[] {
  let selectedBy = 0;
  return [
    on(UnitEvents.selectedOf(unit), ({ player }) => {
      selectedBy++;
      print(`${player.name} selected it: ${String(selectedBy)} now`);
    }),
    on(UnitEvents.deselectedOf(unit), () => {
      selectedBy--;
    }),
  ];
}
```

## Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
