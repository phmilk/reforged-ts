# Variable: loaded

> `readonly` **loaded**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `transport`: [`Unit`](../../../../classes/Unit.md); `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/transport.ts:15](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/transport.ts#L15)

A unit is loaded into `transport`.

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

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
