/** @noSelfInFile */

// The five UnitEvents spell events with their Of twins, and the lookups that
// read the spell's target unit, item and destructable: the suites of
// support/events.ts, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received.

import {
  Destructable,
  Item,
  MapPlayer,
  Unit,
  UnitEvents,
} from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const caster = Unit.create(owner, FourCC("Hpal"), 0, 0);
const targetUnit = Unit.create(owner, FourCC("hfoo"), 0, 0);
const targetItem = Item.create(FourCC("ratf"), 0, 0);
const targetDestructable = Destructable.create(FourCC("LTlt"), 0, 0);

/** The firing context of a spell event, but for the caster. */
const spellContext = {
  GetSpellAbilityId: FourCC("AHhb"),
  GetSpellTargetUnit: targetUnit.handle,
  GetSpellTargetItem: targetItem.handle,
  GetSpellTargetDestructable: targetDestructable.handle,
  GetSpellTargetX: 128,
  GetSpellTargetY: -64,
} satisfies StubContext;

const spellPayload = {
  caster,
  abilityId: FourCC("AHhb"),
  targetUnit,
  targetItem,
  targetDestructable,
  targetX: 128,
  targetY: -64,
};

const spellOptional = [
  ["targetUnit", "GetSpellTargetUnit"],
  ["targetItem", "GetSpellTargetItem"],
  ["targetDestructable", "GetSpellTargetDestructable"],
] as const;

for (const [member, playerEvent, unitEvent] of [
  [
    "spellChannel",
    "EVENT_PLAYER_UNIT_SPELL_CHANNEL",
    "EVENT_UNIT_SPELL_CHANNEL",
  ],
  ["spellCast", "EVENT_PLAYER_UNIT_SPELL_CAST", "EVENT_UNIT_SPELL_CAST"],
  ["spellEffect", "EVENT_PLAYER_UNIT_SPELL_EFFECT", "EVENT_UNIT_SPELL_EFFECT"],
  ["spellFinish", "EVENT_PLAYER_UNIT_SPELL_FINISH", "EVENT_UNIT_SPELL_FINISH"],
  [
    "spellEndcast",
    "EVENT_PLAYER_UNIT_SPELL_ENDCAST",
    "EVENT_UNIT_SPELL_ENDCAST",
  ],
] as const) {
  describeDescriptor({
    name: `UnitEvents.${member}`,
    descriptor: UnitEvents[member],
    registers: (trigger) =>
      everySlot(
        (player) =>
          `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, ${playerEvent}, nil)`,
      ),
    context: { ...spellContext, GetTriggerUnit: caster.handle },
    payload: spellPayload,
    required: [["caster", "GetTriggerUnit"]],
    optional: spellOptional,
  });

  describeDescriptor({
    name: `UnitEvents.${member}Of`,
    descriptor: UnitEvents[`${member}Of`](caster),
    registers: (trigger) => [
      `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", caster.handle)}, ${unitEvent})`,
    ],
    context: spellContext,
    payload: spellPayload,
    optional: spellOptional,
  });
}

describeLookup({
  name: "Unit.fromSpellTarget",
  lookup: () => Unit.fromSpellTarget(),
  context: { GetSpellTargetUnit: targetUnit.handle },
  expected: targetUnit,
});

describeLookup({
  name: "Item.fromSpellTarget",
  lookup: () => Item.fromSpellTarget(),
  context: { GetSpellTargetItem: targetItem.handle },
  expected: targetItem,
});

describeLookup({
  name: "Destructable.fromSpellTarget",
  lookup: () => Destructable.fromSpellTarget(),
  context: { GetSpellTargetDestructable: targetDestructable.handle },
  expected: targetDestructable,
});
