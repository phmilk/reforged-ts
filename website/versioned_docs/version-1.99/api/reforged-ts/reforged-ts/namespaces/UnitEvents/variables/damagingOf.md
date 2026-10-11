# Variable: damagingOf

> `readonly` **damagingOf**: (`unit`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `amount`: `number`; `attackType`: `attacktype`; `damageType`: `damagetype`; `isAttack`: `boolean`; `source`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `target`: [`Unit`](../../../../classes/Unit.md); `weaponType`: `weapontype`; \}\>

Defined in: [events/unit/combat.ts:99](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/combat.ts#L99)

The event of `damaging` on one Unit: fires for the damage `unit` is about
to take, not the damage it deals, since the Patch fires the unit event on
the target; `source` is undefined when no unit deals it.

## Parameters

### unit

[`Unit`](../../../../classes/Unit.md)

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `amount`: `number`; `attackType`: `attacktype`; `damageType`: `damagetype`; `isAttack`: `boolean`; `source`: [`Unit`](../../../../classes/Unit.md) \| `undefined`; `target`: [`Unit`](../../../../classes/Unit.md); `weaponType`: `weapontype`; \}\>

## Example

**A boss's shield, ended when it dies**

```ts
/**
 * A boss that takes half damage from units and none from anything else, and
 * names each attacker. The Subscriptions belong to the boss: the death
 * handler ends them all, itself included, once it dies.
 */
export function shieldBoss(boss: Unit): void {
  const attacked = on(UnitEvents.attackedOf(boss), ({ attacker }) => {
    print(`${attacker.name} attacks the boss`);
  });
  // `damaging` runs before the damage lands, while its amount can change;
  // `source` is undefined when no unit deals it, such as a trap.
  const damaging = on(UnitEvents.damagingOf(boss), ({ source, amount }) => {
    BlzSetEventDamage(source === undefined ? 0 : amount / 2);
  });
  // `damaged` runs once it has landed, with the amount the boss took.
  const damaged = on(UnitEvents.damagedOf(boss), ({ amount, isAttack }) => {
    print(
      `The boss took ${amount.toFixed(0)} ${isAttack ? "from an attack" : "damage"}`,
    );
  });
  const death = on(UnitEvents.deathOf(boss), () => {
    for (const subscription of [attacked, damaging, damaged, death]) {
      subscription.destroy();
    }
  });
}
```

## Native

[TriggerRegisterUnitEvent](/typings/3.0.0/functions/TriggerRegisterUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterUnitEvent))
