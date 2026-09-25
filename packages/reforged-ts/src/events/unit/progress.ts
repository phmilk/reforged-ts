/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/**
 * The progress rows of UnitEvents: training, construction, research and
 * upgrades finished, hero levels and skills.
 */
export const progressRows = unitEventRows({
  /** A unit finishes training `trained`. */
  trainFinish: {
    event: EVENT_PLAYER_UNIT_TRAIN_FINISH,
    twin: EVENT_UNIT_TRAIN_FINISH,
    unit: "trainer",
    read: (trainer, event) => ({
      trainer,
      trained: required(Unit.fromTrained(), "trained", event),
    }),
  },
  /** A structure finishes construction. */
  constructFinish: {
    event: EVENT_PLAYER_UNIT_CONSTRUCT_FINISH,
    twin: EVENT_UNIT_CONSTRUCT_FINISH,
    unit: "structure",
    from: () => Unit.fromConstructed(),
    read: (structure) => ({ structure }),
  },
  /** A unit finishes a research; `researched` is its id. */
  researchFinish: {
    event: EVENT_PLAYER_UNIT_RESEARCH_FINISH,
    twin: EVENT_UNIT_RESEARCH_FINISH,
    unit: "unit",
    read: (unit) => ({ unit, researched: GetResearched() }),
  },
  /** A unit finishes upgrading. */
  upgradeFinish: {
    event: EVENT_PLAYER_UNIT_UPGRADE_FINISH,
    twin: EVENT_UNIT_UPGRADE_FINISH,
    unit: "unit",
    read: (unit) => ({ unit }),
  },
  /** A hero gains a level; `level` is its level after the gain. */
  heroLevel: {
    event: EVENT_PLAYER_HERO_LEVEL,
    twin: EVENT_UNIT_HERO_LEVEL,
    unit: "unit",
    from: () => Unit.fromLeveling(),
    read: (unit) => ({ unit, level: unit.getHeroLevel() }),
  },
  /** A hero learns the skill `abilityId`. */
  heroSkill: {
    event: EVENT_PLAYER_HERO_SKILL,
    twin: EVENT_UNIT_HERO_SKILL,
    unit: "unit",
    read: (unit) => ({ unit, abilityId: GetLearnedSkill() }),
  },
});
