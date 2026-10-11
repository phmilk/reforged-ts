# UnitEvents

The unit Event descriptors: `UnitEvents.death` for every player's units,
`UnitEvents.deathOf(unit)` for one Unit.

## Remarks

- `UnitEvents.name` registers the player-unit event for the player in
  every slot (`TriggerRegisterPlayerUnitEvent`); `UnitEvents.nameOf(unit)`
  registers the unit event on that Unit (`TriggerRegisterUnitEvent`), and
  exists only where the Patch has one (there is no `orderUnitOf`).
- Every payload field is set unless the member's comment says it can be
  `undefined`: the killer of `death`, the damage source of `damaged` and
  `damaging`, the order targets, the spell targets.
- Dealing damage from a `damaged` or `damaging` handler fires them again:
  in Dev mode such a handler runs one level deeper in the damage depth
  `Unit.damageTarget` checks.

## Example

**A handler with a filter**

```ts
Init.onTriggers(() => {
  // Every hero's death, whoever owns it: `killer` is undefined when no unit
  // killed it.
  on(
    UnitEvents.death,
    ({ unit, killer }) => {
      print(`${unit.name} fell to ${killer?.name ?? "no unit"}`);
    },
    ({ unit }) => unit.isUnitType(UNIT_TYPE_HERO),
  );
});
```

## Variables

- [attacked](variables/attacked.md)
- [attackedOf](variables/attackedOf.md)
- [changeOwner](variables/changeOwner.md)
- [changeOwnerOf](variables/changeOwnerOf.md)
- [constructFinish](variables/constructFinish.md)
- [constructFinishOf](variables/constructFinishOf.md)
- [damaged](variables/damaged.md)
- [damagedOf](variables/damagedOf.md)
- [damaging](variables/damaging.md)
- [damagingOf](variables/damagingOf.md)
- [death](variables/death.md)
- [deathOf](variables/deathOf.md)
- [deselected](variables/deselected.md)
- [deselectedOf](variables/deselectedOf.md)
- [dropItem](variables/dropItem.md)
- [dropItemOf](variables/dropItemOf.md)
- [equip](variables/equip.md)
- [equipOf](variables/equipOf.md)
- [heroLevel](variables/heroLevel.md)
- [heroLevelOf](variables/heroLevelOf.md)
- [heroSkill](variables/heroSkill.md)
- [heroSkillOf](variables/heroSkillOf.md)
- [loaded](variables/loaded.md)
- [loadedOf](variables/loadedOf.md)
- [orderIssued](variables/orderIssued.md)
- [orderIssuedOf](variables/orderIssuedOf.md)
- [orderPoint](variables/orderPoint.md)
- [orderPointOf](variables/orderPointOf.md)
- [orderTarget](variables/orderTarget.md)
- [orderTargetOf](variables/orderTargetOf.md)
- [orderUnit](variables/orderUnit.md)
- [pawnItem](variables/pawnItem.md)
- [pawnItemOf](variables/pawnItemOf.md)
- [pickupItem](variables/pickupItem.md)
- [pickupItemOf](variables/pickupItemOf.md)
- [researchFinish](variables/researchFinish.md)
- [researchFinishOf](variables/researchFinishOf.md)
- [selected](variables/selected.md)
- [selectedOf](variables/selectedOf.md)
- [sellItem](variables/sellItem.md)
- [sellItemOf](variables/sellItemOf.md)
- [spellCast](variables/spellCast.md)
- [spellCastOf](variables/spellCastOf.md)
- [spellChannel](variables/spellChannel.md)
- [spellChannelOf](variables/spellChannelOf.md)
- [spellEffect](variables/spellEffect.md)
- [spellEffectOf](variables/spellEffectOf.md)
- [spellEndcast](variables/spellEndcast.md)
- [spellEndcastOf](variables/spellEndcastOf.md)
- [spellFinish](variables/spellFinish.md)
- [spellFinishOf](variables/spellFinishOf.md)
- [summon](variables/summon.md)
- [summonOf](variables/summonOf.md)
- [trainFinish](variables/trainFinish.md)
- [trainFinishOf](variables/trainFinishOf.md)
- [unequip](variables/unequip.md)
- [unequipOf](variables/unequipOf.md)
- [upgradeFinish](variables/upgradeFinish.md)
- [upgradeFinishOf](variables/upgradeFinishOf.md)
- [useItem](variables/useItem.md)
- [useItemOf](variables/useItemOf.md)
