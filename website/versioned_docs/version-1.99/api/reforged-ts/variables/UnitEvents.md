# Variable: UnitEvents

> `const` **UnitEvents**: [`UnitEventDescriptors`](../type-aliases/UnitEventDescriptors.md)\<`TableOf`\<`Groups`\>\>

Defined in: [events/unit/index.ts:63](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/unit/index.ts#L63)

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
