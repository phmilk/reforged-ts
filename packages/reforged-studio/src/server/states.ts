/**
 * The states of the Studio's session, compared field by field: an object's
 * key, a modification's place, what it holds, and the edits that take one
 * state to another. The session (`./session.ts`) and the turns with the
 * World Editor (`./turns.ts`) share them.
 */
import type {
  Locale,
  ObjectDataModification,
  ObjectDataObject,
  ObjectKind,
} from "reforged-map";
import type { Edit } from "./api-types.js";

/** An object's key in a state: its Object kind and its Rawcode. */
export const objectKey = (kind: ObjectKind, rawcode: string): string =>
  `${kind}:${rawcode}`;

/** The map folder's objects as the editor lists them, by {@link objectKey}. */
export type ObjectState = ReadonlyMap<string, ObjectDataObject>;

/** The translations of a localizable value, by locale. */
export type Translations = Readonly<Partial<Record<Locale, string>>>;

/**
 * An edit as the session applies it: one of the API's, a `setField` with
 * the translations it restores. An edit of the API keeps the translations
 * the field holds: the Studio edits a localizable field's default text only.
 */
export type SessionEdit =
  | Edit
  | (Extract<Edit, { op: "setField" }> & {
      readonly translations: Translations;
    });

/** A modification's place in an object, whichever file holds it: its field, level and data pointer. */
export const placeKey = (modification: ObjectDataModification): string =>
  [
    modification.field,
    String(modification.level ?? 0),
    String(modification.dataPointer ?? 0),
  ].join(" ");

/** A modification's identity in an object: its place and its file. */
export const modificationKey = (modification: ObjectDataModification): string =>
  `${placeKey(modification)} ${modification.file}`;

/**
 * What a modification holds, to compare two states: its value, a
 * `TRIGSTR_nnn` resolved, and its translations. The number of a
 * `TRIGSTR_nnn` is left out: an undo that gives a removed name back gives it
 * the text it had, under the number the writer picks.
 */
export const contentOf = (modification: ObjectDataModification): string =>
  JSON.stringify([modification.value, modification.translations]);

/** The `setField` that gives a modification's field its value and translations back. */
export function restore(
  kind: ObjectKind,
  rawcode: string,
  modification: ObjectDataModification,
): SessionEdit {
  return {
    op: "setField",
    kind,
    rawcode,
    field: modification.field,
    ...(modification.level !== undefined && { level: modification.level }),
    ...(modification.dataPointer !== undefined && {
      dataPointer: modification.dataPointer,
    }),
    value: modification.value,
    translations: modification.translations ?? {},
  };
}

/** The `removeField` of an object's field, at its level and data pointer when it has them. */
export function fieldRemoval(address: {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  readonly field: string;
  readonly level?: number;
  readonly dataPointer?: number;
}): Extract<Edit, { op: "removeField" }> {
  return {
    op: "removeField",
    kind: address.kind,
    rawcode: address.rawcode,
    field: address.field,
    ...(address.level !== undefined && { level: address.level }),
    ...(address.dataPointer !== undefined && {
      dataPointer: address.dataPointer,
    }),
  };
}

/** The `removeField` of a modification's field. */
export const removal = (
  kind: ObjectKind,
  rawcode: string,
  modification: ObjectDataModification,
): Edit => fieldRemoval({ ...modification, kind, rawcode });

/** Each modification of an object by its place, the last one of a place kept. */
export const byPlace = (
  object: ObjectDataObject,
): Map<string, ObjectDataModification> =>
  new Map(
    object.modifications.map((modification) => [
      placeKey(modification),
      modification,
    ]),
  );

/**
 * The edits that take `saved` to `working`, field by field: each object
 * added with its fields, each object removed, and each field set, changed
 * or removed.
 */
export function editsBetween(
  saved: ObjectState,
  working: ObjectState,
): SessionEdit[] {
  const edits: SessionEdit[] = [];
  for (const [key, before] of saved) {
    if (!working.has(key)) {
      edits.push({
        op: "removeObject",
        kind: before.kind,
        rawcode: before.rawcode,
      });
    }
  }
  for (const [key, after] of working) {
    const { kind, rawcode } = after;
    const before = saved.get(key);
    if (
      before === undefined &&
      after.origin === "custom" &&
      after.base !== undefined
    ) {
      edits.push({ op: "addObject", kind, rawcode, base: after.base });
    }
    const from =
      before === undefined
        ? new Map<string, ObjectDataModification>()
        : byPlace(before);
    const to = byPlace(after);
    for (const [place, modification] of from) {
      if (!to.has(place)) edits.push(removal(kind, rawcode, modification));
    }
    for (const [place, modification] of to) {
      const was = from.get(place);
      if (was === undefined || contentOf(was) !== contentOf(modification)) {
        edits.push(restore(kind, rawcode, modification));
      }
    }
  }
  return edits;
}

/** An edit as the API names it: a `setField` without the translations the session keeps. */
export function publicEdit(edit: SessionEdit): Edit {
  if (edit.op !== "setField") return edit;
  return {
    op: "setField",
    kind: edit.kind,
    rawcode: edit.rawcode,
    field: edit.field,
    ...(edit.level !== undefined && { level: edit.level }),
    ...(edit.dataPointer !== undefined && { dataPointer: edit.dataPointer }),
    value: edit.value,
  };
}
