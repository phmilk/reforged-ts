/**
 * The objects the Studio shows: the Rawcode lookup's (the map folder's as
 * on disk, the Object definitions and the Built-in objects of
 * `reforged-builtins`), with the map folder's replaced by the session's
 * working state, so that an unsaved edit shows, each with its group in the
 * World Editor's tree and its icon from the install's game data model; and
 * one object's field table, its fields, base values and the values as the
 * editor shows them read from the install.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  FieldEntry,
  FieldTable,
  GameDataSet,
  ObjectDataModification,
  ObjectKind,
  RawcodeObject,
} from "reforged-map";
import type {
  FieldValue,
  GameData,
  GameField,
  GameKind,
} from "../game-data.js";
import { OBJECT_KINDS } from "../kinds.js";
import {
  OBJECT_ORIGINS,
  type DefinitionSource,
  type FieldInput,
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
  /** The game data model base values, groups and icons are read from. */
  readonly gameData: GameData;
}

/**
 * The field each kind's icon is, as the Object Editor shows it in its tree:
 * the Art of a unit, an item, an ability or a buff, an upgrade's first
 * level's; destructables and doodads have none. A kind whose install lacks
 * it takes its first field of the type `icon`.
 */
const ICON_FIELDS: Readonly<Record<ObjectKind, string | undefined>> = {
  unit: "uico",
  item: "iico",
  ability: "aart",
  buff: "fart",
  destructable: undefined,
  doodad: undefined,
  upgrade: "gar1",
};

/** The icon field of a kind, in its install's fields. */
function iconField(kind: GameKind): GameField | undefined {
  const preferred = ICON_FIELDS[kind.kind];
  if (preferred === undefined) return undefined;
  return (
    kind.fields.get(preferred) ??
    [...kind.fields.values()].find((field) => field.type === "icon")
  );
}

/** The labels of the words of the World Editor's tree groups (`GameObject.group`). */
const GROUP_WORDS: Readonly<Record<string, string>> = {
  melee: "Melee",
  campaign: "Campaign",
  units: "Units",
  buildings: "Buildings",
  heroes: "Heroes",
  special: "Special",
  items: "Items",
  buffs: "Buffs",
  effects: "Effects",
};

/**
 * The enumeration of the editor data that labels each kind's outermost
 * group: the race of a unit, an ability, a buff or an upgrade, the class
 * of an item; a destructable's or a doodad's category has none.
 */
const GROUP_ENUMERATIONS: Readonly<Record<ObjectKind, string | undefined>> = {
  unit: "unitRace",
  item: "itemClass",
  ability: "unitRace",
  buff: "unitRace",
  destructable: undefined,
  doodad: undefined,
  upgrade: "unitRace",
};

/** A base value's first level: the value itself for a field of one value. */
const firstValue = (value: FieldValue | undefined): string | undefined =>
  typeof value === "string" ? value : value?.[0];

/**
 * A Built-in object's group in the World Editor's tree, each level
 * labelled: the outermost through the enumeration of the editor data
 * {@link GROUP_ENUMERATIONS} names, the tree's words through
 * {@link GROUP_WORDS}, a value with no label as it
 * is; empty levels left out. Undefined when the install does not hold it.
 */
function groupOf(
  kind: ObjectKind,
  rawcode: string,
  gameData: GameData,
): string[] | undefined {
  const object = gameData.kinds[kind].objects.get(rawcode);
  if (object === undefined) return undefined;
  const outermost = GROUP_ENUMERATIONS[kind];
  return object.group
    .map((value, level) =>
      level === 0 && outermost !== undefined
        ? (gameData
            .enumeration(outermost)
            ?.find((entry) => entry.value === value)?.label ?? value)
        : (GROUP_WORDS[value] ?? value),
    )
    .filter((label) => label !== "");
}

/**
 * The path of an object's icon: the working state's modification of its
 * kind's icon field, else its base's value (a Custom object's base, else
 * its own Built-in object's); undefined when neither holds one.
 */
