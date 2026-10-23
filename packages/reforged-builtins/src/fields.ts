/**
 * The field table of a Game version (#634, #632): per Object kind, the label
 * the World Editor writes in `war3map.wts` comments, and per field the facts
 * a writer of Object data needs to write an edit as the editor would, with
 * no game file at run time. Format 2 (#702) adds each field's metadata type
 * and its category for Object definitions, and the raw values of the
 * enumerations, from the World Editor's data (`UI/UnitEditorData.txt`). It
 * is built from the kinds' `*MetaData.slk`, the enUS editor strings and the
 * editor data, then the overrides below, and written byte-stably like the
 * index (`./model.ts`).
 */
import { KIND_CONSTANTS, list } from "./emit.js";
import { byCodePoint, type ObjectKind } from "./model.js";
import type { Profile } from "./profile.js";
import type { SlkTable } from "./slk.js";

/**
 * The field table's shape the generator writes: 2, which adds each field's
 * metadata type and category and the enumerations to format 1.
 */
export const FIELDS_FORMAT = 2;

/** The formats a committed table may have: 1 for a Game version generated before format 2 (3.0.0). */
export const READ_FIELDS_FORMATS: readonly number[] = [1, 2];

/** The type a modification of the field stores: Object data's 0 to 3. */
export type ValueType = "int" | "real" | "unreal" | "string";

/** The file of a kind a field goes in: `war3map.w3u` or `war3mapSkin.w3u`. */
export type FieldFile = "base" | "skin";

/**
 * What a field holds, for Object definitions: a number, a boolean (0 or 1),
 * a text, one raw value of an enumeration, a Rawcode of an Object kind, a
 * list of Rawcodes of a kind, or a list of strings.
 */
export type Category =
  | "number"
  | "boolean"
  | "text"
  | "enumeration"
  | "rawcode"
  | "rawcodeList"
  | "stringList";

/** The categories, in the order the README lists them. */
export const CATEGORIES: readonly Category[] = [
  "number",
  "boolean",
  "text",
  "enumeration",
  "rawcode",
  "rawcodeList",
  "stringList",
];

/** One field of an Object kind. */
export interface FieldEntry {
  type: ValueType;
  /** Its metadata type, the `type` column of its `*MetaData.slk`: `attackType`. Format 2. */
  metaType?: string;
  /** Its category for Object definitions. Format 2. */
  category?: Category;
  /** The Object kind of its Rawcodes, for the categories `rawcode` and `rawcodeList`. */
  of?: ObjectKind;
  file: FieldFile;
  /**
   * Whether the editor writes a value of it as a `TRIGSTR` into
   * `war3map.wts`: a text, never a path such as `umdl`.
   */
  localizable: boolean;
  /** Whether it holds a value per level (a doodad's variation): `repeat` above 0. */
  levels: boolean;
  /** Its data column, the data pointer of a modification, for the abilities, whose metadata has one. */
  data?: number;
  /** Its metadata `field` name, the first part of the editor's comment: `Name`. */
  field: string;
  /** Its enUS label, the second part: `Name`. Absent when the editor strings give none. */
  label?: string;
  /**
   * The base Rawcodes it is specific to, when the metadata says so
   * (`useSpecific`), each item as the metadata writes it.
   */
  specific?: string[];
}

/** The raw values of an enumeration, as the editor data lists them: integers for a type stored as `int`. */
export type EnumerationValues = string[] | number[];

/** The field table of one Game version. */
export interface FieldTable {
  format: number;
  /** The Build it was extracted from, `3.0.0.24268`. */
  build: string;
  /** The Game version, `3.0.0`. */
  gameVersion: string;
  /** Each kind's label in the editor's comments: `Units`, `Buffs/Effects`. */
  kinds: Record<ObjectKind, string>;
  /**
   * The raw values of each enumeration a field reads, by metadata type, in
   * the editor data's order. Format 2.
   */
  enumerations?: Record<string, EnumerationValues>;
  /** Each kind's fields by id. */
  fields: Record<ObjectKind, Record<string, FieldEntry>>;
}

/** The Object kinds, in the order the table lists them. */
export const FIELD_KINDS: readonly ObjectKind[] = [
  "unit",
  "item",
  "ability",
  "buff",
  "destructable",
  "doodad",
  "upgrade",
];

