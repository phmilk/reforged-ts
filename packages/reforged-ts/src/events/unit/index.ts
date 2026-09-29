/** @noSelfInFile */

import { combatRows } from "./combat";
import { deathRows } from "./death";
import { itemRows } from "./item";
import { orderRows } from "./order";
import { ownershipRows } from "./ownership";
import { progressRows } from "./progress";
import { selectionRows } from "./selection";
import { spellRows } from "./spell";
import { summonRows } from "./summon";
import { transportRows } from "./transport";
import type { TableOf, UnitEventDescriptors } from "./rows";
import { unitEvents } from "./rows";

/**
 * The groups of UnitEvents rows and twins, in alphabetical order: a new
 * group is one line here and one in `groups`.
 */
interface Groups {
  readonly combat: typeof combatRows;
  readonly death: typeof deathRows;
  readonly item: typeof itemRows;
  readonly order: typeof orderRows;
  readonly ownership: typeof ownershipRows;
  readonly progress: typeof progressRows;
  readonly selection: typeof selectionRows;
  readonly spell: typeof spellRows;
  readonly summon: typeof summonRows;
  readonly transport: typeof transportRows;
}

const groups: Groups = {
  combat: combatRows,
  death: deathRows,
  item: itemRows,
  order: orderRows,
  ownership: ownershipRows,
  progress: progressRows,
  selection: selectionRows,
  spell: spellRows,
  summon: summonRows,
  transport: transportRows,
};

/**
 * The unit Event descriptors: `UnitEvents.death` for every player's units,
 * `UnitEvents.deathOf(unit)` for one Unit.
 * @remarks
 * - `UnitEvents.name` registers the player-unit event for the player in
 *   every slot (`TriggerRegisterPlayerUnitEvent`); `UnitEvents.nameOf(unit)`
 *   registers the unit event on that Unit (`TriggerRegisterUnitEvent`), and
 *   exists only where the Patch has one (there is no `orderUnitOf`).
 * - Every payload field is set unless the member's comment says it can be
 *   `undefined`: the killer of `death`, the damage source of `damaged` and
 *   `damaging`, the order targets, the spell targets.
 * - Dealing damage from a `damaged` or `damaging` handler fires them again:
 *   in Dev mode such a handler runs one level deeper in the damage depth
 *   `Unit.damageTarget` checks.
 * @example A handler with a filter
 * {@includeCode ../../../examples/harness/events-on.ts#on}
 * @namespace
 */
export const UnitEvents: UnitEventDescriptors<TableOf<Groups>> =
  unitEvents(groups);
