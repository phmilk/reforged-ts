/**
 * The objects the Studio shows: the Rawcode lookup's (the map folder's as
 * on disk, the Object definitions and the Built-in objects of
 * `reforged-builtins`), with the map folder's replaced by the session's
 * working state, so that an unsaved edit shows; and one object's field
 * table, its fields and base values read from the install.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  GameDataSet,
  ObjectDataModification,
  ObjectKind,
  RawcodeObject,
} from "reforged-map";
import type { GameData } from "../game-data.js";
import { OBJECT_KINDS } from "../kinds.js";
import {
  OBJECT_ORIGINS,
  type DefinitionSource,
  type FieldRow,
  type ListedObject,
  type ObjectDetail,
} from "./api-types.js";
import { objectKey, type ObjectState } from "./session.js";

/** What the objects are composed from. */
export interface ObjectSources {
  /** The Map project's root, which a definition's path is relative to. */
  readonly projectRoot: string;
  /** The lookup's listing of every object, read from disk. */
  readonly listed: readonly RawcodeObject[];
  /** The map's Game data set, undefined when unknown. */
  readonly gameDataSet: GameDataSet | undefined;
  /** What the map folder held at the session's last read. */
  readonly saved: ObjectState;
  /** The session's working state. */
  readonly working: ObjectState;
}

/** The Object definition of a listed object, when one defines it. */
function definitionOf(
  object: RawcodeObject,
  projectRoot: string,
): DefinitionSource | undefined {
  if (object.origin === "builtin" || object.definitionFile === undefined) {
    return undefined;
  }
  return {
    file: object.definitionFile,
    path: path
      .relative(projectRoot, object.definitionFile)
      .split(path.sep)
      .join("/"),
  };
}

/** Whether a Built-in object, modified or not, is outside the map's Game data set. */
function outside(
  object: RawcodeObject,
  gameDataSet: GameDataSet | undefined,
): boolean {
  return (
    gameDataSet !== undefined &&
    object.origin !== "custom" &&
    object.gameDataSets.length > 0 &&
    !object.gameDataSets.some((set) => set.id === gameDataSet.id)
  );
}

/** The enUS name of a Built-in object the lookup lists. */
function builtinName(object: RawcodeObject | undefined): string | undefined {
  if (object === undefined) return undefined;
  if (object.origin === "builtin") return object.name;
  if (object.origin === "modified") return object.builtinName;
  return undefined;
}

/**
 * Every object the Studio shows, by Object kind, origin (Custom objects,
 * Object definitions, modified Built-in objects, Built-in objects), then
 * Rawcode in code point order.
 */
export function composeObjects(sources: ObjectSources): ListedObject[] {
  const { listed, saved, working, gameDataSet, projectRoot } = sources;
  const byKey = new Map(
    listed.map((object) => [objectKey(object.kind, object.rawcode), object]),
  );
  const kindsOf = new Map<string, Set<ObjectKind>>();
  const shareRawcode = (kind: ObjectKind, rawcode: string): void => {
    const kinds = kindsOf.get(rawcode) ?? new Set();
    kinds.add(kind);
    kindsOf.set(rawcode, kinds);
  };

  const definitions = new Set<string>();
  const onDisk = new Set<string>();
  for (const [key, object] of byKey) {
    if (object.origin === "builtin") continue;
    (object.definitionFile === undefined ? onDisk : definitions).add(key);
  }

  const objects: Omit<ListedObject, "shared">[] = [];
  for (const object of byKey.values()) {
    const definition = definitionOf(object, projectRoot);
    if (definition !== undefined) {
      objects.push({
        rawcode: object.rawcode,
        kind: object.kind,
        origin: "definition",
        name: object.name,
        ...(object.origin === "custom"
          ? { base: object.base }
          : { builtinName: builtinName(object) }),
        definition,
        inGameDataSet: !outside(object, gameDataSet),
      });
    }
  }
  for (const [key, object] of working) {
    // An object the code defines replaces the map folder's; one the Object
    // manifest owns that no definition defines is not in the map's objects.
    if (definitions.has(key)) continue;
    if (saved.has(key) && !onDisk.has(key) && byKey.size > 0) continue;
    const listedAt = byKey.get(key);
    if (object.origin === "custom") {
      const base = object.base ?? "";
      objects.push({
        rawcode: object.rawcode,
        kind: object.kind,
        origin: "custom",
        name: object.name,
        base: {
          rawcode: base,
          name: builtinName(byKey.get(objectKey(object.kind, base))),
        },
        inGameDataSet: true,
      });
    } else {
      const name = builtinName(listedAt);
      objects.push({
        rawcode: object.rawcode,
        kind: object.kind,
        origin: "modified",
        name: object.name ?? name,
        ...(name !== undefined && { builtinName: name }),
        inGameDataSet:
          listedAt === undefined || !outside(listedAt, gameDataSet),
      });
    }
  }
  for (const [key, object] of byKey) {
    if (
      object.origin === "custom" ||
      definitions.has(key) ||
      working.has(key)
    ) {
      continue;
    }
    const name = builtinName(object);
    objects.push({
      rawcode: object.rawcode,
      kind: object.kind,
      origin: "builtin",
      name,
      ...(name !== undefined && { builtinName: name }),
      inGameDataSet: !outside(object, gameDataSet),
    });
  }

  for (const object of objects) shareRawcode(object.kind, object.rawcode);
  return objects
    .map((object) => ({
      ...object,
      shared: (kindsOf.get(object.rawcode)?.size ?? 0) > 1,
    }))
    .sort(
      (a, b) =>
        OBJECT_KINDS.indexOf(a.kind) - OBJECT_KINDS.indexOf(b.kind) ||
        OBJECT_ORIGINS.indexOf(a.origin) - OBJECT_ORIGINS.indexOf(b.origin) ||
        (a.rawcode < b.rawcode ? -1 : a.rawcode > b.rawcode ? 1 : 0),
    );
}