/**
 * The key of each kind's label in the editor strings: its tab in the Object
 * Editor. The editor writes these labels in its comments, as
 * `reforged-map`'s `test/fixtures/editor-objects.w3m/war3map.wts` shows for
 * all seven (`// Buffs/Effects: B000 (), Bufftip (Tooltip)`).
 */
export const KIND_LABEL_KEYS: Readonly<Record<ObjectKind, string>> = {
  unit: "WESTRING_OBJTAB_UNITS",
  item: "WESTRING_OBJTAB_ITEMS",
  ability: "WESTRING_OBJTAB_ABILITIES",
  buff: "WESTRING_OBJTAB_BUFFS",
  destructable: "WESTRING_OBJTAB_DESTRUCTABLES",
  doodad: "WESTRING_OBJTAB_DOODADS",
  upgrade: "WESTRING_OBJTAB_UPGRADES",
};

/**
 * The metadata types whose values a modification stores as an integer:
 * numbers, booleans and the editor's enumerations of integers
 * (`UI/UnitEditorData.txt` gives every one of them integer values), as
 * HiveWE writes them (`save_modification_table` in
 * `src/utilities/modification_tables.ixx`, at stijnherfst/HiveWE commit
 * cd6d61a), and `damageType` and `proctargetType`, two enumerations of
 * integers HiveWE's list predates.
 */
const INT_TYPES: ReadonlySet<string> = new Set([
  "int",
  "bool",
  "attackBits",
  "channelFlags",
  "channelType",
  "damageType",
  "deathType",
  "defenseTypeInt",
  "detectionType",
  "fullFlags",
  "interactionFlags",
  "morphFlags",
  "pickFlags",
  "proctargetType",
  "silenceFlags",
  "spellDetail",
  "stackFlags",
  "teamColor",
  "techAvail",
  "versionFlags",
]);

/**
 * The metadata types whose values a modification stores as a string: texts,
 * paths, codes, lists and the editor's enumerations of words. A type in
 * neither list is an error, so that a new Patch's type gets a decision.
 */
const STRING_TYPES: ReadonlySet<string> = new Set([
  "abilCode",
  "abilityList",
  "abilityModifierStats",
  "abilitySkinList",
  "aiBuffer",
  "armorType",
  "attackType",
  "attributeType",
  "buffList",
  "char",
  "combatSound",
  "defenseType",
  "destructableCategory",
  "doodadCategory",
  "effectList",
  "equipmentType",
  "heroAbilityList",
  "icon",
  "intList",
  "itemClass",
  "itemList",
  "itemTag",
  "lightningEffect",
  "lightningList",
  "model",
  "modelList",
  "moveType",
  "occlusionType",
  "occlusionType2",
  "orderString",
  "pathingListPrevent",
  "pathingListRequire",
  "pathingTexture",
  "regenType",
  "shadowImage",
  "shadowTexture",
  "soundLabel",
  "string",
  "stringList",
  "targetList",
  "techList",
  "texture",
  "tilesetList",
  "uberSplat",
  "unitClass",
  "unitCode",
  "unitList",
  "unitRace",
  "unitSkinList",
  "unitSound",
  "upgradeClass",
  "upgradeCode",
  "upgradeEffect",
  "upgradeList",
  "weaponType",
]);

/**
 * The metadata types of a text: a field of one is localizable when the
 * metadata also marks it as a string the editor externalizes (`stringExt`
 * `1`). The upgrades' `gcls` and `gef1` to `gef4`, a class and effect codes,
 * are marked too, and are not texts.
 */
const TEXT_TYPES: ReadonlySet<string> = new Set([
  "char",
  "string",
  "stringList",
]);

/** A metadata type's category, and what it reads. */
export interface MappedCategory {
  category: Category;
  /** The Object kind of its Rawcodes, for `rawcode` and `rawcodeList`. */
  of?: ObjectKind;
  /**
   * Whether its raw values, or a list's items, are an enumeration of the
   * editor data, a section named after the type: always for `enumeration`.
   */
  enumerated?: boolean;
}

const RAWCODE_OF = (of: ObjectKind): MappedCategory => ({
  category: "rawcode",
  of,
});
const RAWCODES_OF = (of: ObjectKind): MappedCategory => ({
  category: "rawcodeList",
  of,
});
const NUMBER: MappedCategory = { category: "number" };
const TEXT: MappedCategory = { category: "text" };
const ENUMERATION: MappedCategory = {
  category: "enumeration",
  enumerated: true,
};
const STRINGS: MappedCategory = { category: "stringList" };
const ENUMERATED_STRINGS: MappedCategory = {
  category: "stringList",
  enumerated: true,
};

