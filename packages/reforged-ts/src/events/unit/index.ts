/** @noSelfInFile */

import { combatRows } from "./combat";
import { spellRows } from "./spell";
import { deathRows } from "./death";
import { itemRows } from "./item";
import { orderRows } from "./order";
import { ownershipRows } from "./ownership";
import { progressRows } from "./progress";
import { selectionRows } from "./selection";
import { summonRows } from "./summon";
import { transportRows } from "./transport";
import type { TableOf, UnitEventDescriptors } from "./rows";
import { unitEvents } from "./rows";

/**
 * The groups of UnitEvents rows, by group: a new group is one line here and
 * one in `groups`.
 */
interface Groups {
  readonly combat: typeof combatRows;
  readonly spell: typeof spellRows;
  readonly death: typeof deathRows;
  readonly item: typeof itemRows;
  readonly order: typeof orderRows;
  readonly ownership: typeof ownershipRows;
  readonly progress: typeof progressRows;
  readonly selection: typeof selectionRows;
  readonly summon: typeof summonRows;
  readonly transport: typeof transportRows;
}

const groups: Groups = {
  combat: combatRows,
  spell: spellRows,
  death: deathRows,
  item: itemRows,
  order: orderRows,
  ownership: ownershipRows,
  progress: progressRows,
  selection: selectionRows,
  summon: summonRows,
  transport: transportRows,
};

/**
 * The unit Event descriptors: `UnitEvents.death` for every player's units,
 * `UnitEvents.deathOf(unit)` for one Unit.
 */
export const UnitEvents: UnitEventDescriptors<TableOf<Groups>> =
  unitEvents(groups);
