// The attacked and damage payloads: the attacker, the target and the three
// damage types are guaranteed, the damage source may be undefined; the Of
// twins take a Unit, and the combat lookups may find nothing.
import type { EventDescriptor } from "reforged-ts";
import { on, Unit, UnitEvents } from "reforged-ts";

declare const hero: Unit;

interface Damage {
  source: Unit | undefined;
  target: Unit;
  amount: number;
  attackType: attacktype;
  damageType: damagetype;
  weaponType: weapontype;
  isAttack: boolean;
}

const attacked = on(UnitEvents.attacked, ({ unit, attacker }) => {
  const attackedUnit: Unit = unit;
  const by: Unit = attacker;
  attackedUnit.kill();
  by.kill();
});

const damaged = on(
  UnitEvents.damaged,
  ({
    source,
    target,
    amount,
    attackType,
    damageType,
    weaponType,
    isAttack,
  }) => {
    const from: Unit | undefined = source;
    const to: Unit = target;
    const dealt: number = amount;
    const attack: attacktype = attackType;
    const kind: damagetype = damageType;
    const weapon: weapontype = weaponType;
    const fromAttack: boolean = isAttack;
    from?.kill();
    to.kill();
    print(dealt, attack, kind, weapon, fromAttack);
  },
);

const damaging: EventDescriptor<Damage> = UnitEvents.damaging;
const ofHero: EventDescriptor<{ unit: Unit; attacker: Unit }> =
  UnitEvents.attackedOf(hero);
const damagedOf: EventDescriptor<Damage> = UnitEvents.damagedOf(hero);
const damagingOf: EventDescriptor<Damage> = UnitEvents.damagingOf(hero);
const flag: true | undefined = UnitEvents.damaged.damage;

const lookups: (Unit | undefined)[] = [
  Unit.fromAttacker(),
  Unit.fromDamageSource(),
  Unit.fromDamageTarget(),
];

export {
  attacked,
  damaged,
  damaging,
  ofHero,
  damagedOf,
  damagingOf,
  flag,
  lookups,
};
