/**
 * Seam 1: from the CASC storage of an install to the files of the model,
 * the JSON index, the field table (`./fields.ts`) and the provenance file of
 * the install's Game version, and the artefacts emitted from the index
 * (`./emit.ts`).
 *
 * It reads the seven Object kinds of every Game data set: each kind's data
 * (Rawcode and race) from the set's layer when it has the kind's file, else
 * from the base layer's, and its enUS names, located through the
 * kind's metadata, in the profile files of `_Locales/enUS.w3mod:` or in the
 * data itself as a `WESTRING_` key of the editor strings. Nothing is
 * written here: the caller writes the files of a successful result.
 */
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  BUILD_INFO_FILE,
  CascError,
  openStorage,
  type CascStorage,
} from "./casc/storage.js";
import {
  byCodePoint,
  gameVersionOf,
  INDEX_FORMAT,
  serializeIndex,
  serializeProvenance,
  type BuiltinsIndex,
  type GameDataSet,
  type IndexEntry,
  type ObjectKind,
  type ProvenanceInput,
} from "./model.js";
import { emit, KIND_CONSTANTS, withArticle } from "./emit.js";
import {
  buildFieldTable,
  fieldsPath,
  labelResolver,
  serializeFields,
  type KindMetaData,
} from "./fields.js";
import GAME_DATA_VERSIONS from "./game-data-versions.json" with { type: "json" };
import { constantName, displayName, duplicateConstants } from "./names.js";
import { Profile } from "./profile.js";
import { parseSlk } from "./slk.js";

/** The column of the Game Data Version an object came with, in the data of the versioned kinds. */
const VERSION_COLUMN = "version";

/** The version of a row whose cell is no number: below every set's, so every set holds it. */
const NO_VERSION = -1;

/** A row's Game Data Version: 0 without a cell, `NO_VERSION` for a cell that is no number. */
function versionOf(row: ReadonlyMap<string, string>): number {
  const version = Number(row.get(VERSION_COLUMN) ?? 0);
  return Number.isNaN(version) ? NO_VERSION : version;
}

/** The base layer: the object data of the sets of Forsaken Kingdom. */
export const BASE_LAYER = "War3.w3mod:";
/** The enUS locale layer, which holds the names. */
export const ENUS_LAYER = "War3.w3mod:_Locales/enUS.w3mod:";

/** A Game data set and the layer its object data comes from. */
interface LayeredGameDataSet extends GameDataSet {
  /**
   * The layer whose file of a kind replaces the base layer's, when it has
   * one: `_Balance/<Set>_V<version>`, which the install has for Custom of
   * Reign of Chaos and The Frozen Throne and Melee of Reign of Chaos only.
   */
  layer: string;
  /**
   * The Game Data Version: an object whose `version` cell is greater, one
   * of a later expansion, is not in the set.
   */
  version: number;
  /**
   * The qualifier of its own values in the profile files, which no layer
   * replaces: `Name:custom,V1=` names an object in the Custom set of The
   * Frozen Throne, over `Name=`. The sets of Forsaken Kingdom have none:
   * the profile files hold no `V2` value. Melee of The Frozen Throne keeps
   * `melee,V1`, which they hold, though it reads the base layer.
   */
  qualifier?: string;
}

/** A map's Game Data Sets, as the World Editor of 3.0 offers them, but Default. */
const SETS = [
  { id: "custom", label: "Custom", layer: "Custom" },
  { id: "melee", label: "Melee", layer: "Melee" },
] as const;

/**
 * The Game Data Versions, by the value of the `version` cells, latest first.
 * `game-data-versions.json` lists them by that value, the index a map's
 * `war3map.w3i` stores: the workspace's one list of them, which the Probe
 * runner reads too (#620).
 */
const VERSIONS = GAME_DATA_VERSIONS.toSorted((a, b) => b.version - a.version);

/**
 * The Game data sets the index lists: one per Game Data Set and Game Data
 * Version of a map, latest version first, as Probe runs on 3.0.0.24268
 * settled them (#575, docs/research/builtins-layers.md). A map reads the
 * layer `_Balance/<Set>_V<version>` where the install has it, else the
 * base layer, and leaves out the units, items and abilities of a later
 * version: all the sets of Forsaken Kingdom read the base layer whole. A
 * map's Default set reads Custom, or Melee on a melee map, so it has no set
 * of its own.
 */
