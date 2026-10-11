# Variable: deathOf

> `readonly` **deathOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `killer`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/death.ts:31](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/death.ts#L31)

The event of `death` on one Unit: `unit` dies; `killer` is undefined when
nothing killed it.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `killer`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

## Example

**A bounty paid to the killer's owner**

```ts
/**
 * Pays 10 gold per level of each unit killed to the killer's owner, until
 * the Subscription ends. `killer` is undefined when no unit killed it; a
 * unit killed by its own owner's units pays nothing either.
 */
export function startBounties(): Subscription {
  return on(
    UnitEvents.death,
    ({ unit, killer }) => {
      if (killer === undefined) {
        return;
      }
      const owner = killer.getOwner();
      const gold = owner.getState(PLAYER_STATE_RESOURCE_GOLD);
      owner.setState(PLAYER_STATE_RESOURCE_GOLD, gold + 10 * unit.level);
    },
    ({ unit, killer }) => killer?.getOwner() !== unit.getOwner(),
  );
}
```

## Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