function iconOf(
  kind: ObjectKind,
  rawcode: string,
  baseRawcode: string,
  working: ObjectState,
  gameData: GameData,
): string | undefined {
  const field = iconField(gameData.kinds[kind]);
  if (field === undefined) return undefined;
  const modification = working
    .get(objectKey(kind, rawcode))
    ?.modifications.find(
      (candidate) =>
        candidate.field === field.id && (candidate.level ?? 1) === 1,
    );
  if (modification !== undefined) {
    return String(modification.value) || undefined;
  }
  const first = firstValue(
    gameData.kinds[kind].objects.get(baseRawcode)?.values.get(field.id),
  );
  return first === undefined || first === "" ? undefined : first;
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
  const { listed, saved, working, gameDataSet, projectRoot, gameData } =
    sources;
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
    .map((object) => {
      const group =
        object.origin === "builtin" || object.origin === "modified"
          ? groupOf(object.kind, object.rawcode, gameData)
          : undefined;
      const icon = iconOf(
        object.kind,
        object.rawcode,
        object.base?.rawcode ?? object.rawcode,
        working,
        gameData,
      );
      return {
        ...object,
        ...(group !== undefined && { group }),
        ...(icon !== undefined && { icon }),
        shared: (kindsOf.get(object.rawcode)?.size ?? 0) > 1,
      };
    })
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

/** What one object's field table is read from. */
export interface DetailSources {
  /** The session's working state. */
  readonly working: ObjectState;
  /** What the map folder held at the session's last read, to tell an unsaved edit. */
  readonly saved: ObjectState;
  /** The game data model base values and labels are read from. */
  readonly gameData: GameData;
  /** `reforged-builtins`' field table, which gives each field its input; undefined when it cannot be read. */
  readonly fieldTable: FieldTable | undefined;
  /** Every object the Studio shows, which a Rawcode list's chips name. */
  readonly objects: readonly ListedObject[];
}

/** The input of each category of the field table but the numbers. */
const INPUTS: Readonly<
  Partial<Record<NonNullable<FieldEntry["category"]>, FieldInput>>
> = {
  boolean: "toggle",
  enumeration: "select",
  rawcodeList: "rawcodes",
  rawcode: "text",
  text: "text",
  stringList: "text",
};

/** The input of a field, by its value type and its category in the field table, an icon's by its metadata type. */
function inputOf(
  valueType: NonNullable<FieldRow["valueType"]>,
  entry: FieldEntry | undefined,
  metaType: string | undefined,
): FieldInput {
  if (metaType === "icon" && valueType === "string") return "icon";
  const input =
    entry?.category === undefined ? undefined : INPUTS[entry.category];
  if (input !== undefined) return input;
  if (valueType === "int") return "integer";
  if (valueType === "string") return "text";
  return "real";
}

/** The Rawcodes of a Rawcode list's value: `Adef,A000`. */
const rawcodesOf = (value: string): string[] =>
  value
    .split(",")
    .map((rawcode) => rawcode.trim())
    .filter((rawcode) => rawcode !== "");

/**
 * One object's field table: each field of its kind the install knows (but a
 * field specific to other bases), one row per level for a field of levels,
 * with its base's value and the working state's modification; then each
 * modification of a field the install does not know. Each row says the
 * input it edits with, from the field table.
 */
export function detailOf(
  object: ListedObject,
  sources: DetailSources,
): ObjectDetail {
  const { working, saved, gameData, fieldTable } = sources;
  const kind = gameData.kinds[object.kind];
  const base = baseRawcode(object);
  const baseValues = kind.objects.get(base)?.values;
  const entries = fieldTable?.fields[object.kind];
  const inMap = object.origin === "custom" || object.origin === "modified";
  const key = objectKey(object.kind, object.rawcode);
  const modifications = inMap ? (working.get(key)?.modifications ?? []) : [];
  const savedModifications = inMap ? (saved.get(key)?.modifications ?? []) : [];
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
  /** The saved state's modification of a field, to tell an unsaved edit. */
  const savedOf = (field: string, level: number | undefined) =>
    savedModifications.find(
      (modification) =>
        modification.field === field &&
        (level === undefined || modification.level === level),
    );
  const named = (rawcode: string, of: ObjectKind | undefined) => {
    const found = sources.objects.find(
      (other) =>
        other.rawcode === rawcode && (of === undefined || other.kind === of),
    );
    return found === undefined
      ? { rawcode }
      : {
          rawcode,
          kind: found.kind,
          ...(found.name !== undefined && { name: found.name }),
        };
  };
  /** A value as the editor shows it: an enumeration's label, a `WESTRING_` key resolved. */
  const shown = (
    value: number | string,
    enumeration: GameField["enumeration"],
  ): string => {
    const raw = String(value);
    const label = enumeration?.find((entry) => entry.value === raw)?.label;
    return label ?? gameData.text(raw) ?? raw;
  };
  const row = (
    head: Pick<FieldRow, "id" | "label" | "type" | "category">,
    level: number | undefined,
    baseValue: string | undefined,
    modification: ObjectDataModification | undefined,
    enumeration?: GameField["enumeration"],
  ): FieldRow => {
    const baseDisplay =
      baseValue === undefined ? undefined : shown(baseValue, enumeration);
    const display =
      modification === undefined
        ? baseDisplay
        : shown(modification.value, enumeration);
    const entry = entries?.[head.id];
    const valueType = modification?.type ?? entry?.type;
    const input =
      valueType === undefined || object.origin === "definition"
        ? undefined
        : inputOf(valueType, entry, head.type ?? entry?.metaType);
    const enumerated = fieldTable?.enumerations?.[entry?.metaType ?? ""];
    const options =
      input !== "select"
        ? undefined
        : (enumeration ??
          enumerated?.map((value) => ({ value: String(value) })));
    const of = OBJECT_KINDS.find((candidate) => candidate === entry?.of);
    const current =
      modification === undefined ? baseValue : String(modification.value);
    const before = savedOf(head.id, level);
    const unsaved =
      before === undefined || modification === undefined
        ? before !== modification
        : JSON.stringify([before.value, before.translations]) !==
          JSON.stringify([modification.value, modification.translations]);
    return {
      id: head.id,
      ...(head.label !== undefined && { label: head.label }),
      ...(head.type !== undefined && { type: head.type }),
      ...(head.category !== undefined && { category: head.category }),
      ...(level !== undefined && { level }),
      ...(baseValue !== undefined && { base: baseValue, baseDisplay }),
      ...(modification !== undefined && {
        value: modification.value,
        stored: modification.stored,
      }),
      ...(display !== undefined && { display }),
      modified: modification !== undefined,
      unsaved,
      ...(input !== undefined && { input }),
      ...(valueType !== undefined && { valueType }),
      ...(options !== undefined && { options }),
      ...(of !== undefined && { of }),
      ...(input === "rawcodes" &&
        current !== undefined && {
          references: rawcodesOf(current).map((rawcode) => named(rawcode, of)),
        }),
      ...(entry?.localizable === true && { localizable: true }),
      ...(modification?.translations !== undefined && {
        translations: modification.translations,
      }),
    };
  };

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
        fields.push(
          row(
            head,
            level,
            levels[level - 1],
            find(field.id, level),
            field.enumeration,
          ),
        );
      }
    } else {
      const single = firstValue(value);
      fields.push(
        row(
          head,
          undefined,
          single,
          find(field.id, undefined),
          field.enumeration,
        ),
      );
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
  // A field the saved state modifies and the working state no longer does,
  // and that the install does not know: a row of its own, unsaved.
  for (const modification of savedModifications) {
    if (fields.some((field) => field.id === modification.field)) continue;
    fields.push({
      ...row(
        { id: modification.field },
        modification.level,
        undefined,
        undefined,
      ),
      unsaved: true,
    });
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
