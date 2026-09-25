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
    source: Unit.fromDamageSource(),
    target,
    amount: GetEventDamage(),
    attackType: required(BlzGetEventAttackType(), "attackType", event),
    damageType: required(BlzGetEventDamageType(), "damageType", event),
    weaponType: required(BlzGetEventWeaponType(), "weaponType", event),
    isAttack: BlzGetEventIsAttack(),
  };
}

/** The combat rows of UnitEvents: `attacked`, `damaged` and `damaging`. */
export const combatRows = unitEventRows({
  /** A unit is attacked; `attacker` is the attacking unit. */
  attacked: {
    event: EVENT_PLAYER_UNIT_ATTACKED,
    twin: EVENT_UNIT_ATTACKED,
    unit: "unit",
    read: (unit, event) => ({
      unit,
      attacker: required(Unit.fromAttacker(), "attacker", event),
    }),
  },
  /**
   * A unit has taken damage; `source` is undefined when no unit dealt it.
   * `damagedOf(unit)` fires for the damage `unit` takes.
   */
  damaged: {
    event: EVENT_PLAYER_UNIT_DAMAGED,
    twin: EVENT_UNIT_DAMAGED,
    unit: "target",
    read: readDamage,
    damage: true,
  },
  /**
   * A unit is about to take damage; `source` is undefined when no unit deals
   * it. `damagingOf(unit)` fires for the damage `unit` is about to take, not
   * the damage it deals: the Patch fires the unit event on the target.
   */
  damaging: {
    event: EVENT_PLAYER_UNIT_DAMAGING,
    twin: EVENT_UNIT_DAMAGING,
    unit: "target",
    read: readDamage,
    damage: true,
  },
});