/**
 * Each metadata type's category for Object definitions (#702), the
 * generator's own table. A type it does not map takes its value type's
 * category (`valueTypeCategory`): a number, or a text for a string; the
 * generator warns of it and `builtins:check` lists it, so that a new
 * Patch's type gets a decision and never makes a field unwritable.
 *
 * - The editor's `*Flags` of bits (`channelFlags`, `morphFlags`, ...) are
 *   numbers: the editor data lists one value per bit, and a field holds
 *   their sum. The other enumerations of integers (`teamColor`,
 *   `deathType`, `attackBits`) hold one of their values.
 * - A list of Rawcodes is of the kind its type names; the effects of
 *   `effectList` are buffs, as the Object Editor's Buffs/Effects tab lists
 *   them. `techList` mixes units, upgrades and the editor's `TWN` codes, so
 *   it is a list of strings.
 * - `destructableCategory` and `doodadCategory` are not mapped: their values
 *   are in other files than the editor data's, and no decision is made yet.
 */
export const METADATA_CATEGORIES: Readonly<Record<string, MappedCategory>> = {
  abilCode: RAWCODE_OF("ability"),
  abilityList: RAWCODES_OF("ability"),
  abilityModifierStats: ENUMERATION,
  abilitySkinList: RAWCODES_OF("ability"),
  aiBuffer: ENUMERATION,
  armorType: ENUMERATION,
  attackBits: ENUMERATION,
  attackType: ENUMERATION,
  attributeType: ENUMERATION,
  bool: { category: "boolean" },
  buffList: RAWCODES_OF("buff"),
  channelFlags: NUMBER,
  channelType: ENUMERATION,
  char: TEXT,
  combatSound: ENUMERATION,
  damageType: ENUMERATION,
  deathType: ENUMERATION,
  defenseType: ENUMERATION,
  defenseTypeInt: ENUMERATION,
  detectionType: ENUMERATION,
  effectList: RAWCODES_OF("buff"),
  equipmentType: ENUMERATION,
  fullFlags: ENUMERATION,
  heroAbilityList: RAWCODES_OF("ability"),
  icon: TEXT,
  int: NUMBER,
  intList: STRINGS,
  interactionFlags: NUMBER,
  itemClass: ENUMERATION,
  itemList: RAWCODES_OF("item"),
  itemTag: ENUMERATION,
  lightningEffect: ENUMERATION,
  lightningList: STRINGS,
  model: TEXT,
  modelList: STRINGS,
  morphFlags: NUMBER,
  moveType: ENUMERATION,
  occlusionType: ENUMERATION,
  occlusionType2: ENUMERATION,
  orderString: TEXT,
  pathingListPrevent: ENUMERATED_STRINGS,
  pathingListRequire: ENUMERATED_STRINGS,
  pathingTexture: TEXT,
  pickFlags: NUMBER,
  proctargetType: ENUMERATION,
  real: NUMBER,
  regenType: ENUMERATION,
  shadowImage: ENUMERATION,
  shadowTexture: TEXT,
  silenceFlags: NUMBER,
  soundLabel: TEXT,
  spellDetail: ENUMERATION,
  stackFlags: NUMBER,
  string: TEXT,
  stringList: STRINGS,
  targetList: ENUMERATED_STRINGS,
  teamColor: ENUMERATION,
  techAvail: ENUMERATION,
  techList: STRINGS,
  texture: TEXT,
  tilesetList: STRINGS,
  uberSplat: TEXT,
  unitClass: ENUMERATED_STRINGS,
  unitCode: RAWCODE_OF("unit"),
  unitList: RAWCODES_OF("unit"),
  unitRace: ENUMERATION,
  unitSkinList: RAWCODES_OF("unit"),
  unitSound: TEXT,
  unreal: NUMBER,
  upgradeClass: ENUMERATION,
  upgradeCode: RAWCODE_OF("upgrade"),
  upgradeEffect: ENUMERATION,
  upgradeList: RAWCODES_OF("upgrade"),
  versionFlags: ENUMERATION,
  weaponType: ENUMERATION,
};

/** The category of a metadata type the generator does not map: its value type's. */
export function valueTypeCategory(type: ValueType): Category {
  return type === "string" ? "text" : "number";
}

/**
 * A field's category: its metadata type's in `METADATA_CATEGORIES`, else
 * its value type's, `mapped` false.
 */
