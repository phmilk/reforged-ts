/** @noSelfInFile */

// The table the namespaces other than UnitEvents are defined from: one row
// per member, holding how its event registers on a Trigger, given the
// member's arguments, and how its payload is read. A fixed row gives the
// member as a descriptor (`PlayerEvents.leave`); any other row gives a
// function of the arguments its `register` takes after the Trigger
// (`PlayerEvents.chat(player, text, exactMatch)`). A new descriptor is one
// row. None of these events runs inside a damage context, so the rows have no
// damage flag (UnitEvents rows have one).

import type { Trigger } from "../handles/trigger";
import type { EventDescriptor } from "./descriptor";

/**
 * One row of an events namespace (`PlayerEvents`, `DialogEvents` and the
 * others): how its event registers and how its payload is read. Its
 * functions take no `self`, as the arrows of a row written under
 * `@noSelfInFile` do.
 * @typeParam A - The arguments the member takes, after the Trigger.
 * @typeParam P - The payload the event gives.
 * @noSelf
 */
export interface EventRow<A extends readonly unknown[], P> {
  /** Registers the event on `trigger` for the member's arguments `args`. */
  readonly register: (trigger: Trigger, ...args: A) => void;
  /**
   * Reads the payload from the trigger context. `event` names the descriptor
   * (`PlayerEvents.chat`) for `required`.
   */
  readonly read: (event: string) => P;
  /** Set when the member is the descriptor, registered with no arguments. */
  readonly fixed?: true;
}

/**
 * A row whose member is the descriptor itself, registered with no arguments
 * (`PlayerEvents.leave`).
 * @typeParam P - The payload the event gives.
 */
export type FixedRow<P> = EventRow<[], P> & {
  /** Set: the member is the descriptor. */
  readonly fixed: true;
};

/**
 * The members a table gives: the descriptor for a fixed row, a function of
 * the row's arguments for any other. It is the type of each events
 * namespace but `UnitEvents`, and each member keeps its row's doc comment.
 * @typeParam T - The table: one row per member.
 */
export type EventDescriptors<T> = {
  readonly [K in keyof T]: T[K] extends EventRow<infer A, infer P>
    ? T[K] extends {
        /** Set on a fixed row. */
        readonly fixed: true;
      }
      ? EventDescriptor<P>
      : (...args: A) => EventDescriptor<P>
    : never;
};

/**
 * The members of the namespace `namespace` (`PlayerEvents`) from its rows,
 * each descriptor named `namespace.member` in its `required` errors.
 * @param namespace - The namespace's name, as a Map project writes it.
 * @param rows - The rows, one per member.
 * @returns The namespace: a descriptor per fixed row, a function returning
 * one per other row.
 */
export function eventRows<
  T extends { readonly [K in keyof T]: EventRow<never[], unknown> },
>(namespace: string, rows: T): EventDescriptors<T> {
  const members: Record<string, unknown> = {};
  for (const [name, row] of Object.entries<EventRow<never[], unknown>>(rows)) {
    const event = `${namespace}.${name}`;
    const descriptor = (...args: never[]): EventDescriptor<unknown> => ({
      name: event,
      register: (trigger) => {
        row.register(trigger, ...args);
      },
      read: () => row.read(event),
    });
    members[name] = row.fixed ? descriptor() : descriptor;
  }
  return members as EventDescriptors<T>;
}
