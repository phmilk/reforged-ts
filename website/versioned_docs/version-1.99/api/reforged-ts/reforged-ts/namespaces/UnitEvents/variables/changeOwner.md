# Variable: changeOwner

> `readonly` **changeOwner**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `previousOwner`: [`MapPlayer`](../../../../classes/MapPlayer.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/ownership.ts:17](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/ownership.ts#L17)

A unit changes owner; `previousOwner` is the player it had.
Every field is set.

## Example

**Telling a player their unit was taken**

```ts
/**
 * Tells a player when one of their units is taken: `previousOwner` is the
 * player the unit had, `unit.getOwner()` the one it has now.
 */
export function reportTheft(): Subscription {
  return on(UnitEvents.changeOwner, ({ unit, previousOwner }) => {
    previousOwner.displayText(
      0,
      0,
      `${unit.getOwner().name} took your ${unit.name}`,
    );
  });
}
```

## Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
