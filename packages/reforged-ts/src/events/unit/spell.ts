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
    caster,
    abilityId: GetSpellAbilityId(),
    targetUnit: Unit.fromSpellTarget(),
    targetItem: Item.fromSpellTarget(),
    targetDestructable: Destructable.fromSpellTarget(),
    targetX: GetSpellTargetX(),
    targetY: GetSpellTargetY(),
  };
}

/** The spell rows of UnitEvents: the five spell events, channel to endcast. */
export const spellRows = unitEventRows({
  /**
   * A unit starts channeling a spell: the first of the five spell events.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @example Following a spell from channel to end
   * {@includeCode ../../../examples/harness/unit-events.ts#spell}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  spellChannel: {
    event: EVENT_PLAYER_UNIT_SPELL_CHANNEL,
    twin: EVENT_UNIT_SPELL_CHANNEL,
    unit: "caster",
    read: readSpell,
  },
  /**
   * A unit begins casting a spell, before the spell takes effect.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @example Following a spell from channel to end
   * {@includeCode ../../../examples/harness/unit-events.ts#spell}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  spellCast: {
    event: EVENT_PLAYER_UNIT_SPELL_CAST,
    twin: EVENT_UNIT_SPELL_CAST,
    unit: "caster",
    read: readSpell,
  },
  /**
   * A spell takes effect: its cost is paid and its cooldown starts.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @example Following a spell from channel to end
   * {@includeCode ../../../examples/harness/unit-events.ts#spell}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  spellEffect: {
    event: EVENT_PLAYER_UNIT_SPELL_EFFECT,
    twin: EVENT_UNIT_SPELL_EFFECT,
    unit: "caster",
    read: readSpell,
  },
  /**
   * A unit finishes casting a spell.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @example Following a spell from channel to end
   * {@includeCode ../../../examples/harness/unit-events.ts#spell}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  spellFinish: {
    event: EVENT_PLAYER_UNIT_SPELL_FINISH,
    twin: EVENT_UNIT_SPELL_FINISH,
    unit: "caster",
    read: readSpell,
  },
  /**
   * A unit stops casting a spell, finished or interrupted.
   * `targetUnit`, `targetItem` and `targetDestructable` are undefined
   * unless the spell targets one of that kind.
   * @example Following a spell from channel to end
   * {@includeCode ../../../examples/harness/unit-events.ts#spell}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  spellEndcast: {
    event: EVENT_PLAYER_UNIT_SPELL_ENDCAST,
    twin: EVENT_UNIT_SPELL_ENDCAST,
    unit: "caster",
    read: readSpell,
  },
});
