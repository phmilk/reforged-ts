/** @noSelfInFile */

// UnitEvents.attacked, damaged and damaging with their Of twins, the lookups
// that read the attacker and the two sides of the damage, and the damage flag
// across the whole UnitEvents table: the suites of support/events.ts, which
// fire the Subscription's Trigger with a stubbed context and observe the call
// log and what the handler received.

import { describe, expect, it } from "reforged-test/lua";
import type { EventDescriptor } from "../../src/index";
import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const target = Unit.create(owner, FourCC("hfoo"), 0, 0);
const attacker = Unit.create(owner, FourCC("hfoo"), 0, 0);

describeDescriptor({
  name: "UnitEvents.attacked",
  descriptor: UnitEvents.attacked,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ATTACKED, nil)`,
    ),
  context: { GetTriggerUnit: target.handle, GetAttacker: attacker.handle },
  payload: { unit: target, attacker },
  required: [
    ["unit", "GetTriggerUnit"],
    ["attacker", "GetAttacker"],
  ],
});

describeDescriptor({
  name: "UnitEvents.attackedOf",
  descriptor: UnitEvents.attackedOf(target),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", target.handle)}, EVENT_UNIT_ATTACKED)`,
  ],
  context: { GetAttacker: attacker.handle },
  payload: { unit: target, attacker },
  required: [["attacker", "GetAttacker"]],
});

/** The firing context of a damage event, but for the target. */
const damageContext = {
  GetEventDamageSource: attacker.handle,
  GetEventDamage: 12.5,
  BlzGetEventAttackType: ATTACK_TYPE_HERO,
  BlzGetEventDamageType: DAMAGE_TYPE_FIRE,
  BlzGetEventWeaponType: WEAPON_TYPE_METAL_HEAVY_BASH,
  BlzGetEventIsAttack: true,
} satisfies StubContext;

const damagePayload = {
  source: attacker,
  target,
  amount: 12.5,
  attackType: ATTACK_TYPE_HERO,
  damageType: DAMAGE_TYPE_FIRE,
  weaponType: WEAPON_TYPE_METAL_HEAVY_BASH,
  isAttack: true,
};

const damageRequired = [
  ["attackType", "BlzGetEventAttackType"],
  ["damageType", "BlzGetEventDamageType"],
  ["weaponType", "BlzGetEventWeaponType"],
] as const;

for (const [member, playerEvent, unitEvent] of [
  ["damaged", "EVENT_PLAYER_UNIT_DAMAGED", "EVENT_UNIT_DAMAGED"],
  ["damaging", "EVENT_PLAYER_UNIT_DAMAGING", "EVENT_UNIT_DAMAGING"],
] as const) {
  describeDescriptor({
    name: `UnitEvents.${member}`,
    descriptor: UnitEvents[member],
    registers: (trigger) =>
      everySlot(
        (player) =>
          `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, ${playerEvent}, nil)`,
      ),
    context: { ...damageContext, GetTriggerUnit: target.handle },
    payload: damagePayload,
    required: [["target", "GetTriggerUnit"], ...damageRequired],
    optional: [["source", "GetEventDamageSource"]],
    damage: true,
  });

  describeDescriptor({
    name: `UnitEvents.${member}Of`,
    descriptor: UnitEvents[`${member}Of`](target),
    registers: (trigger) => [
      `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", target.handle)}, ${unitEvent})`,
    ],
    context: damageContext,
    payload: damagePayload,
    required: damageRequired,
    optional: [["source", "GetEventDamageSource"]],
    damage: true,
  });
}

describe("UnitEvents damage flag", () => {
  it("is set on damaged and damaging and their twins only", () => {
    const flagged: string[] = [];
    for (const [name, member] of Object.entries<unknown>(UnitEvents)) {
      const descriptor =
        typeof member === "function"
          ? (member as (unit: Unit) => EventDescriptor<unknown>)(target)
          : (member as EventDescriptor<unknown>);
      if (descriptor.damage === true) {
        flagged.push(name);
      }
    }
    expect(flagged.sort()).toEqual([
      "damaged",
      "damagedOf",
      "damaging",
      "damagingOf",
    ]);
  });
});

describeLookup({
  name: "Unit.fromAttacker",
  lookup: () => Unit.fromAttacker(),
  context: { GetAttacker: attacker.handle },
  expected: attacker,
});

describeLookup({
  name: "Unit.fromDamageSource",
  lookup: () => Unit.fromDamageSource(),
  context: { GetEventDamageSource: attacker.handle },
  expected: attacker,
});

describeLookup({
  name: "Unit.fromDamageTarget",
  lookup: () => Unit.fromDamageTarget(),
  context: { BlzGetEventDamageTarget: target.handle },
  expected: target,
});
