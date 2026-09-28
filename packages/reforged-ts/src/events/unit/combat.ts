/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/**
 * The damage payload once the target is known. The attack, damage and weapon
 * types are guaranteed inside a damage event, though their Natives are typed
 * as possibly empty.
 */
function readDamage(target: Unit, event: string) {
  return {
    /** The unit dealing the damage, undefined when no unit deals it. */
    source: Unit.fromDamageSource(),
    /** The unit taking the damage. */
    target,
    /** The amount of damage. */
    amount: GetEventDamage(),
    /** The damage's attack type. */
    attackType: required(BlzGetEventAttackType(), "attackType", event),
    /** The damage's damage type. */
    damageType: required(BlzGetEventDamageType(), "damageType", event),
    /** The damage's weapon type. */
    weaponType: required(BlzGetEventWeaponType(), "weaponType", event),
    /** Whether the damage comes from an attack. */
    isAttack: BlzGetEventIsAttack(),
  };
}

/** The combat rows of UnitEvents: `attacked`, `damaged` and `damaging`. */
export const combatRows = unitEventRows({
  /**
   * A unit is attacked; `attacker` is the attacking unit.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  attacked: {
    event: EVENT_PLAYER_UNIT_ATTACKED,
    unit: "unit",
    read: (unit, event) => ({
      /** The attacked unit. */
      unit,
      /** The attacking unit. */
      attacker: required(Unit.fromAttacker(), "attacker", event),
    }),
  },
  /**
   * The event of `attacked` on one Unit: `unit` is attacked.
   * Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  attackedOf: { twinOf: "attacked", event: EVENT_UNIT_ATTACKED },
  /**
   * A unit has taken damage; `source` is undefined when no unit dealt it.
   * @native TriggerRegisterPlayerUnitEvent
   */
  damaged: {
    event: EVENT_PLAYER_UNIT_DAMAGED,
    unit: "target",
    read: readDamage,
    damage: true,
  },
  /**
   * The event of `damaged` on one Unit: fires for the damage `unit` takes;
   * `source` is undefined when no unit dealt it.
   * @native TriggerRegisterUnitEvent
   */
  damagedOf: { twinOf: "damaged", event: EVENT_UNIT_DAMAGED },
  /**
   * A unit is about to take damage; `source` is undefined when no unit deals
   * it.
   * @native TriggerRegisterPlayerUnitEvent
   */
  damaging: {
    event: EVENT_PLAYER_UNIT_DAMAGING,
    unit: "target",
    read: readDamage,
    damage: true,
  },
  /**
   * The event of `damaging` on one Unit: fires for the damage `unit` is about
   * to take, not the damage it deals, since the Patch fires the unit event on
   * the target; `source` is undefined when no unit deals it.
   * @native TriggerRegisterUnitEvent
   */
  damagingOf: { twinOf: "damaging", event: EVENT_UNIT_DAMAGING },
});