export const GAME_DATA_SETS: readonly LayeredGameDataSet[] = VERSIONS.flatMap(
  (version) =>
    SETS.map((set) => ({
      id: `${set.id}-${version.id}`,
      label: `${set.label} (${version.label})`,
      layer: `${BASE_LAYER}_Balance/${set.layer}_V${String(version.version)}.w3mod:`,
      version: version.version,
      ...(version !== VERSIONS[0] && {
        qualifier: `${set.id},V${String(version.version)}`,
      }),
    })),
);

/**
 * The editor strings the data's `WESTRING_` names resolve through, keys
 * matched without regard to case: the destructables' and doodads' names are
 * mostly in the second file. A key both files set keeps the second's value
 * (`WESTRING_DOOD_YOIG` is "Iron Gate", then "Iron Gate (A)"): the World
 * Editor reads these files, not the game, so the Probe that settled the
 * names files' rule (#564) cannot settle this one.
 */
export const EDITOR_STRINGS: readonly string[] = [
  `${ENUS_LAYER}UI/WorldEditGameStrings.txt`,
  `${ENUS_LAYER}UI/WorldEditStrings.txt`,
];
/** The section of the editor strings that holds the keys. */
const WORLD_EDIT_SECTION = "WorldEditStrings";

/** Where a kind's objects, races and names are, inside a layer. */
interface KindSource {
  kind: ObjectKind;
  /** The data file, in the base layer. */
  data: string;
  /** The data file's table, as the metadata's `slk` column names it. */
  table: string;
  /** The data file's column of the Rawcode. */
  idColumn: string;
  /** The data file's column of the race, for a kind that has one. */
  raceColumn?: string;
  /**
   * Whether a set leaves out an object of a later Game Data Version than its
   * own, by the data's `version` column: units, items and abilities, as the
   * Probe runs of #575 measured. A map of Reign of Chaos still creates a
   * destructable of The Frozen Throne and gives a unit its buffs, and a map
   * of The Frozen Throne a buff of Forsaken Kingdom (#622), so every set
   * holds them as its layer lists them. So it holds upgrades, of which no
   * layer has one of a later version than its sets', and doodads, which no
   * Native creates.
   */
  versioned?: boolean;
  /** The metadata file, in the base layer, that locates the name. */
  metaData: string;
  /**
   * The metadata's IDs of the fields the Object Editor shows as the name,
   * the first that holds a value winning: a buff without an editor name
   * shows its tooltip's title.
   */
  nameFields: readonly string[];
  /** The profile files of the names, in the enUS layer, for a kind with a name in them. */
  strings?: NamesFiles;
  /**
   * The metadata's columns of which one says a field is the kind's, for the
   * metadata units and items share (`KindMetaData` in `./fields.ts`).
   */
  fieldUse?: readonly string[];
}

/** A kind's names files, matched without regard to case. */
interface NamesFiles {
  /** Their paths inside the enUS layer. */
  pattern: RegExp;
  /** `pattern` as a glob, for the messages. */
  glob: string;
}

/** The names files of abilities and buffs, which share them. */
const ABILITY_STRINGS: NamesFiles = {
  pattern: /^units\/[a-z]*abilitystrings\.txt$/i,
  glob: "Units/*AbilityStrings.txt",
};

