// The spell payload: the caster, the ability id and the target point are
// guaranteed, the target unit, item and destructable may be undefined; the Of
// twins take a Unit, and the spell-target lookups may find nothing.
import type { EventDescriptor } from "reforged-ts";
import { Destructable, Item, on, Unit, UnitEvents } from "reforged-ts";

declare const hero: Unit;

interface Spell {
  caster: Unit;
  abilityId: number;
  targetUnit: Unit | undefined;
  targetItem: Item | undefined;
  targetDestructable: Destructable | undefined;
  targetX: number;
  targetY: number;
}

const effect = on(
  UnitEvents.spellEffect,
  ({
    caster,
    abilityId,
    targetUnit,
    targetItem,
    targetDestructable,
    targetX,
    targetY,
  }) => {
    const by: Unit = caster;
    const id: number = abilityId;
    const unitTarget: Unit | undefined = targetUnit;
    const itemTarget: Item | undefined = targetItem;
    const treeTarget: Destructable | undefined = targetDestructable;
    const x: number = targetX;
    const y: number = targetY;
    by.kill();
    unitTarget?.kill();
    itemTarget?.destroy();
    treeTarget?.kill();
    print(id, x, y);
  },
);

const any: EventDescriptor<Spell>[] = [
  UnitEvents.spellChannel,
  UnitEvents.spellCast,
  UnitEvents.spellEffect,
  UnitEvents.spellFinish,
  UnitEvents.spellEndcast,
];
const ofHero: EventDescriptor<Spell>[] = [
  UnitEvents.spellChannelOf(hero),
  UnitEvents.spellCastOf(hero),
  UnitEvents.spellEffectOf(hero),
  UnitEvents.spellFinishOf(hero),
  UnitEvents.spellEndcastOf(hero),
];

const unitTarget: Unit | undefined = Unit.fromSpellTarget();
const itemTarget: Item | undefined = Item.fromSpellTarget();
const treeTarget: Destructable | undefined = Destructable.fromSpellTarget();

export { effect, any, ofHero, unitTarget, itemTarget, treeTarget };
