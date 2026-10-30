/**
 * The game data model of a Game data set, read from the install for the
 * Studio: each Object kind's fields, with their metadata, their enUS labels
 * (`UI/WorldEditStrings.txt`, `UI/WorldEditGameStrings.txt`) and the raw
 * values and labels of the enumerations they read (`UI/UnitEditorData.txt`);
 * each Built-in object the set holds, with its base values and the World
 * Editor's group, from the kinds' SLK tables and the profile files under
 * the layers the set reads (`./layers.ts`).
 *
 * It is what the Studio shows, not what it writes: `reforged-builtins`'
 * field table stays the source of where a field goes and of its value
 * type, which the writer of `reforged-map` reads. Nothing is written to
 * disk.
 */
import type { CascStorage } from "./casc/storage.js";
import { KIND_FILES, OBJECT_KINDS, type ObjectKind } from "./kinds.js";
import {
  BASE_LAYER,
  EDITOR_STRINGS,
  ENUS_LAYER,
  GAME_DATA_SETS,
  layeredPath,
  versionOf,
  WORLD_EDIT_SECTION,
  type LayeredGameDataSet,
} from "./layers.js";
import { Profile } from "./profile.js";
import { parseSlk } from "./slk.js";

/** The rows of a table, each by its first cell. */
type Rows = ReadonlyMap<string, ReadonlyMap<string, string>>;

/** The World Editor's data of the enumerations, in the base layer. */
export const EDITOR_DATA = "UI/UnitEditorData.txt";

/**
 * The key of each kind's label in the editor strings: its tab in the
 * Object Editor.
 */
const KIND_LABEL_KEYS: Readonly<Record<ObjectKind, string>> = {
  unit: "WESTRING_OBJTAB_UNITS",
  item: "WESTRING_OBJTAB_ITEMS",
  ability: "WESTRING_OBJTAB_ABILITIES",
  buff: "WESTRING_OBJTAB_BUFFS",
  destructable: "WESTRING_OBJTAB_DESTRUCTABLES",
  doodad: "WESTRING_OBJTAB_DOODADS",
  upgrade: "WESTRING_OBJTAB_UPGRADES",
};

/** One raw value of an enumeration, as the editor data lists it. */
export interface EnumerationValue {
  /** The raw value a field holds: `normal`. */
  value: string;
  /** Its enUS label: `Normal`. Absent when the editor strings give none. */
  label?: string;
}

/** One field of an Object kind, as its `*MetaData.slk` row describes it. */
export interface GameField {
  /** Its id, the metadata's `ID`: `uhpm`. */
  id: string;
  /** Its `field`: the column of its table, or the key of the profile files. */
  field: string;
  /** Its `slk`: the table that holds it, or `Profile` for the profile files. */
  table: string;
  /** Its `index`: the item of a list it is, -1 for the whole value. */
  index: number;
  /** Its `repeat`: the levels it has a value per, 0 for one value. */
  repeat: number;
  /** Its `data`: the data column of an ability's field (1 for `DataA`), 0 for none. */
  data: number;
  /**
   * Its `appendIndex`: a field of the profile files whose key of a later
   * level has the level appended (`Requires`, `Requires1`, `Requires2`).
   */
  appendIndex: boolean;
  /** Its metadata type: `int`, `attackType`, `model`. */
  type: string;
  /** Its metadata category, the Object Editor's group of fields: `stats`. */
  category: string;
  /** Its enUS label: `Stats - Hit Points Maximum (Base)`. Absent when the editor strings give none. */
  label?: string;
  /** Its `sort`, the order the Object Editor lists it in; empty without one. */
  sort: string;
  /** The base Rawcodes it is specific to (`useSpecific`), as the metadata writes them. */
  specific?: string[];
  /** The raw values of the enumeration its type is, when the editor data has one. */
  enumeration?: EnumerationValue[];
}

/**
 * A field's base value, as the file holds it: one value, or one per level
 * for a field of levels (its `repeat` above 0).
 */
export type FieldValue = string | readonly string[];

