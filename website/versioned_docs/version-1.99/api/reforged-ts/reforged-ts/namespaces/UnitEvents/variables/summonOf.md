# Variable: summonOf

> `readonly` **summonOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `summoned`: [`Unit`](../../../../classes/Unit.md); `summoner`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/summon.ts:36](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/summon.ts#L36)

The event of `summon` on one Unit: registers `EVENT_UNIT_SUMMON` on
`unit`, meant as the summoner. Which unit the game fires it for is
unverified in-game (the Patch documents only the player-unit event), so
its payload reads the summoner and the summoned unit from the Natives,
as `summon` does.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `summoned`: [`Unit`](../../../../classes/Unit.md); `summoner`: [`Unit`](../../../../classes/Unit.md); \}\>

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

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
