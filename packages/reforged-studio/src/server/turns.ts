/**
 * The turns with the World Editor (#837), as field-by-field comparisons of
 * the session's states: the merge of the unsaved edits on a map folder that
 * changed on disk (the saved state, the working state and the new saved
 * state), and the detection of a World Editor save that put back fields the
 * Studio saved (the states the Studio saved since the World Editor last
 * loaded the map, and the new saved state). Pure: the session applies what
 * they plan.
 */
import type {
  ObjectDataModification,
  ObjectDataObject,
  ObjectKind,
} from "reforged-map";
import type { Conflict, PutBack, TurnAddress, TurnValue } from "./api-types.js";
import {
  byPlace,
  contentOf,
  editsBetween,
  fieldRemoval,
  objectKey,
  placeKey,
  restore,
  type ObjectState,
  type SessionEdit,
} from "./states.js";

/**
 * One place a turn compares, with each state's content there: a field of an
 * object present on every side, or the whole object when a side adds or
 * removes it, or changes its base.
 */
export interface Place {
  /** Its id: the object's key, then the field's place for a field. */
  readonly id: string;
  readonly address: TurnAddress;
  /** The object's key. */
  readonly key: string;
}

/** What a state holds at a place: the modification of a field, the object for a whole object; undefined for none. */
export type Held = ObjectDataModification | ObjectDataObject | undefined;

/** What an object is, beyond its fields: absent, or its origin and base. */
const identity = (object: ObjectDataObject | undefined): string =>
  object === undefined ? "-" : `${object.origin} ${object.base ?? ""}`;

/** What a whole object holds, to compare two states: its identity and each modification's content by place. */
function objectContent(object: ObjectDataObject | undefined): string {
  if (object === undefined) return "-";
  return JSON.stringify([
    identity(object),
    [...byPlace(object)]
      .map(([place, modification]) => [place, contentOf(modification)])
      .sort(([a = ""], [b = ""]) => (a < b ? -1 : a > b ? 1 : 0)),
  ]);
}

/** What a field holds, to compare two states. */
const fieldContent = (modification: ObjectDataModification | undefined) =>
  modification === undefined ? "-" : contentOf(modification);

/** The place of a whole object. */
function objectPlace(object: ObjectDataObject): Place {
  const key = objectKey(object.kind, object.rawcode);
  return {
    id: key,
    key,
    address: { kind: object.kind, rawcode: object.rawcode },
  };
}

/** The place of a field of an object. */
function fieldPlace(
  kind: ObjectKind,
  rawcode: string,
  modification: ObjectDataModification,
): Place {
  const key = objectKey(kind, rawcode);
  return {
    id: `${key} ${placeKey(modification)}`,
    key,
    address: {
      kind,
      rawcode,
      field: modification.field,
      ...(modification.level !== undefined && { level: modification.level }),
      ...(modification.dataPointer !== undefined && {
        dataPointer: modification.dataPointer,
      }),
    },
  };
}

/** One place, compared across states: what each holds there and its content. */
interface Compared {
  readonly place: Place;
  /** What each state holds there, in the order the states were given. */
  readonly held: readonly Held[];
  /** Each state's content there, in the same order. */
  readonly contents: readonly string[];
}

/**
 * Every place where two or more states may differ, field by field: a field
 * of an object whose identity is the same in every state (a Built-in object
 * a state does not modify counts as modified without fields), else the
 * whole object. The objects any state holds, in the first state's order, then
 * those it lacks.
 */
function compare(states: readonly ObjectState[]): Compared[] {
  const keys = new Set(states.flatMap((state) => [...state.keys()]));
  const compared: Compared[] = [];
  for (const key of keys) {
    const objects = states.map((state) => state.get(key));
    const present = objects.find((object) => object !== undefined);
    if (present === undefined) continue;
    // A Built-in object the map does not modify is a modified one without
    // fields: its fields compare one by one.
    const absent = present.origin === "modified" ? identity(present) : "-";
    const identities = objects.map((object) =>
      object === undefined ? absent : identity(object),
    );
    if (new Set(identities).size > 1) {
      compared.push({
        place: objectPlace(present),
        held: objects,
        contents: objects.map(objectContent),
      });
      continue;
    }
    const places = objects.map((object) =>
      object === undefined
        ? new Map<string, ObjectDataModification>()
        : byPlace(object),
    );
    const all = new Map<string, ObjectDataModification>();
    for (const place of places) {
      for (const [id, modification] of place) {
        if (!all.has(id)) all.set(id, modification);
      }
    }
    for (const [id, modification] of all) {
      const held = places.map((place) => place.get(id));
      compared.push({
        place: fieldPlace(present.kind, present.rawcode, modification),
        held,
        contents: held.map(fieldContent),
      });
    }
  }
  return compared;
}

/** How a state holds a place, as the API shows it. */
export function turnValue(place: Place, held: Held): TurnValue {
  if (place.address.field === undefined) {
    return held === undefined ? { is: "absent" } : { is: "present" };
  }
  return held === undefined
    ? { is: "unmodified" }
    : { is: "value", value: (held as ObjectDataModification).value };
}

/**
 * The edits that make the working state hold a place as a target holds it:
 * a field set or removed; a whole object removed, then added again with its
 * base and fields, or only its fields changed when its identity stays.
 *
 * @param place - The place.
 * @param current - What the working state holds there now.
 * @param target - What it is to hold.
 * @returns The edits, in order; none when it already does.
 */
