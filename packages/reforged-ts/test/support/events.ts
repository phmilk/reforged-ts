/** @noSelfInFile */

// The table-driven suites of the events module. A test file calls
// `describeDescriptor` once per Event descriptor (a row of a namespace, or a
// parameterised member called with its arguments) and `describeLookup` once
// per event lookup; the suites assert only on the call log, the Trigger
// objects and what the handler received when the stubbed trigger context
// fired.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import type { EventDescriptor } from "../../src/index";
import { on, Trigger } from "../../src/index";
import { defined } from "./defined";
import { handleRef } from "./handle-ref";

/** A response Native a firing context answers for. */
type ResponseNative = keyof StubContext;

/** One Event descriptor under test, and what the game would observe of it. */
export interface DescriptorCase<P extends object> {
  /** The name its `required` errors carry: `UnitEvents.deathOf`. */
  readonly name: string;
  /**
   * The suite's title when it is not `name`: for two cases of one
   * parameterised member (`RegionEvents.enter` with and without a filter).
   */
  readonly title?: string;
  readonly descriptor: EventDescriptor<P>;
  /**
   * The registration lines `on()` records on its Trigger, `trigger` being
   * that Trigger as the call log renders it. `everySlot` builds the lines of
   * a registration on every player slot.
   */
  readonly registers: (trigger: string) => string[];
  /** A firing context answering every response Native the payload reads. */
  readonly context: StubContext;
  /** The payload firing with `context` yields: every field, by identity. */
  readonly payload: P;
  /** Fields the event guarantees, each with the Native that reads it. */
  readonly required?: readonly (readonly [keyof P & string, ResponseNative])[];
  /** Fields the game may leave empty, each with the Native that reads it. */
  readonly optional?: readonly (readonly [keyof P & string, ResponseNative])[];
  /** Set for the events that run inside a damage context. */
  readonly damage?: true;
}

/** The registration lines of `trigger` in the call log. */
function registrationsOf(trigger: Trigger): string[] {
  const ref = handleRef("trigger", trigger.handle);
  return stubCalls().filter((line) => {
    const open = line.indexOf("(");
    const args = line.slice(open + 1);
    return (
      line.slice(0, open).includes("Register") &&
      (args.startsWith(`${ref},`) || args.startsWith(`${ref})`))
    );
  });
}

/** The lines of the call log that call the Native `name`. */
function callsTo(name: string, calls = stubCalls()): string[] {
  return calls.filter((line) => line.startsWith(`${name}(`));
}

/** `context` without the answer of `native`. */
function without(context: StubContext, native: ResponseNative): StubContext {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (key !== native) {
      rest[key] = value;
    }
  }
  return rest;
}

/** The field names of a payload, sorted. */
function fieldsOf(payload: object): string[] {
  return Object.keys(payload).sort();
}

/** Asserts that `seen` has the fields of `expected`, each the same value. */
function expectPayload<P extends object>(seen: P | undefined, expected: P) {
  const payload = defined(seen, "the payload");
  expect(fieldsOf(payload)).toEqual(fieldsOf(expected));
  for (const field of fieldsOf(expected)) {
    expect(payload[field as keyof P]).toBe(expected[field as keyof P]);
  }
}

/**
 * The lines of a registration on every player slot: `line` for each slot's
 * player, as the call log renders it.
 */
export function everySlot(line: (player: string) => string): string[] {
  const lines: string[] = [];
  for (let index = 0; index < bj_MAX_PLAYER_SLOTS; index++) {
    const player = defined(
      Player(index),
      `the player in slot ${tostring(index)}`,
    );
    lines.push(line(handleRef("player", player)));
  }
  return lines;
}

