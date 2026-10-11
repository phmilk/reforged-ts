# Variable: selected

> `readonly` **selected**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `player`: [`MapPlayer`](../../../../classes/MapPlayer.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/selection.ts:16](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/selection.ts#L16)

`player` selects a unit.
Every field is set.

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

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
