# Variable: summon

> `readonly` **summon**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `summoned`: [`Unit`](../../../../classes/Unit.md); `summoner`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/summon.ts:15](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/summon.ts#L15)

A unit summons `summoned`.

## Example

**Colouring summoned units**

```ts
/** Gives every summoned unit its summoner's colour. Both units are set. */
export function colourSummons(): Subscription {
  return on(UnitEvents.summon, ({ summoner, summoned }) => {
    summoned.color = summoner.getOwner().color;
  });
}
```

## Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
