// Changes made outside the code (#700, "Object sync" steps 4 and 5; #705):
// an owned object whose map folder state is neither what the last sync
// wrote nor what the code would write, and the objects a sync removed that
// the map folder holds again. Object sync refuses the first, unless forced;
// the build's merge warns of them.

import type { PreparedDefinitions } from "./definitions.js";
import { ObjectDefinitionsError } from "./definitions-error.js";
import type { ObjectDefinitionProblem } from "./definitions-error.js";
import type { ObjectKind } from "./model.js";
import type { ObjectDataObject } from "./object-data-editor.js";
import {
  byKindThenRawcode,
  objectKey,
  sameSnapshot,
  snapshotOf,
  type ObjectSnapshot,
  type SnapshotModification,
} from "./object-manifest.js";

/** An owned object changed in the map folder outside the code. */
export interface DriftedObject {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  /** What changed, in a few words for a one-line warning: the field ids, `base`, or `deleted`. */
  readonly changes: readonly string[];
  /** One problem per field changed, with the manifest's value and the map folder's. */
  readonly problems: readonly ObjectDefinitionProblem[];
}

/** The first line of the error of changes made outside the code. */
const DRIFT_HEADER =
  "Objects the code owns were changed in the map folder outside the code since the last Object sync: nothing was written. Copy each change into its definition, or sync with force (pnpm objects:sync --force) to overwrite them with the code's version.";

/** Compares two strings by UTF-16 code unit. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A modification's address: field id, level and data pointer. */
function addressOf(modification: SnapshotModification): string {
  return `${modification.field} ${String(modification.level ?? 0)} ${String(modification.dataPointer ?? 0)}`;
}

/** A field at an address, as a message names it. */
function label(modification: SnapshotModification): string {
  const { field, level, dataPointer } = modification;
  return `${field}${level === undefined || level === 0 ? "" : ` at level ${String(level)}`}${dataPointer === undefined || dataPointer === 0 ? "" : ` (data pointer ${String(dataPointer)})`}`;
}

/** The values held at one address, as a message shows them. */
function shown(
  held: readonly SnapshotModification[],
  withType: boolean,
): string {
  if (held.length === 0) return "not set";
  return held
    .map(({ type, value, translations }) => {
      const text =
        typeof value === "string" ? JSON.stringify(value) : String(value);
      const locales = Object.entries(translations ?? {});
      const translated =
        locales.length === 0
          ? text
          : `${text} (${locales.map(([locale, each]) => `${locale} ${JSON.stringify(each)}`).join(", ")})`;
      return withType ? `${translated} (${type})` : translated;
    })
    .join(" and ");
}

/** The modifications of a snapshot, by address. */
function byAddress(
  snapshot: ObjectSnapshot | undefined,
): Map<string, SnapshotModification[]> {
  const addresses = new Map<string, SnapshotModification[]>();
  for (const modification of snapshot?.modifications ?? []) {
    const address = addressOf(modification);
    const held = addresses.get(address);
    if (held === undefined) addresses.set(address, [modification]);
    else held.push(modification);
  }
  return addresses;
}

/** How an owned object's map folder state differs from the manifest's. */
function differences(
  entry: ObjectSnapshot,
  now: ObjectSnapshot | undefined,
  file: string | undefined,
): DriftedObject {
  const { kind, rawcode } = entry;
  const problem = (
    field: string | undefined,
    message: string,
  ): ObjectDefinitionProblem => ({ file, rawcode, field, message });
  if (now === undefined && entry.base !== undefined) {
    return {
      kind,
      rawcode,
      changes: ["deleted"],
      problems: [
        problem(
          undefined,
          `The Custom ${kind} ${rawcode} is in the Object manifest and was deleted from the map folder.`,
        ),
      ],
    };
  }
  const changes: string[] = [];
  const problems: ObjectDefinitionProblem[] = [];
  if (now !== undefined && now.base !== entry.base) {
    changes.push("base");
    problems.push(
      problem(
        undefined,
        `The ${kind} ${rawcode}'s base is ${entry.base ?? "none"} in the Object manifest and ${now.base ?? "none"} in the map folder.`,
      ),
    );
  }
  const was = byAddress(entry);
  const is = byAddress(now);
  const addresses = [...new Set([...was.keys(), ...is.keys()])]
    .map((address) => {
      const [first] = was.get(address) ?? is.get(address) ?? [];
      return { address, first };
    })
    .sort(
      (a, b) =>
        compare(a.first.field, b.first.field) ||
        (a.first.level ?? 0) - (b.first.level ?? 0) ||
        (a.first.dataPointer ?? 0) - (b.first.dataPointer ?? 0),
    );
  for (const { address, first } of addresses) {
    const before = was.get(address) ?? [];
    const after = is.get(address) ?? [];
    const values = (held: readonly SnapshotModification[]) =>
      held
        .map(
          ({ type, value, translations }) =>
            `${type} ${JSON.stringify(value)} ${JSON.stringify(translations ?? {})}`,
        )
        .join();
    if (values(before) === values(after)) continue;
    const plain = shown(before, false) === shown(after, false);
    if (!changes.includes(first.field)) changes.push(first.field);
    problems.push(
      problem(
        first.field,
        `The ${kind} ${rawcode}'s ${label(first)} is ${shown(before, plain)} in the Object manifest and ${shown(after, plain)} in the map folder.`,
      ),
    );
  }
  return { kind, rawcode, changes, problems };
}

