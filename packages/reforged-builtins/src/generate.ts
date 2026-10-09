/**
 * Seam 1: from the CASC storage of an install to the files of the model,
 * the JSON index and the provenance file of the install's Game version, and
 * the artefacts emitted from the index (`./emit.ts`).
 *
 * It reads the seven Object kinds of the Default Game data set: each kind's
 * base-layer data (Rawcode and race) and its enUS names, located through the
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
import { emit, KIND_CONSTANTS } from "./emit.js";
import { constantName, displayName, duplicateConstants } from "./names.js";
import { Profile } from "./profile.js";
import { parseSlk } from "./slk.js";

/** The base layer: the Default Game data set's object data. */
export const BASE_LAYER = "War3.w3mod:";
/** The enUS locale layer, which holds the names. */
export const ENUS_LAYER = "War3.w3mod:_Locales/enUS.w3mod:";

/** The Game data sets the index lists, by stable id. */
export const GAME_DATA_SETS: readonly GameDataSet[] = [
  { id: "default", label: "Default" },
];

/**
 * The editor strings the data's `WESTRING_` names resolve through, keys
 * matched without regard to case: the destructables' and doodads' names are
 * mostly in the second file.
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
    data: "Units/UnitData.slk",
    table: "UnitData",
    idColumn: "unitID",
    raceColumn: "race",
    metaData: "Units/UnitMetaData.slk",
    nameFields: ["unam"],
    strings: {
      pattern: /^units\/[a-z]*unitstrings\.txt$/i,
      glob: "Units/*UnitStrings.txt",
    },
  },
  {
    kind: "item",
    data: "Units/ItemData.slk",
    table: "ItemData",
    idColumn: "itemID",
    metaData: "Units/UnitMetaData.slk",
    nameFields: ["unam"],
    strings: {
      pattern: /^units\/itemstrings\.txt$/i,
      glob: "Units/ItemStrings.txt",
    },
  },
  {
    kind: "ability",
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
      editorStrings = new Profile();
      for (const path of EDITOR_STRINGS) {
        editorStrings.add(await read(path), path);
      }
    }
    return editorStrings;
  };

  const objects: Record<string, IndexEntry> = {};
  const kindOf = new Map<string, ObjectKind>();
  const counts: Partial<Record<ObjectKind, number>> = {};
  for (const source of KINDS) {
    const fields: NameField[] = [];
    for (const id of source.nameFields) {
      fields.push(await nameField(source, id, read));
    }
    const profile = await namesProfile(storage, source, fields, read);

    const data = parseSlk(await read(BASE_LAYER + source.data));
    if (!data.columns.includes(source.idColumn)) {
      throw new CascError(
        `${BASE_LAYER}${source.data} has no column ${source.idColumn}.`,
      );
    }
    const rawcodes = new Set<string>();
    /** The profile field that gave each object its name. */
    const namedBy = new Map<string, NameField>();
    let keyless = 0;
    for (const row of data.rows) {
      const rawcode = row.get(source.idColumn);
      if (rawcode === undefined) {
        keyless++;
        continue;
      }
      if (!RAWCODE.test(rawcode)) {
        diagnostics.push({
          severity: "error",
          message: `${BASE_LAYER}${source.data}: the ${source.kind} ${JSON.stringify(rawcode)} is not a Rawcode of four characters of [A-Za-z0-9].`,
        });
        continue;
      }
      const other = kindOf.get(rawcode);
      if (other !== undefined) {
        diagnostics.push({
          severity: "error",
          message:
            other === source.kind
              ? `${BASE_LAYER}${source.data}: the ${source.kind} ${rawcode} has two rows.`
              : `${rawcode} is both ${article(other)} and ${article(source.kind)}: an overload has one kind.`,
        });
        continue;
      }
      kindOf.set(rawcode, source.kind);
      rawcodes.add(rawcode);

      let name = "";
      for (const field of fields) {
        let text = field.inProfile
          ? field.perLevel
            ? profile.first(rawcode, field.field)
            : profile.get(rawcode, field.field)
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
          if (field.inProfile) namedBy.set(rawcode, field);
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
        sets: GAME_DATA_SETS.map((set) => set.id),
        constant,
      };
    }
    if (keyless > 0) {
      diagnostics.push({
        severity: "warning",
        message:
          keyless === 1
            ? `${BASE_LAYER}${source.data}: 1 row has no ${source.idColumn}, the Rawcode's column: it is no ${source.kind} and is skipped.`
            : `${BASE_LAYER}${source.data}: ${String(keyless)} rows have no ${source.idColumn}, the Rawcode's column: they are no ${KIND_CONSTANTS[source.kind].entry} and are skipped.`,
      });
    }
    counts[source.kind] = rawcodes.size;
    for (const override of profile.overrides) {
      const field = namedBy.get(override.section);
      if (field?.field.toLowerCase() !== override.key.toLowerCase()) continue;
      const [previous, value] = field.perLevel
        ? [override.previousFirst, override.valueFirst]
        : [override.previous, override.value];
      if (previous === value) continue;
      diagnostics.push({
        severity: "warning",
        message: `The ${source.kind} ${override.section} is named ${JSON.stringify(previous)}, then ${JSON.stringify(value)} in ${override.file}: the last name wins.`,
      });
    }
  }
  for (const message of duplicateConstants(objects)) {
    diagnostics.push({ severity: "error", message });
  }

  if (diagnostics.some((d) => d.severity === "error")) {
    return { ok: false, diagnostics };
  }
  const gameVersion = gameVersionOf(storage.build);
  const index: BuiltinsIndex = {
    format: INDEX_FORMAT,
    build: storage.build,
    gameVersion,
    gameDataSets: [...GAME_DATA_SETS],
    objects,
  };
  return {
    ok: true,
    build: storage.build,
    gameVersion,
    files: new Map([
      [`${gameVersion}/index.json`, serializeIndex(index)],
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

/** `a unit`, `an ability`. */
function article(kind: ObjectKind): string {
  return `${/^[aeiou]/.test(kind) ? "an" : "a"} ${kind}`;
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
 * The order the names files are read in, the later one's name winning
 * (`Profile`): the code-point order of their root paths, so
 * `CampaignUnitStrings.txt` comes before `HumanUnitStrings.txt`.
 *
 * Unverified: the game's own load order of these files, and whether a later
 * value or the first one wins, are assumed here, not settled in the World
 * Editor. In 3.0.0.24268 they decide 14 names: `Ubtr`'s, named twice within
 * `CampaignUnitStrings.txt` ("Noble" then "Death Knight"), and 13 abilities'
 * and buffs' that `ItemAbilityStrings.txt` names again (`Almf`, "Death Coil"
 * before it, "Item Lesser Mark of the Forsaken" in it). Every name set twice
 * is reported as a warning, the cue to settle the rule (#564).
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