/** The kinds read, in this order. */
const KINDS: readonly KindSource[] = [
  {
    kind: "unit",
    versioned: true,
    data: "Units/UnitData.slk",
    table: "UnitData",
    idColumn: "unitID",
    raceColumn: "race",
    metaData: "Units/UnitMetaData.slk",
    nameFields: ["unam"],
    fieldUse: ["useUnit", "useHero", "useBuilding"],
    strings: {
      pattern: /^units\/[a-z]*unitstrings\.txt$/i,
      glob: "Units/*UnitStrings.txt",
    },
  },
  {
    kind: "item",
    versioned: true,
    data: "Units/ItemData.slk",
    table: "ItemData",
    idColumn: "itemID",
    metaData: "Units/UnitMetaData.slk",
    nameFields: ["unam"],
    fieldUse: ["useItem"],
    strings: {
      pattern: /^units\/itemstrings\.txt$/i,
      glob: "Units/ItemStrings.txt",
    },
  },
  {
    kind: "ability",
    versioned: true,
    data: "Units/AbilityData.slk",
    table: "AbilityData",
    idColumn: "alias",
    raceColumn: "race",
    metaData: "Units/AbilityMetaData.slk",
    nameFields: ["anam"],
    strings: ABILITY_STRINGS,
  },
  {
    kind: "buff",
    data: "Units/AbilityBuffData.slk",
    table: "AbilityBuffData",
    idColumn: "alias",
    raceColumn: "race",
    metaData: "Units/AbilityBuffMetaData.slk",
    nameFields: ["fnam", "ftip"],
    strings: ABILITY_STRINGS,
  },
  {
    kind: "destructable",
    data: "Units/DestructableData.slk",
    table: "DestructableData",
    idColumn: "DestructableID",
    metaData: "Units/DestructableMetaData.slk",
    nameFields: ["bnam"],
  },
  {
    kind: "doodad",
    data: "Doodads/Doodads.slk",
    table: "DoodadData",
    idColumn: "doodID",
    metaData: "Doodads/DoodadMetaData.slk",
    nameFields: ["dnam"],
  },
  {
    kind: "upgrade",
    data: "Units/UpgradeData.slk",
    table: "UpgradeData",
    idColumn: "upgradeid",
    raceColumn: "race",
    metaData: "Units/UpgradeMetaData.slk",
    nameFields: ["gnam"],
    strings: {
      pattern: /^units\/[a-z]*upgradestrings\.txt$/i,
      glob: "Units/*UpgradeStrings.txt",
    },
  },
];

/** A name field, located through the metadata. */
interface NameField {
  /** Its metadata ID: `unam`. */
  id: string;
  /** Its key in the profile files, or its column in the data. */
  field: string;
  /** Whether the profile files hold it, rather than the data. */
  inProfile: boolean;
  /** Whether it holds one value per level, the first level's being the name. */
  perLevel: boolean;
}

/** A Rawcode a Built-in object may have: four characters of `[A-Za-z0-9]`. */
const RAWCODE = /^[A-Za-z0-9]{4}$/;

export interface Diagnostic {
  severity: "error" | "warning";
  message: string;
}

export interface GenerateOptions {
  /** The install folder, which holds `.build.info`. */
  installDir: string;
  /** The Build the install must be on: `reforged-types`' `reforged.patch`. */
  build: string;
}

export interface GenerateSuccess {
  ok: true;
  build: string;
  gameVersion: string;
  /** The model the files hold. */
  index: BuiltinsIndex;
  /** Each file's text by its `/`-separated path under the package root. */
  files: Map<string, string>;
  /** The number of objects per kind. */
  counts: Partial<Record<ObjectKind, number>>;
  /** Warnings only. */
  diagnostics: Diagnostic[];
}

export interface GenerateFailure {
  ok: false;
  diagnostics: Diagnostic[];
}

export type GenerateResult = GenerateSuccess | GenerateFailure;

/** Reads the install's storage and returns the index and provenance files. */
export async function generate(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const fail = (message: string): GenerateFailure => ({
    ok: false,
    diagnostics: [{ severity: "error", message }],
  });
  let storage: CascStorage;
  try {
    storage = await openStorage(options.installDir);
  } catch (error) {
    if (error instanceof CascError) return fail(error.message);
    throw error;
  }
  if (storage.build !== options.build) {
    return fail(
      `The install at ${options.installDir} is on Build ${storage.build} (its build config, ${storage.buildConfigFile}), not on ${options.build}, the Patch of reforged-types (its reforged.patch): the Built-in objects and the Typings would come from different Builds.`,
    );
  }
  let result: GenerateResult;
  try {
    result = await extract(storage);
  } catch (error) {
    if (!(error instanceof CascError)) throw error;
    result = fail(error.message);
  }
  if (storage.buildInfoVersion !== storage.build) {
    result.diagnostics.unshift({
      severity: "warning",
      message: `${join(options.installDir, BUILD_INFO_FILE)} gives Version ${storage.buildInfoVersion}, and its build config ${storage.buildConfigFile} names ${storage.build}, the Build of the content read.`,
    });
  }
  return result;
}

