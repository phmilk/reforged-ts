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
 * One UnitEvents row. Its functions take no `self`, as the arrows of a row
 * written under `@noSelfInFile` do.
 * @noSelf
 */
export interface UnitEventRow<P> {
  /** The player-unit event `UnitEvents.name` registers for every slot. */
  readonly event: playerunitevent;
  /**
   * The unit event `UnitEvents.nameOf(unit)` registers on the given Unit;
   * absent when the Patch has none, and then there is no `nameOf`.
   */
  readonly twin?: unitevent;
  /** The payload field holding the event's unit. */
  readonly unit: string;
  /**
   * Reads the event's unit for `UnitEvents.name`, when a response Native
   * names it (`Unit.fromOrdered()`); the triggering unit when absent. The
   * twin registers on that same unit.
   */
  readonly from?: () => Unit | undefined;
  /**
   * Reads the payload once the event's unit is known: the one `from` reads
   * for `name`, the given Unit for `nameOf`. `event` names the descriptor
   * (`UnitEvents.death`) for `required`.
   */
  readonly read: (unit: Unit, event: string) => P;
  readonly damage?: true;
}

/** The payload a row reads. */
type PayloadOf<R> = R extends UnitEventRow<infer P> ? P : never;

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
  T extends { readonly [K in keyof T]: UnitEventRow<unknown> },
>(rows: T): T {
  return rows;
}

/**
 * The descriptor registered for every slot, reading the event's unit through
 * the row's `from`, or the triggering unit.
 */
function anyUnit<P>(name: string, row: UnitEventRow<P>): EventDescriptor<P> {
  const event = `UnitEvents.${name}`;
  const from = row.from ?? (() => Unit.fromEvent());
  return {
    register: (trigger) => {
      trigger.registerAnyUnitEvent(row.event);
    },
    read: () => row.read(required(from(), row.unit, event), event),
    damage: row.damage,
  };
}

/** The descriptor registered on `unit` through the row's twin. */
function unitOf<P>(
  name: string,
  row: UnitEventRow<P>,
  twin: unitevent,
  unit: Unit,
): EventDescriptor<P> {
  const event = `UnitEvents.${name}Of`;
  return {
    register: (trigger) => {
      trigger.registerUnitEvent(unit, twin);
    },
    read: () => row.read(unit, event),
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
    readonly [K in keyof G]: Readonly<Record<string, UnitEventRow<unknown>>>;
  },
>(groups: G): UnitEventDescriptors<TableOf<G>> {
  const events: Record<string, unknown> = {};
  for (const rows of Object.values<Record<string, UnitEventRow<unknown>>>(
    groups,
  )) {
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