export function categoryOf(
  metaType: string,
  type: ValueType,
): MappedCategory & { mapped: boolean } {
  const mapped = Object.hasOwn(METADATA_CATEGORIES, metaType)
    ? METADATA_CATEGORIES[metaType]
    : undefined;
  return mapped === undefined
    ? { category: valueTypeCategory(type), mapped: false }
    : { ...mapped, mapped: true };
}

/**
 * The raw values of the enumeration `type` in the editor data: the first
 * item of each value `00`, `01`, ... of its section, up to its `NumValues`;
 * undefined when the editor data has no such section.
 */
export type Enumerate = (type: string) => string[] | undefined;

/** The World Editor's data of the enumerations, in the base layer. */
export const EDITOR_DATA = "UI/UnitEditorData.txt";

/** An `Enumerate` over the editor data's profile. */
export function enumerator(editorData: Profile): Enumerate {
  return (type) => {
    const count = editorData.get(type, "NumValues");
    const values: string[] = [];
    for (let i = 0; ; i++) {
      if (count !== undefined && i >= Number(count)) break;
      const value = editorData.first(type, String(i).padStart(2, "0"));
      if (value === undefined) break;
      values.push(value);
    }
    return values.length === 0 ? undefined : values;
  };
}

/** A field the World Editor's save treats unlike its metadata, and the fixture that shows it. */
export interface FieldOverride {
  kind: ObjectKind;
  id: string;
  file?: FieldFile;
  localizable?: boolean;
  /** The fixture, by its path in the repository, and what it shows. */
  evidence: string;
}

/**
 * The fields the World Editor's save puts elsewhere than the metadata says,
 * as the editor does it. Each names the fixture that shows it; one whose
 * field the metadata no longer has is an error.
 */
export const FIELD_OVERRIDES: readonly FieldOverride[] = [
  {
    kind: "doodad",
    id: "dnam",
    file: "base",
    evidence:
      "packages/reforged-map/test/fixtures/editor-objects.w3m (#591): the 3.0 World Editor keeps the doodads' name in war3map.w3d, as a TRIGSTR, where every other kind's name goes to its Skin file; the doodads' metadata has no netsafe column to say so.",
  },
];

/** A Rawcode a Built-in object may have: four characters of `[A-Za-z0-9]`. */
const RAWCODE = /^[A-Za-z0-9]{4}$/;
/**
 * An item of `useSpecific`, as the metadata writes it: a Rawcode, but for
 * the abilities' `Blo2` of 3.0.0, specific to `"ACbl.Afzy"`.
 */
const SPECIFIC_ITEM = /^[^,\s]+$/;

/** A kind's metadata, as the generator read it. */
export interface KindMetaData {
  kind: ObjectKind;
  /** The metadata file's path, for the messages. */
  path: string;
  table: SlkTable;
  /**
   * The metadata's column that says a field belongs to the kind, for a file
   * two kinds share: `UnitMetaData.slk`'s `useItem` for items, and any of
   * `useUnit`, `useHero` and `useBuilding` for units.
   */
  use?: readonly string[];
}

export interface FieldTableResult {
  table: FieldTable;
  /** One message per field the table could not describe: errors, nothing is written. */
  errors: string[];
  /** Labels the editor strings do not hold, and `useSpecific` items that are no Rawcode. */
  warnings: string[];
}

/** The text of a label: a `WESTRING_` key resolved through the editor strings, or a literal. */
type Resolve = (text: string) => string | undefined;

/**
 * Builds the field table from each kind's metadata and the editor strings.
 *
 * Per row of a kind's metadata:
 * - the value type from its `type` (`INT_TYPES`, `real`, `unreal`, `STRING_TYPES`);
 * - the file from `netsafe`: a field safe to differ between clients goes to
 *   the Skin file (any value but `0`), the others, and those of a metadata
 *   without the column, to the base file;
 * - localizable when its type is a text (`TEXT_TYPES`) and the metadata
 *   marks it as a string the editor externalizes (`stringExt` `1`): `unam`
 *   and `utip`, not `umdl` nor `uabi`;
 * - levels from `repeat` above 0, the data column from `data`;
 * - its specific base Rawcodes from `useSpecific`;
 * - its label from `displayName`;
 * - its metadata type, and its category from `categoryOf`: a type
 *   `METADATA_CATEGORIES` does not map takes its value type's, with a
 *   warning;
 * - the raw values of an enumeration it reads, from the editor data
 *   (`enumerate`), integers for a field stored as `int`.
 *
 * Then `FIELD_OVERRIDES` apply.
 */