/** One Built-in object of a Game data set. */
export interface GameObject {
  rawcode: string;
  kind: ObjectKind;
  /**
   * Its group in the World Editor's tree, outermost first, each a raw value
   * of the data: `[race, "melee" | "campaign", "units" | "buildings" |
   * "heroes" | "special"]` for a unit, `[class]` for an item, `[race,
   * "units" | "heroes" | "items"]` for an ability, `[race, "buffs" |
   * "effects"]` for a buff, `[category]` for a destructable or a doodad,
   * `[race]` for an upgrade.
   */
  group: readonly string[];
  /**
   * Its base values by field id, for each field that has one: a field
   * specific to other objects has none.
   */
  values: ReadonlyMap<string, FieldValue>;
}

/** One Object kind of the model. */
export interface GameKind {
  kind: ObjectKind;
  /** Its tab's label in the Object Editor: `Units`. Absent when the editor strings give none. */
  label?: string;
  /** Its fields by id, in the metadata's order. */
  fields: ReadonlyMap<string, GameField>;
  /** The Built-in objects of the set, by Rawcode, in the order of the kind's data. */
  objects: ReadonlyMap<string, GameObject>;
}

/** The game data model of one Game data set. */
export interface GameData {
  /** The Build of the storage read. */
  build: string;
  /** The Game data set read. */
  gameDataSet: LayeredGameDataSet;
  /** Each kind, by kind. */
  kinds: Readonly<Record<ObjectKind, GameKind>>;
  /**
   * The text `value` shows: a `WESTRING_` key resolved through the editor
   * strings, `undefined` when they do not hold it; any other value as it is.
   */
  text(value: string): string | undefined;
  /**
   * The raw values and labels of the enumeration `type` in the editor data
   * (`unitRace`), whether a field reads it or not: the World Editor labels
   * its tree's groups with some; `undefined` when the data has none.
   */
  enumeration(type: string): readonly EnumerationValue[] | undefined;
}

/** What to read. */
export interface GameDataOptions {
  /** The id of the Game data set, as `reforged-builtins`' index names it: `custom-tft`. */
  gameDataSet: string;
}

/**
 * Reads the game data model of a Game data set from the storage. An
 * unknown set is an `Error`; a file the storage lacks, a `CascError`.
 */
