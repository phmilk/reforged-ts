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
 * The groups of UnitEvents rows, in alphabetical order: a new group is one
 * line here and one in `groups`.
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
 */
export const UnitEvents: UnitEventDescriptors<TableOf<Groups>> =
  unitEvents(groups);