export function buildFieldTable(
  metaData: readonly KindMetaData[],
  resolve: Resolve,
  build: string,
  gameVersion: string,
  enumerate?: Enumerate,
): FieldTableResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const enumerations: Record<string, EnumerationValues> = {};
  /** The fields of each type no category maps, for one warning per type. */
  const unmapped = new Map<string, { type: ValueType; fields: string[] }>();
  const kinds = {} as Record<ObjectKind, string>;
  for (const kind of FIELD_KINDS) {
    const label = resolve(KIND_LABEL_KEYS[kind]);
    if (label === undefined) {
      errors.push(
        `The editor strings hold no ${KIND_LABEL_KEYS[kind]}, the label of the ${KIND_CONSTANTS[kind].entry} in the editor's comments.`,
      );
    }
    kinds[kind] = label ?? "";
  }
  const fields = Object.fromEntries(
    FIELD_KINDS.map((kind) => [kind, {}]),
  ) as Record<ObjectKind, Record<string, FieldEntry>>;
  for (const { kind, path, table, use } of metaData) {
    for (const row of table.rows) {
      const id = row.get("ID");
      if (id === undefined) continue;
      if (use !== undefined && !use.some((column) => row.get(column) === "1")) {
        continue;
      }
      const at = `${path}: the ${kind} field ${id}`;
      const metaType = row.get("type");
      const type = valueType(metaType);
      if (type === undefined) {
        errors.push(
          `${at} is of type ${JSON.stringify(metaType)}, which the generator does not know: add it to INT_TYPES or STRING_TYPES in src/fields.ts.`,
        );
        continue;
      }
      const field = row.get("field");
      if (field === undefined || field === "") {
        errors.push(`${at} has no field name.`);
        continue;
      }
      if (Object.hasOwn(fields[kind], id)) {
        errors.push(`${at} has two rows.`);
        continue;
      }
      const netsafe = row.get("netsafe");
      const data = row.get("data");
      const displayName = row.get("displayName");
      const label =
        displayName === undefined || displayName === ""
          ? undefined
          : resolve(displayName);
      if (
        displayName !== undefined &&
        displayName !== "" &&
        label === undefined
      ) {
        warnings.push(
          `${at} is labelled ${displayName}, which the editor strings do not hold: it has no label.`,
        );
      }
      const specific = (row.get("useSpecific") ?? "")
        .split(",")
        .map((rawcode) => rawcode.trim())
        .filter((rawcode) => rawcode !== "");
      for (const item of specific.filter((item) => !RAWCODE.test(item))) {
        warnings.push(
          `${at} is specific to ${JSON.stringify(item)}, not a Rawcode: the table keeps it as the metadata writes it.`,
        );
      }
      const metaTypeName = metaType ?? "";
      const category = categoryOf(metaTypeName, type);
      if (!category.mapped) {
        const entry = unmapped.get(metaTypeName) ?? { type, fields: [] };
        entry.fields.push(`${kind} ${id}`);
        unmapped.set(metaTypeName, entry);
      }
      if (
        category.enumerated === true &&
        !Object.hasOwn(enumerations, metaTypeName)
      ) {
        const values = enumerationValues(
          at,
          metaTypeName,
          type,
          enumerate?.(metaTypeName),
        );
        if (typeof values === "string") {
          errors.push(values);
          continue;
        }
        enumerations[metaTypeName] = values;
      }
      fields[kind][id] = {
        type,
        metaType: metaTypeName,
        category: category.category,
        ...(category.of !== undefined && { of: category.of }),
        file: netsafe === undefined || Number(netsafe) === 0 ? "base" : "skin",
        localizable:
          TEXT_TYPES.has(metaType ?? "") && row.get("stringExt") === "1",
        levels: Number(row.get("repeat") ?? "0") > 0,
        ...(data !== undefined && { data: Number(data) }),
        field,
        ...(label !== undefined && { label }),
        ...(specific.length > 0 && { specific }),
      };
    }
  }
  for (const override of FIELD_OVERRIDES) {
    const entry = fields[override.kind][override.id] as FieldEntry | undefined;
    if (entry === undefined) {
      errors.push(
        `The override of the ${override.kind} field ${override.id} (src/fields.ts) names a field the metadata does not have.`,
      );
      continue;
    }
    if (override.file !== undefined) entry.file = override.file;
    if (override.localizable !== undefined) {
      entry.localizable = override.localizable;
    }
  }
  for (const [metaType, { type, fields: named }] of unmapped) {
    warnings.push(
      `The metadata type ${JSON.stringify(metaType)} (${list(named)}) has no category in METADATA_CATEGORIES (src/fields.ts): its fields take their value type's, ${valueTypeCategory(type)}.`,
    );
  }
  return {
    table: {
      format: FIELDS_FORMAT,
      build,
      gameVersion,
      kinds,
      enumerations: Object.fromEntries(
        Object.keys(enumerations)
          .sort(byCodePoint)
          .map((type) => [type, enumerations[type]]),
      ),
      fields,
    },
    errors,
    warnings,
  };
}