export async function readGameData(
  storage: CascStorage,
  options: GameDataOptions,
): Promise<GameData> {
  const gameDataSet = GAME_DATA_SETS.find(
    (set) => set.id === options.gameDataSet,
  );
  if (gameDataSet === undefined) {
    throw new Error(
      `${options.gameDataSet} is no Game data set; the sets are ${GAME_DATA_SETS.map((set) => set.id).join(", ")}.`,
    );
  }
  const read = reader(storage);
  const listed = new Set(storage.paths().map((path) => path.toLowerCase()));

  const editorStrings = new Profile("last");
  for (const path of EDITOR_STRINGS) {
    if (listed.has(path.toLowerCase())) {
      editorStrings.add(await read(path), path);
    }
  }
  const text = (value: string): string | undefined =>
    value.startsWith("WESTRING_")
      ? editorStrings.get(WORLD_EDIT_SECTION, value)
      : value;

  const editorData = new Profile();
  const editorDataPath = BASE_LAYER + EDITOR_DATA;
  if (listed.has(editorDataPath.toLowerCase())) {
    editorData.add(await read(editorDataPath), editorDataPath);
  }
  const enumerations = new Map<string, EnumerationValue[] | undefined>();
  const enumeration = (type: string): EnumerationValue[] | undefined => {
    if (!enumerations.has(type)) {
      enumerations.set(type, enumerationOf(editorData, type, text));
    }
    return enumerations.get(type);
  };

  const profile = await objectProfile(storage, gameDataSet, listed, read);
  /** Reads the rows of the base layer's `file` as the set does, none when the install lacks it. */
  const rowsOf = async (file: string): Promise<Rows> => {
    const path = layeredPath(gameDataSet, file, listed);
    if (!listed.has(path.toLowerCase())) return new Map();
    const table = parseSlk(await read(path));
    const id = table.columns.at(0);
    const rows = new Map<string, ReadonlyMap<string, string>>();
    for (const row of table.rows) {
      const rawcode = id === undefined ? undefined : row.get(id);
      if (rawcode !== undefined && !rows.has(rawcode)) rows.set(rawcode, row);
    }
    return rows;
  };

  const kinds = {} as Record<ObjectKind, GameKind>;
  for (const kind of OBJECT_KINDS) {
    const files = KIND_FILES[kind];
    const meta = parseSlk(await read(BASE_LAYER + files.metaData));
    const fields = new Map<string, GameField>();
    for (const row of meta.rows) {
      const id = row.get("ID");
      if (id === undefined) continue;
      if (
        files.use !== undefined &&
        !files.use.some((column) => row.get(column) === "1")
      ) {
        continue;
      }
      const type = row.get("type") ?? "";
      const displayName = row.get("displayName") ?? "";
      const label = displayName === "" ? undefined : text(displayName);
      const specific = (row.get("useSpecific") ?? "")
        .split(",")
        .map((rawcode) => rawcode.trim())
        .filter((rawcode) => rawcode !== "");
      const values = enumeration(type);
      fields.set(id, {
        id,
        field: row.get("field") ?? "",
        table: row.get("slk") ?? "",
        index: integer(row.get("index"), -1),
        repeat: integer(row.get("repeat"), 0),
        data: integer(row.get("data"), 0),
        appendIndex: row.get("appendIndex") === "1",
        type,
        category: row.get("category") ?? "",
        ...(label !== undefined && { label }),
        sort: row.get("sort") ?? "",
        ...(specific.length > 0 && { specific }),
        ...(values !== undefined && { enumeration: values }),
      });
    }

    const tables = new Map<string, { rows: Rows; columns: Set<string> }>();
    for (const [name, file] of Object.entries(files.tables)) {
      const rows = await rowsOf(file);
      const columns = new Set<string>();
      for (const row of rows.values())
        for (const key of row.keys()) columns.add(key);
      tables.set(name, { rows, columns });
    }
    const data: Rows = tables.get(files.table)?.rows ?? new Map();
    const objects = new Map<string, GameObject>();
    for (const [rawcode, row] of data) {
      if (files.versioned === true && versionOf(row) > gameDataSet.version) {
        continue;
      }
      const values = new Map<string, FieldValue>();
      for (const field of fields.values()) {
        if (field.specific !== undefined && !field.specific.includes(rawcode)) {
          continue;
        }
        const value =
          field.table === "Profile"
            ? profileValue(profile, rawcode, field, gameDataSet.qualifier)
            : tableValue(tables.get(field.table), rawcode, field);
        if (value !== undefined) values.set(field.id, value);
      }
      const cell = (table: string, column: string) =>
        tables.get(table)?.rows.get(rawcode)?.get(column) ?? "";
      objects.set(rawcode, {
        rawcode,
        kind,
        group: groupOf(
          kind,
          rawcode,
          (column) => cell(files.table, column),
          cell,
        ),
        values,
      });
    }

    const label = text(KIND_LABEL_KEYS[kind]);
    kinds[kind] = {
      kind,
      ...(label !== undefined && { label }),
      fields,
      objects,
    };
  }

  return { build: storage.build, gameDataSet, kinds, text, enumeration };
}

/**
 * The profile files of the objects, merged: every `.txt` file of `Units/`
 * and `Doodads/` in the base layer, each from the set's layer where the
 * install has it there, then those of the enUS layer, each group in the
 * code-point order of their paths. A key set twice keeps its first value,
 * the rule the Probe `builtins-names` measured for the names files (#564,
 * `docs/research/builtins-names.md`), here taken for every key.
 */
async function objectProfile(
  storage: CascStorage,
  set: LayeredGameDataSet,
  listed: ReadonlySet<string>,
  read: (path: string) => Promise<string>,
): Promise<Profile> {
  const files = (layer: string) =>
    storage
      .paths()
      .filter((path) => {
        if (!path.toLowerCase().startsWith(layer.toLowerCase())) return false;
        return /^(units|doodads)\/[^/]+\.txt$/i.test(path.slice(layer.length));
      })
      .map((path) => path.slice(layer.length))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const profile = new Profile();
  for (const file of files(BASE_LAYER)) {
    const path = layeredPath(set, file, listed);
    profile.add(await read(path), path);
  }
  for (const file of files(ENUS_LAYER)) {
    profile.add(await read(ENUS_LAYER + file), ENUS_LAYER + file);
  }
  return profile;
}

/**
 * A field's value in the profile files: the set's own (`Name:custom,V1`)
 * over the shared one (`Name`). A field of levels gives each item of its
 * list, or, with `appendIndex`, each key of a level (`Requires`,
 * `Requires1`…); a field of an `index` the item it names; else the whole
 * value.
 */
