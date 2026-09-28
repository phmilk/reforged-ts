/** @noSelfInFile */

import { Destructable } from "../../handles/destructable";
import { Item } from "../../handles/item";
import { Unit } from "../../handles/unit";
import { unitEventRows } from "./rows";

/**
 * The spell payload once the caster is known: the target unit, item or
 * destructable is undefined when the spell has no target of that kind.
 */
function readSpell(caster: Unit) {
  return {
    /** The unit casting the spell. */
    caster,
    /** The spell's ability id. */
    abilityId: GetSpellAbilityId(),
    /** The target unit, undefined unless the spell targets a unit. */
    targetUnit: Unit.fromSpellTarget(),
    /** The target item, undefined unless the spell targets an item. */
    targetItem: Item.fromSpellTarget(),
    /**
     * The target destructable, undefined unless the spell targets a
     * destructable.
     */
    targetDestructable: Destructable.fromSpellTarget(),
    /** The x coordinate of the spell's target point. */
    targetX: GetSpellTargetX(),
    /** The y coordinate of the spell's target point. */
    targetY: GetSpellTargetY(),
  };
}

/** The spell rows of UnitEvents: the five spell events, channel to endcast. */
export const spellRows = unitEventRows({
  /**
   * A unit starts channeling a spell: the first of the five spell events.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterPlayerUnitEvent
   */
  spellChannel: {
    event: EVENT_PLAYER_UNIT_SPELL_CHANNEL,
    unit: "caster",
    read: readSpell,
  },
  /**
   * The event of `spellChannel` on one Unit: `unit` starts channeling a
   * spell. `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterUnitEvent
   */
  spellChannelOf: { twinOf: "spellChannel", event: EVENT_UNIT_SPELL_CHANNEL },
  /**
   * A unit begins casting a spell, before the spell takes effect.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterPlayerUnitEvent
   */
  spellCast: {
    event: EVENT_PLAYER_UNIT_SPELL_CAST,
    unit: "caster",
    read: readSpell,
  },
  /**
   * The event of `spellCast` on one Unit: `unit` begins casting a spell.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterUnitEvent
   */
  spellCastOf: { twinOf: "spellCast", event: EVENT_UNIT_SPELL_CAST },
  /**
   * A spell takes effect: its cost is paid and its cooldown starts.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterPlayerUnitEvent
   */
  spellEffect: {
    event: EVENT_PLAYER_UNIT_SPELL_EFFECT,
    unit: "caster",
    read: readSpell,
  },
  /**
   * The event of `spellEffect` on one Unit: a spell `unit` casts takes
   * effect. `targetUnit`, `targetItem` and `targetDestructable` are
   * undefined unless the spell targets one of that kind.
   * @native TriggerRegisterUnitEvent
   */
  spellEffectOf: { twinOf: "spellEffect", event: EVENT_UNIT_SPELL_EFFECT },
  /**
   * A unit finishes casting a spell.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterPlayerUnitEvent
   */
  spellFinish: {
    event: EVENT_PLAYER_UNIT_SPELL_FINISH,
    unit: "caster",
    read: readSpell,
  },
  /**
   * The event of `spellFinish` on one Unit: `unit` finishes casting a spell.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterUnitEvent
   */
  spellFinishOf: { twinOf: "spellFinish", event: EVENT_UNIT_SPELL_FINISH },
  /**
   * A unit stops casting a spell, finished or interrupted.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @native TriggerRegisterPlayerUnitEvent
   */
  spellEndcast: {
    event: EVENT_PLAYER_UNIT_SPELL_ENDCAST,
    unit: "caster",
    read: readSpell,
  },
  /**
   * The event of `spellEndcast` on one Unit: `unit` stops casting a spell,
   * finished or interrupted. `targetUnit`, `targetItem` and
   * `targetDestructable` are undefined unless the spell targets one of that
   * kind.
   * @native TriggerRegisterUnitEvent
   */
  spellEndcastOf: { twinOf: "spellEndcast", event: EVENT_UNIT_SPELL_ENDCAST },
});