async function extract(storage: CascStorage): Promise<GenerateResult> {
  const diagnostics: Diagnostic[] = [];
  const inputs: ProvenanceInput[] = [];
  const texts = new Map<string, Promise<string>>();
  /** Reads a file once, however many kinds read it, and records its provenance. */
  const read = (path: string): Promise<string> => {
    let text = texts.get(path);
    if (text === undefined) {
      text = storage.read(path).then((file) => {
        inputs.push({
          path: file.path,
          contentKey: file.contentKey,
          sha256: createHash("sha256").update(file.bytes).digest("hex"),
          size: file.bytes.byteLength,
        });
        return new TextDecoder().decode(file.bytes);
      });
      texts.set(path, text);
    }
    return text;
  };
  let editorStrings: Profile | undefined;
  const worldEditStrings = async (): Promise<Profile> => {
    if (editorStrings === undefined) {
      editorStrings = new Profile("last");
      for (const path of EDITOR_STRINGS) {
        editorStrings.add(await read(path), path);
      }
    }
    return editorStrings;
  };

  const listed = new Set(storage.paths().map((path) => path.toLowerCase()));
  const objects: Record<string, IndexEntry> = {};
  const kindOf = new Map<string, ObjectKind>();
  const counts: Partial<Record<ObjectKind, number>> = {};
  for (const source of KINDS) {
    const fields: NameField[] = [];
    for (const id of source.nameFields) {
      fields.push(await nameField(source, id, read));
    }
    const profile = await namesProfile(storage, source, fields, read);

    // Each set's file of the kind: its layer's when the layer has one, else
    // the base layer's. Each file is checked once, however many sets read it.
    const rowsByFile = new Map<
      string,
      Map<string, ReadonlyMap<string, string>>
    >();
    const setFiles = GAME_DATA_SETS.map((set) =>
      listed.has((set.layer + source.data).toLowerCase())
        ? set.layer + source.data
        : BASE_LAYER + source.data,
    );
    for (const path of new Set(setFiles)) {
      rowsByFile.set(path, await kindRows(source, path, read, diagnostics));
    }
    /** Each object's row, from the first set that holds it, and its sets. */
    const held = new Map<
      string,
      { row: ReadonlyMap<string, string>; sets: string[] }
    >();
    GAME_DATA_SETS.forEach((set, i) => {
      for (const [rawcode, row] of rowsByFile.get(setFiles[i]) ?? []) {
        if (source.versioned === true && versionOf(row) > set.version) continue;
        const entry = held.get(rawcode);
        if (entry === undefined) held.set(rawcode, { row, sets: [set.id] });
        else entry.sets.push(set.id);
      }
    });

    const rawcodes = new Set<string>();
    /** The profile field that gave each object its name, by lower-cased Rawcode. */
    const namedBy = new Map<string, NameField>();
    for (const [rawcode, { row, sets }] of held) {
      const other = kindOf.get(rawcode);
      if (other !== undefined) {
        diagnostics.push({
          severity: "error",
          message: `${rawcode} is both ${withArticle(other)} and ${withArticle(source.kind)}: an overload has one kind.`,
        });
        continue;
      }
      kindOf.set(rawcode, source.kind);
      rawcodes.add(rawcode);

      // The name of the first set that holds the object: its own value in
      // the profile files, else the one every set shares.
      const qualifier = GAME_DATA_SETS.find(
        (set) => set.id === sets[0],
      )?.qualifier;
      const keys = (field: NameField) =>
        qualifier === undefined
          ? [field.field]
          : [`${field.field}:${qualifier}`, field.field];
      let name = "";
      for (const field of fields) {
        let text = field.inProfile
          ? keys(field)
              .map((key) =>
                field.perLevel
                  ? profile.first(rawcode, key)
                  : profile.get(rawcode, key),
              )
              .find((value) => value !== undefined)
          : row.get(field.field);
        if (text?.startsWith("WESTRING_")) {
          const key = text;
          text = (await worldEditStrings()).get(WORLD_EDIT_SECTION, key);
          if (text === undefined) {
            diagnostics.push({
              severity: "warning",
              message: `The ${source.kind} ${rawcode} is named ${key}, which neither ${EDITOR_STRINGS[0]} nor ${EDITOR_STRINGS[1]} holds.`,
            });
          }
        }
        name = text === undefined ? "" : displayName(text);
        if (name !== "") {
          if (field.inProfile) namedBy.set(rawcode.toLowerCase(), field);
          break;
        }
      }
      const race =
        source.raceColumn === undefined
          ? undefined
          : row.get(source.raceColumn)?.toLowerCase();
      const constant = constantName(name, rawcode);
      if (name === "") {
        diagnostics.push({
          severity: "warning",
          message: `The ${source.kind} ${rawcode} has no enUS name; its constant is ${constant}.`,
        });
      }
      objects[rawcode] = {
        kind: source.kind,
        ...(name !== "" && { name }),
        ...(race !== undefined && race !== "" && { race }),
        sets,
        constant,
      };
    }
    counts[source.kind] = rawcodes.size;
    for (const override of profile.overrides) {
      const field = namedBy.get(override.section.toLowerCase());
      if (field?.field.toLowerCase() !== override.key.toLowerCase()) continue;
      const [previous, value] = field.perLevel
        ? [override.previousFirst, override.valueFirst]
        : [override.previous, override.value];
      if (previous === value) continue;
      diagnostics.push({
        severity: "warning",
        message: `The ${source.kind} ${override.section} is named ${JSON.stringify(previous)}, then ${JSON.stringify(value)} in ${override.file}: the first name wins.`,
      });
    }
  }
  for (const message of duplicateConstants(objects)) {
    diagnostics.push({ severity: "error", message });
  }

  const gameVersion = gameVersionOf(storage.build);
  const metaData: KindMetaData[] = [];
  for (const source of KINDS) {
    const path = BASE_LAYER + source.metaData;
    metaData.push({
      kind: source.kind,
      path,
      table: parseSlk(await read(path)),
      ...(source.fieldUse !== undefined && { use: source.fieldUse }),
    });
  }
  const fieldTable = buildFieldTable(
    metaData,
    labelResolver(await worldEditStrings(), WORLD_EDIT_SECTION),
    storage.build,
    gameVersion,
  );
  for (const message of fieldTable.errors) {
    diagnostics.push({ severity: "error", message });
  }
  for (const message of fieldTable.warnings) {
    diagnostics.push({ severity: "warning", message });
  }

  if (diagnostics.some((d) => d.severity === "error")) {
    return { ok: false, diagnostics };
  }
  const index: BuiltinsIndex = {
    format: INDEX_FORMAT,
    build: storage.build,
    gameVersion,
    gameDataSets: GAME_DATA_SETS.map(({ id, label }) => ({ id, label })),
    objects,
  };
  return {
    ok: true,
    build: storage.build,
    gameVersion,
    index,
    files: new Map([
      [`${gameVersion}/index.json`, serializeIndex(index)],
      [fieldsPath(gameVersion), serializeFields(fieldTable.table)],
      [
        `${gameVersion}/provenance.json`,
        serializeProvenance({
          build: storage.build,
          buildConfig: storage.buildConfigKey,
          inputs,
        }),
      ],
      ...emit(index),
    ]),
    counts,
    diagnostics,
  };
}

