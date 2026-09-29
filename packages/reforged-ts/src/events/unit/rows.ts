/** @noSelfInFile */

// The UnitEvents table: one row per any-unit event, from which `UnitEvents`
// gets `name`, registered for every player slot, and one twin per row the
// Patch has a unit event for, from which it gets `nameOf(unit)`, registered
// on one Unit. A twin is an entry of its own, keyed `nameOf` next to its row
// `name`, so that every member keeps the doc comment of its entry. The rows
// live in one file per group of events (`death.ts`, ...), and `index.ts`
// lists the groups twice: in its `Groups` interface, whose types carry each
// entry's doc comment to its descriptor, and in the `groups` object
// `unitEvents` reads.

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
  /** The payload field holding the event's unit. */
  readonly unit: U;
  /**
   * Reads the event's unit for `UnitEvents.name`, when a response Native
   * names it (`Unit.fromOrdered()`); the triggering unit when absent. The
   * twin registers on that same unit.
   */
  readonly from?: () => Unit | undefined;
  /**
   * Reads the payload once the event's unit is known: the one `from` reads
   * for `name`, the given Unit for `nameOf` (unless the twin sets
   * `twinReadsUnit`). `event` names the descriptor (`UnitEvents.death`) for
   * `required`.
   */
  readonly read: (unit: Unit, event: string) => P;
  /** Set on the events that run inside a damage context. */
  readonly damage?: true;
}

/**
 * The twin of the row `R`, keyed `${R}Of` in the row's group: the entry of
 * `UnitEvents.nameOf(unit)`, which registers the row's event on one Unit
 * through the unit event the Patch has for it, and reads the row's payload.
 * @typeParam R - The name of its row.
 */
export interface UnitEventTwin<R extends string = string> {
  /** The name of its row. */
  readonly twinOf: R;
  /** The unit event `UnitEvents.nameOf(unit)` registers on the given Unit. */
  readonly event: unitevent;
  /**
   * Set when no source confirms that the game fires the event for the unit
   * it was registered on: `nameOf` then reads the event's unit as `name`
   * does, instead of taking the given Unit.
   */
  readonly twinReadsUnit?: true;
}

/** The payload a row reads. */
type PayloadOf<R> = R extends {
  readonly read: (unit: Unit, event: string) => infer P;
}
  ? P
  : never;

/**
 * The descriptors a table gives: `name` per row, registered for every
 * player's units, and `nameOf(unit)` per twin, registered on one Unit. It is
 * the type of `UnitEvents`, and each member keeps its entry's doc comment.
 * @typeParam T - The table: one entry per member.
 */
export type UnitEventDescriptors<T> = {
  readonly [K in keyof T]: T[K] extends UnitEventTwin<infer R>
    ? (unit: Unit) => EventDescriptor<PayloadOf<T[R & keyof T]>>
    : EventDescriptor<PayloadOf<T[K]>>;
};

/** Whether an entry is a twin: it names its row, or registers a unit event. */
type IsTwin<E> = E extends { readonly twinOf: unknown }
  ? true
  : E extends { readonly event: unitevent }
    ? true
    : false;

/** The keys of a group's rows: its entries that are not twins. */
type RowKeys<T> = {
  [K in keyof T]: IsTwin<T[K]> extends true ? never : K;
}[keyof T] &
  string;

/**
 * What a twin keyed `K` adds when its key is not the name of its row `R`
 * followed by `Of`: a property the entry lacks, whose name is the error.
 */
type TwinKey<K, R> = K extends `${R & string}Of`
  ? unknown
  : Readonly<
      Record<`the twin of ${R & string} is keyed ${R & string}Of`, never>
    >;

/**
 * A group of entries, as it is written: types each row's `read` and keeps
 * the payload it returns, and checks that each twin names a row of the group
 * and is keyed by that row's name followed by `Of`. An entry is a twin by its
 * shape (a `twinOf`, or a unit event), not by its key, so a row may have a
 * name ending in `Of`.
 * @param rows - The group's rows and twins, by member name.
 * @returns `rows`, unchanged.
 */
export function unitEventRows<
  T extends {
    readonly [K in keyof T]: IsTwin<T[K]> extends true
      ? UnitEventTwin<RowKeys<T>> &
          TwinKey<K, T[K] extends { readonly twinOf: infer R } ? R : never>
      : UnitEventRow<PayloadOf<T[K]>>;
  },
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
    name: event,
    register: (trigger) => {
      trigger.registerAnyUnitEvent(row.event);
    },
    read: () => row.read(eventUnit(row, event), event),
    damage: row.damage,
  };
}

/**
 * The descriptor `name` registered on `unit` through the twin's unit event,
 * carrying `unit` in the payload of its row unless the twin sets
 * `twinReadsUnit`.
 */
function unitOf<P>(
  name: string,
  row: UnitEventRow<P, string>,
  twin: UnitEventTwin,
  unit: Unit,
): EventDescriptor<P> {
  const event = `UnitEvents.${name}`;
  return {
    name: event,
    register: (trigger) => {
      trigger.registerUnitEvent(unit, twin.event);
    },
    read: () =>
      row.read(twin.twinReadsUnit ? eventUnit(row, event) : unit, event),
    damage: row.damage,
  };
}

/** The intersection of the members of the union `U`. */
type Intersection<U> = (
  U extends unknown ? (member: U) => void : never
) extends (member: infer I) => void
  ? I
  : never;

/** The entries of every group, as one table. */
export type TableOf<G> = Intersection<G[keyof G]>;

/** An entry of a group: a row, or the twin of one. */
type UnitEventEntry = UnitEventRow<unknown, string> | UnitEventTwin;

/**
 * `UnitEvents` from the groups of entries, keyed by group name.
 * @param groups - The groups of rows and twins, by group name.
 * @returns The descriptors: `name` for every row, `nameOf` for every twin.
 */
export function unitEvents<
  G extends {
    readonly [K in keyof G]: Readonly<Record<string, UnitEventEntry>>;
  },
>(groups: G): UnitEventDescriptors<TableOf<G>> {
  const events: Record<string, unknown> = {};
  for (const entries of Object.values<Record<string, UnitEventEntry>>(groups)) {
    for (const [name, entry] of Object.entries(entries)) {
      if (!("twinOf" in entry)) {
        events[name] = anyUnit(name, entry);
        continue;
      }
      // `unitEventRows` checks that `twinOf` names a row of the same group.
      const row = entries[entry.twinOf] as UnitEventRow<unknown, string>;
      events[name] = (unit: Unit) => unitOf(name, row, entry, unit);
    }
  }
  return events as UnitEventDescriptors<TableOf<G>>;
}
