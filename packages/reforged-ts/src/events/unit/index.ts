/** @noSelfInFile */

import { deathRows } from "./death";
import type { TableOf, UnitEventDescriptors } from "./rows";
import { unitEvents } from "./rows";

/**
 * The groups of UnitEvents rows, by group: a new group is one line here and
 * one in `groups`.
 */
interface Groups {
  readonly death: typeof deathRows;
}

const groups: Groups = {
  death: deathRows,
};

/**
 * The unit Event descriptors: `UnitEvents.death` for every player's units,
 * `UnitEvents.deathOf(unit)` for one Unit.
 */
export const UnitEvents: UnitEventDescriptors<TableOf<Groups>> =
  unitEvents(groups);