/**
 * The raw values of the enumeration `metaType`, as the editor data gives
 * them (`raw`), integers for a field stored as `int`; else the error.
 */
function enumerationValues(
  at: string,
  metaType: string,
  type: ValueType,
  raw: string[] | undefined,
): EnumerationValues | string {
  if (raw === undefined) {
    return `${at} is of type ${metaType}, an enumeration, and the editor data (${EDITOR_DATA}) has no values of it.`;
  }
  if (type !== "int") return raw;
  const wrong = raw.filter((value) => !/^-?\d+$/.test(value));
  return wrong.length > 0
    ? `${at} is of type ${metaType}, an enumeration stored as int, and the editor data gives it ${wrong.map((value) => JSON.stringify(value)).join(", ")}, not integers.`
    : raw.map(Number);
}

function valueType(type: string | undefined): ValueType | undefined {
  if (type === undefined) return undefined;
  if (INT_TYPES.has(type)) return "int";
  if (type === "real" || type === "unreal") return type;
  if (STRING_TYPES.has(type)) return "string";
  return undefined;
}

/** A resolver of labels through the editor strings' section `section`. */
export function labelResolver(strings: Profile, section: string): Resolve {
  return (text) =>
    text.startsWith("WESTRING_") ? strings.get(section, text) : text;
}

/** The field table's path in the package: `3.0.0/fields.json`. */
export const fieldsPath = (gameVersion: string): string =>
  `${gameVersion}/fields.json`;

/**
 * The field table's text: one kind, enumeration or field per line, the
 * enumerations by type and the fields by id in code-point order. A table of
 * format 1 is written as format 1: no enumerations, metadata types or
 * categories.
 */
export function serializeFields(table: FieldTable): string {
  const format2 = table.format !== 1;
  const kinds = FIELD_KINDS.map(
    (kind) =>
      `    ${JSON.stringify(kind)}: ${JSON.stringify(table.kinds[kind])}`,
  ).join(",\n");
  const byType = table.enumerations ?? {};
  const enumerations = Object.keys(byType)
    .sort(byCodePoint)
    .map(
      (type) => `    ${JSON.stringify(type)}: ${JSON.stringify(byType[type])}`,
    )
    .join(",\n");
  const fields = FIELD_KINDS.map((kind) => {
    const byId = table.fields[kind];
    const lines = Object.keys(byId)
      .sort(byCodePoint)
      .map((id) => {
        const entry = byId[id];
        const ordered: FieldEntry = {
          type: entry.type,
          ...(format2 && {
            metaType: entry.metaType,
            category: entry.category,
            ...(entry.of !== undefined && { of: entry.of }),
          }),
          file: entry.file,
          localizable: entry.localizable,
          levels: entry.levels,
          ...(entry.data !== undefined && { data: entry.data }),
          field: entry.field,
          ...(entry.label !== undefined && { label: entry.label }),
          ...(entry.specific !== undefined && { specific: entry.specific }),
        };
        return `      ${JSON.stringify(id)}: ${JSON.stringify(ordered)}`;
      })
      .join(",\n");
    return `    ${JSON.stringify(kind)}: ${lines === "" ? "{}" : `{\n${lines}\n    }`}`;
  }).join(",\n");
  return (
    `{\n` +
    `  "format": ${String(table.format)},\n` +
    `  "build": ${JSON.stringify(table.build)},\n` +
    `  "gameVersion": ${JSON.stringify(table.gameVersion)},\n` +
    `  "kinds": {\n${kinds}\n  },\n` +
    (format2
      ? `  "enumerations": ${enumerations === "" ? "{}" : `{\n${enumerations}\n  }`},\n`
      : "") +
    `  "fields": {\n${fields}\n  }\n` +
    `}\n`
  );
}

