# Variable: spellCastOf

> `readonly` **spellCastOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `abilityId`: `Rawcode`\<`"ability"`\>; `caster`: [`Unit`](../../../../classes/Unit.md); `targetDestructable`: [`Destructable`](../../../../classes/Destructable.md) \| `undefined`; `targetItem`: [`Item`](../../../../classes/Item.md) \| `undefined`; `targetUnit`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `targetX`: `number`; `targetY`: `number`; \}\>

Defined in: [events/unit/spell.ts:79](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/spell.ts#L79)

The event of `spellCast` on one Unit: `unit` begins casting a spell.
`targetUnit`, `targetItem` and `targetDestructable` are undefined
unless the spell targets one of that kind.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `abilityId`: `Rawcode`\<`"ability"`\>; `caster`: [`Unit`](../../../../classes/Unit.md); `targetDestructable`: [`Destructable`](../../../../classes/Destructable.md) \| `undefined`; `targetItem`: [`Item`](../../../../classes/Item.md) \| `undefined`; `targetUnit`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `targetX`: `number`; `targetY`: `number`; \}\>

## Example

**Following a spell from channel to end**

```ts
/**
 * Follows every spell from its channel to its end. `targetX` and `targetY`
 * are always set; `targetUnit`, `targetItem` and `targetDestructable` are
 * undefined unless the spell targets one of that kind. `spellEffect` is the
 * one to act on: its cost is paid and its cooldown started.
 */
export function traceSpells(): Subscription[] {
  return [
    on(UnitEvents.spellChannel, ({ caster, abilityId }) => {
      print(`${caster.name} channels ${String(abilityId)}`);
    }),
    on(UnitEvents.spellCast, ({ targetX, targetY }) => {
      print(`Cast at ${targetX.toFixed(0)}, ${targetY.toFixed(0)}`);
    }),
    on(
      UnitEvents.spellEffect,
      ({ targetUnit, targetItem, targetDestructable }) => {
        const target =
          targetUnit?.name ?? targetItem?.name ?? targetDestructable?.name;
        print(
          target === undefined ? "Effect on the ground" : `Effect on ${target}`,
        );
      },
    ),
    on(UnitEvents.spellFinish, ({ caster }) => {
      print(`${caster.name} finished casting`);
    }),
    on(UnitEvents.spellEndcast, ({ caster }) => {
      print(`${caster.name} stopped casting`);
    }),
  ];
}
```

## Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
