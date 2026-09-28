/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/**
 * The progress rows of UnitEvents: training, construction, research and
 * upgrades finished, hero levels and skills.
 */
export const progressRows = unitEventRows({
  /**
   * A unit finishes training `trained`.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  trainFinish: {
    event: EVENT_PLAYER_UNIT_TRAIN_FINISH,
    unit: "trainer",
    read: (trainer, event) => ({
      /** The unit that trained `trained`. */
      trainer,
      /** The trained unit. */
      trained: required(Unit.fromTrained(), "trained", event),
    }),
  },
  /**
   * The event of `trainFinish` on one Unit: `unit` finishes training
   * `trained`. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  trainFinishOf: { twinOf: "trainFinish", event: EVENT_UNIT_TRAIN_FINISH },
  /**
   * A structure finishes construction.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  constructFinish: {
    event: EVENT_PLAYER_UNIT_CONSTRUCT_FINISH,
    unit: "structure",
    from: () => Unit.fromConstructed(),
    read: (structure) => ({
      /** The constructed structure. */
      structure,
    }),
  },
  /**
   * The event of `constructFinish` on one Unit: the structure `unit` finishes
   * construction. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  constructFinishOf: {
    twinOf: "constructFinish",
    event: EVENT_UNIT_CONSTRUCT_FINISH,
  },
  /**
   * A unit finishes a research; `researched` is its id.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  researchFinish: {
    event: EVENT_PLAYER_UNIT_RESEARCH_FINISH,
    unit: "unit",
    read: (unit) => ({
      /** The researching unit. */
      unit,
      /** The id of the finished research. */
      researched: GetResearched(),
    }),
  },
  /**
   * The event of `researchFinish` on one Unit: `unit` finishes a research;
   * `researched` is its id. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  researchFinishOf: {
    twinOf: "researchFinish",
    event: EVENT_UNIT_RESEARCH_FINISH,
  },
  /**
   * A unit finishes upgrading.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  upgradeFinish: {
    event: EVENT_PLAYER_UNIT_UPGRADE_FINISH,
    unit: "unit",
    read: (unit) => ({
      /** The upgraded unit. */
      unit,
    }),
  },
  /**
   * The event of `upgradeFinish` on one Unit: `unit` finishes upgrading.
   * Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  upgradeFinishOf: {
    twinOf: "upgradeFinish",
    event: EVENT_UNIT_UPGRADE_FINISH,
  },
  /**
   * A hero gains a level; `level` is its level after the gain.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  heroLevel: {
    event: EVENT_PLAYER_HERO_LEVEL,
    unit: "unit",
    from: () => Unit.fromLeveling(),
    read: (unit) => ({
      /** The hero gaining the level. */
      unit,
      /** The hero's level after the gain. */
      level: unit.getHeroLevel(),
    }),
  },
  /**
   * The event of `heroLevel` on one Unit: the hero `unit` gains a level;
   * `level` is its level after the gain. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  heroLevelOf: { twinOf: "heroLevel", event: EVENT_UNIT_HERO_LEVEL },
  /**
   * A hero learns the skill `abilityId`.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  heroSkill: {
    event: EVENT_PLAYER_HERO_SKILL,
    unit: "unit",
    read: (unit) => ({
      /** The hero learning the skill. */
      unit,
      /** The id of the learned skill. */
      abilityId: GetLearnedSkill(),
    }),
  },
  /**
   * The event of `heroSkill` on one Unit: the hero `unit` learns the skill
   * `abilityId`. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  heroSkillOf: { twinOf: "heroSkill", event: EVENT_UNIT_HERO_SKILL },
});
