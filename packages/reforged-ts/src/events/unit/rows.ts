/** @noSelfInFile */

// The UnitEvents table: one row per any-unit event, from which `UnitEvents`
// gets `name`, registered for every player slot, and, when the row has a
// twin, `nameOf(unit)`, registered on one Unit. The rows live in one file per
// group of events (`death.ts`, ...), and `index.ts` lists the groups twice:
// in its `Groups` interface, whose types carry each row's doc comment to its
// descriptor, and in the `groups` object `unitEvents` reads.

import { Unit } from "../../handles/unit";
import type { EventDescriptor } from "../descriptor";
import { required } from "../descriptor";

/**
 * One UnitEvents row, `P` being its payload and `U` the payload field holding
 * the event's unit (any string where the table reads rows of every payload).
 * Its functions take no `self`, as the arrows of a row written under
 * `@noSelfInFile` do.
 * @noSelf
 */
export interface UnitEventRow<P, U extends string = keyof P & string> {
  /** The player-unit event `UnitEvents.name` registers for every slot. */
  readonly event: playerunitevent;
  /**
   * The unit event `UnitEvents.nameOf(unit)` registers on the given Unit;
   * absent when the Patch has none, and then there is no `nameOf`.
   */
  readonly twin?: unitevent;
  /** The payload field holding the event's unit. */
  readonly unit: U;
  /**
   * Reads the event's unit for `UnitEvents.name`, when a response Native
   * names it (`Unit.fromOrdered()`); the triggering unit when absent. The
   * twin registers on that same unit.
   */
  readonly from?: () => Unit | undefined;
  /**
   * Set when no source confirms that the game fires the twin for the unit it
   * was registered on: `nameOf` then reads the event's unit as `name` does,
   * instead of taking the given Unit.
   */
  readonly twinReadsUnit?: true;
  /**
   * Reads the payload once the event's unit is known: the one `from` reads
   * for `name`, the given Unit for `nameOf` (unless `twinReadsUnit`).
   * `event` names the descriptor (`UnitEvents.death`) for `required`.
   */
  readonly read: (unit: Unit, event: string) => P;
  /** Set on the events that run inside a damage context. */
  readonly damage?: true;
}

/** The payload a row reads. */
type PayloadOf<R> = R extends {
  readonly read: (unit: Unit, event: string) => infer P;
}
  ? P
  : never;

/** The descriptors a table gives: `name` per row, `nameOf` per twin. */
export type UnitEventDescriptors<T> = {
  readonly [K in keyof T]: EventDescriptor<PayloadOf<T[K]>>;
} & {
  readonly [
    K in keyof T as T[K] extends { readonly twin: unitevent }
      ? `${K & string}Of`
      : never
  ]: (unit: Unit) => EventDescriptor<PayloadOf<T[K]>>;
};

/**
 * A group of rows, as it is written: types each row's `read` and keeps the
 * payload it returns.
 */
export function unitEventRows<
  T extends { readonly [K in keyof T]: UnitEventRow<PayloadOf<T[K]>> },
>(rows: T): T {
  return rows;
}

/**
 * Reads the event's unit through the row's `from`, or the triggering unit,
 * naming `event` when the game gives none.
 */
function eventUnit(row: UnitEventRow<unknown, string>, event: string): Unit {
  const unit = row.from === undefined ? Unit.fromEvent() : row.from();
  return required(unit, row.unit, event);
}

/** The descriptor registered for every slot, reading the event's unit. */
function anyUnit<P>(
  name: string,
  row: UnitEventRow<P, string>,
): EventDescriptor<P> {
  const event = `UnitEvents.${name}`;
  return {
    register: (trigger) => {
      trigger.registerAnyUnitEvent(row.event);
    },
    read: () => row.read(eventUnit(row, event), event),
    damage: row.damage,
  };
}

/**
 * The descriptor registered on `unit` through the row's twin, carrying `unit`
 * in the payload unless the row `twinReadsUnit`.
 */
function unitOf<P>(
  name: string,
  row: UnitEventRow<P, string>,
  twin: unitevent,
  unit: Unit,
): EventDescriptor<P> {
  const event = `UnitEvents.${name}Of`;
  return {
    register: (trigger) => {
      trigger.registerUnitEvent(unit, twin);
    },
    read: () =>
      row.read(row.twinReadsUnit ? eventUnit(row, event) : unit, event),
    damage: row.damage,
  };
}

/** The intersection of the members of the union `U`. */
type Intersection<U> = (
  U extends unknown ? (member: U) => void : never
) extends (member: infer I) => void
  ? I
  : never;

/** The rows of every group, as one table. */
export type TableOf<G> = Intersection<G[keyof G]>;

/** `UnitEvents` from the groups of rows, keyed by group name. */
export function unitEvents<
  G extends {
    readonly [K in keyof G]: Readonly<
      Record<string, UnitEventRow<unknown, string>>
    >;
  },
>(groups: G): UnitEventDescriptors<TableOf<G>> {
  const events: Record<string, unknown> = {};
  for (const rows of Object.values<
    Record<string, UnitEventRow<unknown, string>>
  >(groups)) {
    for (const [name, row] of Object.entries(rows)) {
      events[name] = anyUnit(name, row);
      const twin = row.twin;
      if (twin !== undefined) {
        events[`${name}Of`] = (unit: Unit) => unitOf(name, row, twin, unit);
      }
    }
  }
  return events as UnitEventDescriptors<TableOf<G>>;
}