const VALUE_TYPES: ReadonlySet<unknown> = new Set([
  "int",
  "real",
  "unreal",
  "string",
]);
const FIELD_FILES: ReadonlySet<unknown> = new Set(["base", "skin"]);
/**
 * A field id: four characters, as Object data stores it (`unam`, `Hbz1`),
 * or three, as the abilities' `Crs` of 3.0.0, which a file pads with a NUL.
 */
const FIELD_ID = /^[\x21-\x7e]{3,4}$/;

/**
 * The shape of a field table, as one problem per line: `format` (1 or 2),
 * its Build and Game version (those of the index beside it), every kind's
 * label, and each field's facts. In format 2, also each field's metadata
 * type and its category, which must be the one `categoryOf` gives, and the
 * enumerations, which must be those the fields read.
 */
export function validateFields(
  value: unknown,
  gameVersion: string,
  build: string | undefined,
): string[] {
  if (!isRecord(value)) return ["not a JSON object."];
  const problems: string[] = [];
  if (!READ_FIELDS_FORMATS.includes(value.format as number)) {
    problems.push(
      `format is ${JSON.stringify(value.format)}, not ${READ_FIELDS_FORMATS.join(" or ")}.`,
    );
  }
  const format2 = value.format === 2;
  /** The enumerations' raw values by type, in format 2, and the types a field reads. */
  const enumerations = new Map<string, unknown[]>();
  const read = new Set<string>();
  if (format2) {
    if (!isRecord(value.enumerations)) {
      problems.push("enumerations is not the raw values per metadata type.");
    } else {
      for (const [type, values] of Object.entries(value.enumerations)) {
        if (
          !Array.isArray(values) ||
          values.length === 0 ||
          !(
            values.every((item) => typeof item === "string") ||
            values.every((item) => Number.isInteger(item))
          )
        ) {
          problems.push(
            `enumerations.${type} is ${JSON.stringify(values)}, not a list of raw values, all strings or all integers.`,
          );
        } else {
          enumerations.set(type, values);
        }
      }
    }
  }
  if (value.gameVersion !== gameVersion) {
    problems.push(
      `gameVersion is ${JSON.stringify(value.gameVersion)}, not ${gameVersion}, its folder.`,
    );
  }
  if (build !== undefined && value.build !== build) {
    problems.push(
      `build is ${JSON.stringify(value.build)}, not ${build}, the index's.`,
    );
  }
  if (!isRecord(value.kinds) || !sameKeys(value.kinds)) {
    problems.push(
      `kinds is not a label per Object kind (${FIELD_KINDS.join(", ")}).`,
    );
  } else {
    for (const kind of FIELD_KINDS) {
      const label = value.kinds[kind];
      if (typeof label !== "string" || label === "") {
        problems.push(
          `kinds.${kind} is ${JSON.stringify(label)}, not a label.`,
        );
      }
    }
  }
  if (!isRecord(value.fields) || !sameKeys(value.fields)) {
    problems.push(
      `fields is not the fields per Object kind (${FIELD_KINDS.join(", ")}).`,
    );
    return problems;
  }
  for (const kind of FIELD_KINDS) {
    const byId = value.fields[kind];
    if (!isRecord(byId)) {
      problems.push(`fields.${kind} is not an object.`);
      continue;
    }
    for (const [id, entry] of Object.entries(byId)) {
      const at = `fields.${kind}.${id}`;
      if (!FIELD_ID.test(id)) {
        problems.push(`${at}: not a field id of four characters.`);
      }
      if (!isRecord(entry)) {
        problems.push(`${at}: not an object.`);
        continue;
      }
      if (!VALUE_TYPES.has(entry.type)) {
        problems.push(
          `${at}.type is ${JSON.stringify(entry.type)}, not a value type.`,
        );
      }
      if (!FIELD_FILES.has(entry.file)) {
        problems.push(
          `${at}.file is ${JSON.stringify(entry.file)}, not base or skin.`,
        );
      }
      for (const flag of ["localizable", "levels"] as const) {
        if (typeof entry[flag] !== "boolean") {
          problems.push(
            `${at}.${flag} is ${JSON.stringify(entry[flag])}, not a boolean.`,
          );
        }
      }
      if (entry.localizable === true && entry.type !== "string") {
        problems.push(`${at} is localizable but not a string.`);
      }
      if (
        entry.data !== undefined &&
        (typeof entry.data !== "number" ||
          !Number.isInteger(entry.data) ||
          entry.data < 0)
      ) {
        problems.push(
          `${at}.data is ${JSON.stringify(entry.data)}, not a data column.`,
        );
      }
      if (typeof entry.field !== "string" || entry.field === "") {
        problems.push(
          `${at}.field is ${JSON.stringify(entry.field)}, not a field name.`,
        );
      }
      if (
        entry.label !== undefined &&
        (typeof entry.label !== "string" || entry.label === "")
      ) {
        problems.push(
          `${at}.label is ${JSON.stringify(entry.label)}, not a label.`,
        );
      }
      if (
        entry.specific !== undefined &&
        (!Array.isArray(entry.specific) ||
          entry.specific.length === 0 ||
          !(entry.specific as unknown[]).every(
            (item) => typeof item === "string" && SPECIFIC_ITEM.test(item),
          ))
      ) {
        problems.push(
          `${at}.specific is ${JSON.stringify(entry.specific)}, not a list of the metadata's useSpecific items.`,
        );
      }
      if (format2) {
        problems.push(
          ...validateCategory(at, entry, enumerations, (type) =>
            read.add(type),
          ),
        );
      }
    }
  }
  for (const type of enumerations.keys()) {
    if (!read.has(type)) {
      problems.push(`enumerations.${type}: no field reads it.`);
    }
  }
  return problems;
}