/**
 * The owned objects changed in the map folder outside the code, by Object
 * kind then Rawcode: each owned object whose state in the map folder is
 * neither the manifest's snapshot nor what the code writes, an owned object
 * missing from the map folder included. One already equal to what the code
 * writes is a sync interrupted before its manifest write, not a change.
 *
 * @param prepared - The definitions and the Object manifest.
 * @param before - The map folder's objects, as read.
 * @param after - The objects once the definitions are applied, unsaved.
 */
export function findDrift(
  prepared: PreparedDefinitions,
  before: ReadonlyMap<string, ObjectDataObject>,
  after: ReadonlyMap<string, ObjectDataObject>,
): DriftedObject[] {
  const files = new Map(
    prepared.definitions.map((definition) => [
      objectKey(definition),
      definition.file,
    ]),
  );
  const drifted: DriftedObject[] = [];
  for (const entry of [...prepared.manifest.owned].sort(byKindThenRawcode)) {
    const key = objectKey(entry);
    const current = before.get(key);
    const now = current === undefined ? undefined : snapshotOf(current);
    if (now !== undefined && sameSnapshot(now, entry)) continue;
    const written = after.get(key);
    const will = written === undefined ? undefined : snapshotOf(written);
    if (now === undefined && will === undefined) continue;
    if (now !== undefined && will !== undefined && sameSnapshot(now, will)) {
      continue;
    }
    drifted.push(differences(entry, now, files.get(key)));
  }
  return drifted;
}

/** The error of changes made outside the code: each object and field, with the manifest's value and the map folder's. */
export function driftError(
  drifted: readonly DriftedObject[],
): ObjectDefinitionsError {
  return new ObjectDefinitionsError(
    "changed-outside-code",
    drifted.flatMap((object) => object.problems),
    DRIFT_HEADER,
  );
}

/** Whether the map folder holds a removed object again exactly as it was removed: a stale World Editor save brought it back. */
export function isReturned(
  entry: ObjectSnapshot,
  present: ReadonlyMap<string, ObjectDataObject>,
): boolean {
  const current = present.get(objectKey(entry));
  return current !== undefined && sameSnapshot(snapshotOf(current), entry);
}

/** What the map folder holds at the Rawcodes of the manifest's removed entries no definition takes again. */
export interface RemovedEntries {
  /** The removed objects a stale World Editor save brought back unchanged, to remove again. */
  readonly returned: readonly ObjectDataObject[];
  /** The new objects of the map folder at a removed Rawcode, left alone; their removed entries go. */
  readonly leftAlone: readonly ObjectDataObject[];
  /** The removed entries the manifest keeps. */
  readonly kept: readonly ObjectSnapshot[];
}

/**
 * Sorts the manifest's removed entries no definition takes again: a
 * Rawcode the map folder does not hold keeps its entry, one it holds as
 * removed is to remove again and keeps its entry, and one it holds as
 * another object is a new object of the map folder, left alone, its entry
 * dropped. An entry a definition takes again is dropped.
 */
export function removedEntries(
  prepared: PreparedDefinitions,
  present: ReadonlyMap<string, ObjectDataObject>,
): RemovedEntries {
  const defined = new Set(prepared.definitions.map(objectKey));
  const returned: ObjectDataObject[] = [];
  const leftAlone: ObjectDataObject[] = [];
  const kept: ObjectSnapshot[] = [];
  for (const entry of [...prepared.manifest.removed].sort(byKindThenRawcode)) {
    const key = objectKey(entry);
    if (defined.has(key)) continue;
    const current = present.get(key);
    if (current === undefined) {
      kept.push(entry);
    } else if (isReturned(entry, present)) {
      returned.push(current);
      kept.push(entry);
    } else {
      leftAlone.push(current);
    }
  }
  return { returned, leftAlone, kept };
}