/**
 * The rows of a kind's data file by Rawcode. A Rawcode not of four
 * `[A-Za-z0-9]` characters, or with two rows, is an error and left out; rows
 * with no Rawcode cell are fragments of the table, skipped with a warning.
 */
async function kindRows(
  source: KindSource,
  path: string,
  read: (path: string) => Promise<string>,
  diagnostics: Diagnostic[],
): Promise<Map<string, ReadonlyMap<string, string>>> {
  const data = parseSlk(await read(path));
  if (!data.columns.includes(source.idColumn)) {
    throw new CascError(`${path} has no column ${source.idColumn}.`);
  }
  const rows = new Map<string, ReadonlyMap<string, string>>();
  let keyless = 0;
  for (const row of data.rows) {
    const rawcode = row.get(source.idColumn);
    if (rawcode === undefined) {
      keyless++;
    } else if (!RAWCODE.test(rawcode)) {
      diagnostics.push({
        severity: "error",
        message: `${path}: the ${source.kind} ${JSON.stringify(rawcode)} is not a Rawcode of four characters of [A-Za-z0-9].`,
      });
    } else if (rows.has(rawcode)) {
      diagnostics.push({
        severity: "error",
        message: `${path}: the ${source.kind} ${rawcode} has two rows.`,
      });
    } else {
      rows.set(rawcode, row);
      if (source.versioned === true && versionOf(row) === NO_VERSION) {
        diagnostics.push({
          severity: "warning",
          message: `${path}: the ${source.kind} ${rawcode}'s version is ${JSON.stringify(row.get(VERSION_COLUMN))}, not a number: every set holds it.`,
        });
      }
    }
  }
  if (keyless > 0) {
    diagnostics.push({
      severity: "warning",
      message:
        keyless === 1
          ? `${path}: 1 row has no ${source.idColumn}, the Rawcode's column: it is no ${source.kind} and is skipped.`
          : `${path}: ${String(keyless)} rows have no ${source.idColumn}, the Rawcode's column: they are no ${KIND_CONSTANTS[source.kind].entry} and are skipped.`,
    });
  }
  return rows;
}