/** The suite of one Event descriptor, subscribed through `on()`. */
export function describeDescriptor<P extends object>(
  row: DescriptorCase<P>,
): void {
  const { name, descriptor, context, payload } = row;

  describe(row.title ?? name, () => {
    it("registers on the one Trigger on() creates", () => {
      const created = callsTo("CreateTrigger").length;
      const subscription = on(descriptor, () => {
        // nothing to do
      });
      expect(callsTo("CreateTrigger").length).toEqual(created + 1);
      expect(Trigger.fromHandle(subscription.trigger.handle)).toBe(
        subscription.trigger,
      );
      expect(registrationsOf(subscription.trigger)).toEqual(
        row.registers(handleRef("trigger", subscription.trigger.handle)),
      );
    });

    it("hands the handler the payload of the firing context", () => {
      let seen: P | undefined;
      const subscription = on(descriptor, (received) => {
        seen = received;
      });
      const ran = __stub_fire_trigger(subscription.trigger.handle, context);
      expect(ran).toEqual(true);
      expectPayload(seen, payload);
    });

    for (const [field, native] of row.optional ?? []) {
      it(`leaves ${field} undefined when ${native} answers nothing`, () => {
        let seen: P | undefined;
        const subscription = on(descriptor, (received) => {
          seen = received;
        });
        __stub_fire_trigger(
          subscription.trigger.handle,
          without(context, native),
        );
        expect(defined(seen, "the payload")[field]).toBeUndefined();
      });
    }

    for (const [field, native] of row.required ?? []) {
      it(`raises an error naming ${field} when ${native} answers nothing`, () => {
        const subscription = on(descriptor, () => {
          // nothing to do
        });
        expect(() =>
          __stub_fire_trigger(
            subscription.trigger.handle,
            without(context, native),
          ),
        ).toThrow(`reforged-ts: missing ${field} in the ${name} payload`);
      });
    }

    it("keeps the handler from running when `when` returns false", () => {
      let tested: P | undefined;
      let ran = false;
      const subscription = on(
        descriptor,
        () => {
          ran = true;
        },
        (received) => {
          tested = received;
          return false;
        },
      );
      const fired = __stub_fire_trigger(subscription.trigger.handle, context);
      expect(fired).toEqual(false);
      expect(ran).toEqual(false);
      expectPayload(tested, payload);
    });

    it("hands the handler a payload read again when `when` returns true", () => {
      let tested: P | undefined;
      let seen: P | undefined;
      const subscription = on(
        descriptor,
        (received) => {
          seen = received;
        },
        (received) => {
          tested = received;
          return true;
        },
      );
      const fired = __stub_fire_trigger(subscription.trigger.handle, context);
      expect(fired).toEqual(true);
      expectPayload(tested, payload);
      expectPayload(seen, payload);
      expect(rawequal(seen, tested)).toEqual(false);
    });

    it("destroys its own Trigger and no other", () => {
      let ran = 0;
      const kept = on(descriptor, () => {
        ran += 1;
      });
      const ended = on(descriptor, () => {
        ran += 10;
      });
      const from = stubCalls().length;
      ended.destroy();
      expect(callsTo("DestroyTrigger", stubCalls().slice(from))).toEqual([
        `DestroyTrigger(${handleRef("trigger", ended.trigger.handle)})`,
      ]);
      expect(() => __stub_fire_trigger(ended.trigger.handle, context)).toThrow(
        "was destroyed",
      );
      __stub_fire_trigger(kept.trigger.handle, context);
      expect(ran).toEqual(1);
    });

    it(row.damage ? "is flagged damage" : "is not flagged damage", () => {
      expect(descriptor.damage).toEqual(row.damage);
    });
  });
}

/** One event lookup, and the Wrapper it finds in `context`. */
export interface LookupCase<W> {
  /** The lookup as the tests name it: `Unit.fromKilling`. */
  readonly name: string;
  readonly lookup: () => W | undefined;
  /** A firing context answering the lookup's Native with the Handle. */
  readonly context: StubContext;
  /** The Wrapper the registry holds for that Handle. */
  readonly expected: W;
}

/** What the lookup returns inside the action of a trigger fired in `context`. */
function lookupIn<W>(row: LookupCase<W>, context: StubContext) {
  let found: W | undefined;
  const trigger = Trigger.create().addAction(() => {
    found = row.lookup();
  });
  __stub_fire_trigger(trigger.handle, context);
  return found;
}

/** The suite of one event lookup. */
export function describeLookup<W>(row: LookupCase<W>): void {
  describe(row.name, () => {
    it("is the registry's Wrapper for the Handle its Native answers", () => {
      expect(lookupIn(row, row.context)).toBe(row.expected);
    });

    it("is undefined when its Native answers nothing", () => {
      expect(lookupIn(row, {})).toBeUndefined();
    });
  });
}