function profileValue(
  profile: Profile,
  rawcode: string,
  field: GameField,
  qualifier: string | undefined,
): FieldValue | undefined {
  const items = (key: string) =>
    (qualifier === undefined
      ? undefined
      : profile.items(rawcode, `${key}:${qualifier}`)) ??
    profile.items(rawcode, key);
  if (field.appendIndex) {
    const levels: string[] = [];
    for (let level = 0; ; level++) {
      const value = items(
        level === 0 ? field.field : field.field + String(level),
      );
      if (value === undefined) break;
      levels.push(value.join(","));
    }
    return levels.length === 0 ? undefined : levels;
  }
  const value = items(field.field);
  if (value === undefined) return undefined;
  if (field.repeat > 0) return value;
  if (field.index >= 0) return value[field.index];
  return value.join(",");
}

/**
 * A field's value in its table: the cell of its column, the `data` letter
 * appended for an ability's data field (`DataA`), and for a field of
 * levels each level's column (`Cool1`, `Cool2`…) the table has.
 */
function tableValue(
  table: { rows: Rows; columns: ReadonlySet<string> } | undefined,
  rawcode: string,
  field: GameField,
): FieldValue | undefined {
  const row = table?.rows.get(rawcode);
  if (table === undefined || row === undefined) return undefined;
  const column =
    field.field + (field.data > 0 ? String.fromCharCode(64 + field.data) : "");
  if (field.repeat === 0) return row.get(column);
  const levels: string[] = [];
  for (let level = 1; table.columns.has(column + String(level)); level++) {
    levels.push(row.get(column + String(level)) ?? "");
  }
  return levels.length === 0 ? undefined : levels;
}

/**
 * The object's group in the World Editor's tree (`GameObject.group`), from
 * the cells of its data (`data`) and of its kind's other tables (`cell`).
 * A unit whose Rawcode starts with a capital letter is a hero, as the
 * World Editor and the game tell them.
 */
function groupOf(
  kind: ObjectKind,
  rawcode: string,
  data: (column: string) => string,
  cell: (table: string, column: string) => string,
): string[] {
  const race = data("race").toLowerCase();
  switch (kind) {
    case "unit":
      return [
        race,
        cell("UnitUI", "campaign") === "1" ? "campaign" : "melee",
        cell("UnitUI", "special") === "1"
          ? "special"
          : /^[A-Z]/.test(rawcode)
            ? "heroes"
            : cell("UnitBalance", "isbldg") === "1"
              ? "buildings"
              : "units",
      ];
    case "item":
      return [data("class")];
    case "ability":
      return [
        race,
        data("hero") === "1"
          ? "heroes"
          : data("item") === "1"
            ? "items"
            : "units",
      ];
    case "buff":
      return [race, data("isEffect") === "1" ? "effects" : "buffs"];
    case "destructable":
    case "doodad":
      return [data("category")];
    case "upgrade":
      return [race];
  }
}

/** Reads a storage's file as text, once however many times it is asked for. */
function reader(storage: CascStorage): (path: string) => Promise<string> {
  const texts = new Map<string, Promise<string>>();
  return (path) => {
    let text = texts.get(path.toLowerCase());
    if (text === undefined) {
      text = storage
        .read(path)
        .then((file) => new TextDecoder().decode(file.bytes));
      texts.set(path.toLowerCase(), text);
    }
    return text;
  };
}

/**
 * The values of the enumeration `type` in the editor data: its keys `00`,
 * `01`… up to its `NumValues`, each a raw value then the `WESTRING_` key of
 * its label.
 */
function enumerationOf(
  editorData: Profile,
  type: string,
  text: (value: string) => string | undefined,
): EnumerationValue[] | undefined {
  const count = editorData.get(type, "NumValues");
  const values: EnumerationValue[] = [];
  for (let i = 0; ; i++) {
    if (count !== undefined && i >= Number(count)) break;
    const items = editorData.items(type, String(i).padStart(2, "0"));
    const value = items?.at(0);
    if (value === undefined) break;
    const key = items?.at(1);
    const label = key === undefined ? undefined : text(key);
    values.push({ value, ...(label !== undefined && { label }) });
  }
  return values.length === 0 ? undefined : values;
}

/** A metadata cell as an integer, `fallback` when it is empty or no number. */
function integer(cell: string | undefined, fallback: number): number {
  const value = Number(cell === undefined || cell === "" ? NaN : cell);
  return Number.isInteger(value) ? value : fallback;
}