export function editsTo(
  place: Place,
  current: Held,
  target: Held,
): SessionEdit[] {
  const { kind, rawcode, field } = place.address;
  if (field === undefined) {
    const now = current as ObjectDataObject | undefined;
    const goal = target as ObjectDataObject | undefined;
    const single = (object: ObjectDataObject | undefined): ObjectState =>
      new Map(object === undefined ? [] : [[place.key, object]]);
    if (identity(now) === identity(goal)) {
      return editsBetween(single(now), single(goal));
    }
    return [
      ...(now === undefined
        ? []
        : [{ op: "removeObject", kind, rawcode } as const]),
      ...editsBetween(new Map(), single(goal)),
    ];
  }
  const now = current as ObjectDataModification | undefined;
  const goal = target as ObjectDataModification | undefined;
  if (fieldContent(now) === fieldContent(goal)) return [];
  if (goal !== undefined) return [restore(kind, rawcode, goal)];
  return [fieldRemoval({ ...place.address, field })];
}

/** A conflict of a merge, with what each side holds, so that a choice can take theirs later. */
export interface PendingConflict {
  readonly conflict: Conflict;
  readonly place: Place;
  /** What the map folder holds there. */
  readonly theirs: Held;
}

/** One place a merge replays: the edits that give the new saved state the unsaved value. */
export interface Replayed {
  readonly place: Place;
  readonly edits: readonly SessionEdit[];
  /** The conflict at the place, when it is one: its unsaved value applied until the author chooses. */
  readonly conflict?: PendingConflict;
}

/**
 * Plans the merge of the unsaved edits on a map folder that changed on
 * disk, field by field. At each place the working state changes from the
 * saved state (the edits' base): when the new saved state holds the base's
 * value there, or a conflict left to choose is no longer one, the edit is
 * replayed; when it holds the working value, nothing is left to do; when
 * it holds a third value, or the place is a conflict left from a merge
 * before, it is a conflict, the unsaved value replayed until the author
 * chooses.
 *
 * @param saved - The saved state the edits were made on.
 * @param working - The working state.
 * @param next - The new saved state, read from the map folder.
 * @param pending - The ids of the conflicts left to choose from a merge before.
 * @returns What to replay, in order, conflicts included.
 */
export function planMerge(
  saved: ObjectState,
  working: ObjectState,
  next: ObjectState,
  pending: ReadonlySet<string>,
): Replayed[] {
  const plan: Replayed[] = [];
  for (const { place, held, contents } of compare([saved, working, next])) {
    const [base, mine, theirs] = contents;
    if (mine === base || mine === theirs) continue;
    const [, mineHeld, theirsHeld] = held;
    const edits = editsTo(place, theirsHeld, mineHeld);
    if (theirs === base && !pending.has(place.id)) {
      plan.push({ place, edits });
      continue;
    }
    plan.push({
      place,
      edits,
      conflict: {
        place,
        theirs: theirsHeld,
        conflict: {
          id: place.id,
          ...place.address,
          mine: turnValue(place, mineHeld),
          theirs: turnValue(place, theirsHeld),
        },
      },
    });
  }
  return plan;
}

/** A field a World Editor save put back, with what the Studio's last save left there, so that it can be applied again. */
export interface PendingPutBack {
  readonly putBack: PutBack;
  readonly place: Place;
  /** What the Studio's last save left there. */
  readonly studio: Held;
}

/**
 * The places the Studio saved that the new saved state holds as one of the
 * states before: each place where the new saved state differs from what
 * the Studio's last save left and equals what an earlier state held there,
 * the state before the first save or any save since. A World Editor that
 * loaded the earliest state and missed every reload since saves it back so
 * ([#871](https://github.com/phmilk/reforged-ts/issues/871): 1000, then
 * 1234 and 2000 saved, the World Editor saving 1000). A field of an object
 * the new saved state no longer holds as the save left it (removed, or
 * another base) is not put back: the whole object is compared instead.
 *
 * @param saves - The states the Studio saved since the World Editor last
 *   loaded the map: the state before the first save, then each save's, the
 *   last one last.
 * @param next - The new saved state.
 * @returns The places put back, in order.
 */
export function findPutBack(
  saves: readonly ObjectState[],
  next: ObjectState,
): PendingPutBack[] {
  const found: PendingPutBack[] = [];
  const last = saves.length - 1;
  if (last < 1) return found;
  for (const { place, held, contents } of compare([...saves, next])) {
    const wrote = contents[last];
    const now = contents[last + 1];
    if (now === wrote || !contents.slice(0, last).includes(now)) {
      continue;
    }
    const wroteHeld = held[last];
    const nowHeld = held[last + 1];
    found.push({
      place,
      studio: wroteHeld,
      putBack: {
        ...place.address,
        studio: turnValue(place, wroteHeld),
        worldEditor: turnValue(place, nowHeld),
      },
    });
  }
  return found;
}

/**
 * What the working state holds at a place.
 *
 * @param working - The working state.
 * @param place - The place.
 * @returns The object, or the field's modification.
 */
export function heldAt(working: ObjectState, place: Place): Held {
  const object = working.get(place.key);
  const { field } = place.address;
  if (field === undefined || object === undefined) return object;
  const id = placeKey({
    field,
    level: place.address.level,
    dataPointer: place.address.dataPointer,
  } as ObjectDataModification);
  return byPlace(object).get(id);
}