/**
 * The profile of a kind's names: its names files of the enUS layer, read in
 * `nameFileOrder`. Empty for a kind whose names are all in its data.
 */
async function namesProfile(
  storage: CascStorage,
  source: KindSource,
  fields: readonly NameField[],
  read: (path: string) => Promise<string>,
): Promise<Profile> {
  const profile = new Profile();
  if (!fields.some((field) => field.inProfile)) return profile;
  if (source.strings === undefined) {
    throw new Error(
      `The ${source.kind}s have a name in the profile files and no names files.`,
    );
  }
  const { pattern, glob } = source.strings;
  const seen = new Set<string>();
  const stringFiles = nameFileOrder(
    storage.paths().filter((path) => {
      const lower = path.toLowerCase();
      if (
        !lower.startsWith(ENUS_LAYER.toLowerCase()) ||
        !pattern.test(path.slice(ENUS_LAYER.length)) ||
        seen.has(lower)
      ) {
        return false;
      }
      seen.add(lower);
      return true;
    }),
  );
  if (stringFiles.length === 0) {
    throw new CascError(
      `The root lists no names file ${ENUS_LAYER}${glob}: every ${source.kind} would be unnamed.`,
    );
  }
  for (const path of stringFiles) profile.add(await read(path), path);
  return profile;
}

/**
 * The order the names files are read in, the first one's name winning
 * (`Profile`): the code-point order of their root paths, so
 * `CampaignUnitStrings.txt` comes before `HumanUnitStrings.txt`.
 *
 * Settled in game by the Probe `builtins-names` on 3.0.0.24268 (run
 * 1d12b599-e41f-482d-a4eb-e24ce230d9c9, `docs/research/builtins-names.md`,
 * #564): of 14 names set twice, the game gives the first. `Ubtr` is
 * "Noble", the first of two names in `CampaignUnitStrings.txt`, and `Almf`
 * is "Death Coil", from `CampaignAbilityStrings.txt`, not "Item Lesser Mark
 * of the Forsaken", from `ItemAbilityStrings.txt`, which comes after it. The
 * run saw only that pair of files disagree, so the order of other pairs is
 * the same rule, not measured. Every name set twice is still reported as a
 * warning, for the record of a new Patch.
 */
export function nameFileOrder(paths: readonly string[]): string[] {
  return [...paths].sort(byCodePoint);
}

/**
 * The name field `id` of a kind, located through its metadata row: its
 * `field`, in the profile files or in the kind's own data, and whether it
 * holds one value per level (`repeat` above 0).
 */
async function nameField(
  source: KindSource,
  id: string,
  read: (path: string) => Promise<string>,
): Promise<NameField> {
  const path = BASE_LAYER + source.metaData;
  const meta = parseSlk(await read(path));
  const row = meta.rows.find((r) => r.get("ID") === id);
  const field = row?.get("field");
  if (row === undefined || field === undefined || field === "") {
    throw new CascError(`${path} has no row ${id} with a field.`);
  }
  const slk = row.get("slk") ?? "";
  if (slk !== "Profile" && slk !== source.table) {
    throw new CascError(
      `${path}: the field ${id} is in ${JSON.stringify(slk)}, neither in the profile files nor in ${source.table}, where the names are read from.`,
    );
  }
  return {
    id,
    field,
    inProfile: slk === "Profile",
    perLevel: Number(row.get("repeat") ?? "0") > 0,
  };
}
