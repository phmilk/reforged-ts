// The event responses (data/event-responses.json), owned by the plugin: one
// entry per Native of `common.j` that answers only inside the context of an
// event or a callback (`GetTriggerUnit`, `GetEnumUnit`, `GetExpiredTimer`,
// `GetEventDamage`), with its context kind, the event or callback it belongs
// to (from the section comment of `common.j` it sits under) and a reason
// citing that line. It grows by pull request; a test asserts every entry is a
// Native of the Typings.
import {
  DataFileError,
  elements,
  expectObject,
  expectString,
  expectUnique,
} from "./schema.js";

/**
 * Where an event response answers. `trigger`: a run of a trigger on its
 * event. `timer`: a Timer's expiry (the callback of `TimerStart`). `enum`:
 * the callback of an enumeration (`ForGroup`, `ForForce`,
 * `EnumItemsInRect`). `filter`: a filter function (the boolexpr of an
 * enumeration or a registration).
 */
export type EventContextKind = "trigger" | "timer" | "enum" | "filter";

const contexts: readonly EventContextKind[] = [
  "trigger",
  "timer",
  "enum",
  "filter",
];

export interface EventResponse {
  /** The Native's name as the Typings declare it. */
  readonly name: string;
  /** The context it answers in. */
  readonly context: EventContextKind;
  /** The registering event or callback, from the `common.j` section comment. */
  readonly event: string;
  /** Why it is listed: the `common.j` line it sits at, and its context. */
  readonly reason: string;
}

export function parseEventResponses(
  json: unknown,
  file: string,
): EventResponse[] {
  const entries = elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    const context = entry.context;
    if (!contexts.includes(context as EventContextKind)) {
      throw new DataFileError(
        file,
        `${path.field}.context`,
        `one of ${contexts.map((each) => JSON.stringify(each)).join(", ")}`,
      );
    }
    return {
      name: expectString(entry, "name", path),
      context: context as EventContextKind,
      event: expectString(entry, "event", path),
      reason: expectString(entry, "reason", path),
    };
  });
  expectUnique(
    entries.map((entry) => entry.name),
    { file, field: "" },
    "name",
  );
  return entries;
}