/**
 * The metadata type and category of a field of format 2: the category
 * `categoryOf` gives its metadata type and value type, its kind for a
 * Rawcode, and the enumeration it reads, integers when it is stored as
 * `int`. `reads` is told each enumeration the field reads.
 */
function validateCategory(
  at: string,
  entry: Record<string, unknown>,
  enumerations: ReadonlyMap<string, unknown[]>,
  reads: (type: string) => void,
): string[] {
  const { metaType, category, of, type } = entry;
  if (typeof metaType !== "string" || metaType === "") {
    return [
      `${at}.metaType is ${JSON.stringify(metaType)}, not a metadata type.`,
    ];
  }
  if (!CATEGORIES.includes(category as Category)) {
    return [`${at}.category is ${JSON.stringify(category)}, not a category.`];
  }
  if (!VALUE_TYPES.has(type)) return [];
  const expected = categoryOf(metaType, type as ValueType);
  if (category !== expected.category || of !== expected.of) {
    const named = (c: unknown, kind: unknown) =>
      JSON.stringify(c) +
      (typeof kind === "string"
        ? ` of ${kind}`
        : kind === undefined
          ? ""
          : ` of ${JSON.stringify(kind)}`);
    return [
      `${at} is ${named(category, of)}, not ${named(expected.category, expected.of)}, the category src/fields.ts gives its metadata type ${metaType}.`,
    ];
  }
  if (expected.enumerated !== true) return [];
  reads(metaType);
  const values = enumerations.get(metaType);
  if (values === undefined) {
    return [
      `${at} reads the enumeration ${metaType}, which enumerations lacks.`,
    ];
  }
  return (type === "int") === values.every((item) => typeof item === "number")
    ? []
    : [
        `${at} is stored as ${String(type)}, and the enumeration ${metaType}'s raw values are not ${type === "int" ? "integers" : "strings"}.`,
      ];
}

/**
 * The metadata types of a table of format 2 that `METADATA_CATEGORIES` does
 * not map, in code-point order, each with the fields of that type
 * (`doodad dcat`), the kinds in the table's order.
 */
export function unmappedTypes(
  table: FieldTable,
): { metaType: string; fields: string[] }[] {
  const byType = new Map<string, string[]>();
  for (const kind of FIELD_KINDS) {
    for (const id of Object.keys(table.fields[kind]).sort(byCodePoint)) {
      const { metaType } = table.fields[kind][id];
      if (
        metaType === undefined ||
        Object.hasOwn(METADATA_CATEGORIES, metaType)
      ) {
        continue;
      }
      byType.set(metaType, [...(byType.get(metaType) ?? []), `${kind} ${id}`]);
    }
  }
  return [...byType.keys()]
    .sort(byCodePoint)
    .map((metaType) => ({ metaType, fields: byType.get(metaType) ?? [] }));
}

/** Whether an object is keyed by the Object kinds, each once. */
function sameKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === FIELD_KINDS.length &&
    FIELD_KINDS.every((kind) => Object.hasOwn(value, kind))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
