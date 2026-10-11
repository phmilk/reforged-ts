# Variable: loadedOf

> `readonly` **loadedOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `transport`: [`Unit`](../../../../classes/Unit.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/transport.ts:36](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/transport.ts#L36)

The event of `loaded` on one Unit: registers `EVENT_UNIT_LOADED` on
`unit`, meant as the loaded unit. Which unit the game fires it for (the
loaded unit or the transport) is unverified in-game (the Patch documents
only the player-unit event), so its payload reads the loaded unit and
the transport from the Natives, as `loaded` does.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `transport`: [`Unit`](../../../../classes/Unit.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

## Example

**Reporting units boarding a transport**

```ts
/**
 * Reports each unit loaded into a transport. Both units are set: `unit` is
 * the one loaded, `transport` the one carrying it.
 */
export function reportBoarding(): Subscription {
  return on(UnitEvents.loaded, ({ unit, transport }) => {
    print(`${unit.name} boarded ${transport.name}`);
  });
}
```

## Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