/** The Rawcode an object's base values are read from: a Custom object's base, else its own. */
function baseRawcode(object: ListedObject): string {
  return object.base?.rawcode ?? object.rawcode;
}

/**
 * The line of an Object definition's Rawcode in its file, from 1: the first
 * line with a `rawcode` property holding it, else the first with it quoted,
 * else 1. Read once; a file that cannot be read gives 1.
 */
export function definitionLine(file: string, rawcode: string): number {
  let lines: string[];
  try {
    lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  } catch {
    return 1;
  }
  const quoted = ['"', "'", "`"].map((quote) => `${quote}${rawcode}${quote}`);
  const holds = (line: string) =>
    quoted.some((literal) => line.includes(literal));
  const property = lines.findIndex(
    (line) => /\brawcode\s*:/.test(line) && holds(line),
  );
  const any = property === -1 ? lines.findIndex(holds) : property;
  return any === -1 ? 1 : any + 1;
}

/**
 * One object's field table: each field of its kind the install knows (but a
 * field specific to other bases), one row per level for a field of levels,
 * with its base's value and the working state's modification; then each
 * modification of a field the install does not know.
 */
export function detailOf(
  object: ListedObject,
  working: ObjectState,
  gameData: GameData,
): ObjectDetail {
  const kind = gameData.kinds[object.kind];
  const base = baseRawcode(object);
  const baseValues = kind.objects.get(base)?.values;
  const modifications =
    object.origin === "custom" || object.origin === "modified"
      ? (working.get(objectKey(object.kind, object.rawcode))?.modifications ??
        [])
      : [];
  const used = new Set<ObjectDataModification>();
  const find = (field: string, level: number | undefined) => {
    const found = modifications.find(
      (modification) =>
        !used.has(modification) &&
        modification.field === field &&
        (level === undefined || modification.level === level),
    );
    if (found !== undefined) used.add(found);
    return found;
  };
  const row = (
    head: Pick<FieldRow, "id" | "label" | "type" | "category">,
    level: number | undefined,
    baseValue: string | undefined,
    modification: ObjectDataModification | undefined,
  ): FieldRow => ({
    id: head.id,
    ...(head.label !== undefined && { label: head.label }),
    ...(head.type !== undefined && { type: head.type }),
    ...(head.category !== undefined && { category: head.category }),
    ...(level !== undefined && { level }),
    ...(baseValue !== undefined && { base: baseValue }),
    ...(modification !== undefined && {
      value: modification.value,
      stored: modification.stored,
    }),
    modified: modification !== undefined,
  });

  const fields: FieldRow[] = [];
  for (const field of kind.fields.values()) {
    if (field.specific !== undefined && !field.specific.includes(base))
      continue;
    const head = {
      id: field.id,
      label: field.label,
      type: field.type,
      category: field.category,
    };
    const value = baseValues?.get(field.id);
    if (field.repeat > 0) {
      const levels = Array.isArray(value) ? (value as readonly string[]) : [];
      const modified = modifications
        .filter((modification) => modification.field === field.id)
        .map((modification) => modification.level ?? 0);
      const count = Math.max(levels.length, ...modified);
      for (let level = 1; level <= count; level++) {
        fields.push(row(head, level, levels[level - 1], find(field.id, level)));
      }
    } else {
      const single = typeof value === "string" ? value : value?.[0];
      fields.push(row(head, undefined, single, find(field.id, undefined)));
    }
  }
  for (const modification of modifications) {
    if (used.has(modification)) continue;
    fields.push(
      row(
        { id: modification.field },
        modification.level,
        undefined,
        modification,
      ),
    );
  }
  return {
    ...object,
    fields,
    ...(object.definition !== undefined && {
      readOnly: {
        ...object.definition,
        line: definitionLine(object.definition.file, object.rawcode),
      },
    }),
  };
}
