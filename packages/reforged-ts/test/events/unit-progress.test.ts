/** @noSelfInFile */

// The progress rows of UnitEvents (trainFinish, constructFinish,
// researchFinish, upgradeFinish, heroLevel, heroSkill) and their Of twins
// through on(), and the lookups they read the trained, constructed and
// leveling unit with: the suites of support/events.ts, which fire the
// Subscription's Trigger with a stubbed context and observe the call log and
// what the handler received.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const barracks = Unit.create(owner, FourCC("hbar"), 0, 0);
const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
hero.setHeroLevel(3, false);
const research = FourCC("Rhme");
const skill = FourCC("AHhb");

/** The lines of `trigger` registering the player-unit `event` every slot. */
function anyUnit(trigger: string, event: string) {
  return everySlot(
    (player) =>
      `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, ${event}, nil)`,
  );
}

/** The line of `trigger` registering the unit `event` on `unit`. */
function unitOf(trigger: string, unit: Unit, event: string) {
  return [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", unit.handle)}, ${event})`,
  ];
}

describeDescriptor({
  name: "UnitEvents.trainFinish",
  descriptor: UnitEvents.trainFinish,
  registers: (trigger) => anyUnit(trigger, "EVENT_PLAYER_UNIT_TRAIN_FINISH"),
  context: { GetTriggerUnit: barracks.handle, GetTrainedUnit: footman.handle },
  payload: { trainer: barracks, trained: footman },
  required: [
    ["trainer", "GetTriggerUnit"],
    ["trained", "GetTrainedUnit"],
  ],
});

describeDescriptor({
  name: "UnitEvents.trainFinishOf",
  descriptor: UnitEvents.trainFinishOf(barracks),
  registers: (trigger) => unitOf(trigger, barracks, "EVENT_UNIT_TRAIN_FINISH"),
  context: { GetTrainedUnit: footman.handle },
  payload: { trainer: barracks, trained: footman },
  required: [["trained", "GetTrainedUnit"]],
});

describeDescriptor({
  name: "UnitEvents.constructFinish",
  descriptor: UnitEvents.constructFinish,
  registers: (trigger) =>
    anyUnit(trigger, "EVENT_PLAYER_UNIT_CONSTRUCT_FINISH"),
  context: { GetConstructedStructure: barracks.handle },
  payload: { structure: barracks },
  required: [["structure", "GetConstructedStructure"]],
});

describeDescriptor({
  name: "UnitEvents.constructFinishOf",
  descriptor: UnitEvents.constructFinishOf(barracks),
  registers: (trigger) =>
    unitOf(trigger, barracks, "EVENT_UNIT_CONSTRUCT_FINISH"),
  context: {},
  payload: { structure: barracks },
});

describeDescriptor({
  name: "UnitEvents.researchFinish",
  descriptor: UnitEvents.researchFinish,
  registers: (trigger) => anyUnit(trigger, "EVENT_PLAYER_UNIT_RESEARCH_FINISH"),
  context: { GetTriggerUnit: barracks.handle, GetResearched: research },
  payload: { unit: barracks, researched: research },
  required: [["unit", "GetTriggerUnit"]],
});

describeDescriptor({
  name: "UnitEvents.researchFinishOf",
  descriptor: UnitEvents.researchFinishOf(barracks),
  registers: (trigger) =>
    unitOf(trigger, barracks, "EVENT_UNIT_RESEARCH_FINISH"),
  context: { GetResearched: research },
  payload: { unit: barracks, researched: research },
});

describeDescriptor({
  name: "UnitEvents.upgradeFinish",
  descriptor: UnitEvents.upgradeFinish,
  registers: (trigger) => anyUnit(trigger, "EVENT_PLAYER_UNIT_UPGRADE_FINISH"),
  context: { GetTriggerUnit: barracks.handle },
  payload: { unit: barracks },
  required: [["unit", "GetTriggerUnit"]],
});

describeDescriptor({
  name: "UnitEvents.upgradeFinishOf",
  descriptor: UnitEvents.upgradeFinishOf(barracks),
  registers: (trigger) =>
    unitOf(trigger, barracks, "EVENT_UNIT_UPGRADE_FINISH"),
  context: {},
  payload: { unit: barracks },
});

describeDescriptor({
  name: "UnitEvents.heroLevel",
  descriptor: UnitEvents.heroLevel,
  registers: (trigger) => anyUnit(trigger, "EVENT_PLAYER_HERO_LEVEL"),
  context: { GetLevelingUnit: hero.handle },
  payload: { unit: hero, level: 3 },
  required: [["unit", "GetLevelingUnit"]],
});

describeDescriptor({
  name: "UnitEvents.heroLevelOf",
  descriptor: UnitEvents.heroLevelOf(hero),
  registers: (trigger) => unitOf(trigger, hero, "EVENT_UNIT_HERO_LEVEL"),
  context: {},
  payload: { unit: hero, level: 3 },
});

describeDescriptor({
  name: "UnitEvents.heroSkill",
  descriptor: UnitEvents.heroSkill,
  registers: (trigger) => anyUnit(trigger, "EVENT_PLAYER_HERO_SKILL"),
  context: { GetTriggerUnit: hero.handle, GetLearnedSkill: skill },
  payload: { unit: hero, abilityId: skill },
  required: [["unit", "GetTriggerUnit"]],
});

describeDescriptor({
  name: "UnitEvents.heroSkillOf",
  descriptor: UnitEvents.heroSkillOf(hero),
  registers: (trigger) => unitOf(trigger, hero, "EVENT_UNIT_HERO_SKILL"),
  context: { GetLearnedSkill: skill },
  payload: { unit: hero, abilityId: skill },
});

describeLookup({
  name: "Unit.fromTrained",
  lookup: () => Unit.fromTrained(),
  context: { GetTrainedUnit: footman.handle },
  expected: footman,
});

describeLookup({
  name: "Unit.fromConstructed",
  lookup: () => Unit.fromConstructed(),
  context: { GetConstructedStructure: barracks.handle },
  expected: barracks,
});

describeLookup({
  name: "Unit.fromLeveling",
  lookup: () => Unit.fromLeveling(),
  context: { GetLevelingUnit: hero.handle },
  expected: hero,
});
