/**
 * Seam 1: from the CASC storage of an install to the files of the model,
 * the JSON index and the provenance file of the install's Game version, and
 * the artefacts emitted from the index (`./emit.ts`).
 *
 * For now it reads the units of the Default Game data set: the base layer's
 * unit data (Rawcode and race) and the enUS names from
 * `_Locales/enUS.w3mod:`, located through the kind's metadata. Nothing is
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
import { emit } from "./emit.js";
import { constantName, displayName } from "./names.js";
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

/** Where a kind's objects, races and names are, inside a layer. */
interface KindSource {
  kind: ObjectKind;
  /** The data file, in the base layer. */
  data: string;
  /** The data file's column of the Rawcode. */
  idColumn: string;
  /** The data file's column of the race, for a kind that has one. */
  raceColumn?: string;
  /** The metadata file, in the base layer, that locates the name. */
  metaData: string;
  /** The metadata's ID of the field the Object Editor shows as the name. */
  nameField: string;
  /** The profile files of the names, in the enUS layer, matched without regard to case. */
  strings: RegExp;
  /** `strings` as a glob, for the messages. */
  stringsGlob: string;
}

/** The kinds read, in this order. */
const KINDS: readonly KindSource[] = [
  {
    kind: "unit",
    data: "Units/UnitData.slk",
    idColumn: "unitID",
    raceColumn: "race",
    metaData: "Units/UnitMetaData.slk",
    nameField: "unam",
    strings: /^units\/[a-z]*unitstrings\.txt$/i,
    stringsGlob: "Units/*UnitStrings.txt",
  },
];

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
      `The install at ${options.installDir} is on Build ${storage.build} (${join(options.installDir, BUILD_INFO_FILE)}), not on ${options.build}, the Patch of reforged-types (its reforged.patch): the Built-in objects and the Typings would come from different Builds.`,
    );
  }
  try {
    return await extract(storage);
  } catch (error) {
    if (error instanceof CascError) return fail(error.message);
    throw error;
  }
}

async function extract(storage: CascStorage): Promise<GenerateResult> {
  const diagnostics: Diagnostic[] = [];
  const inputs: ProvenanceInput[] = [];
  const read = async (path: string): Promise<string> => {
    const file = await storage.read(path);
    inputs.push({
      path: file.path,
      contentKey: file.contentKey,
      sha256: createHash("sha256").update(file.bytes).digest("hex"),
      size: file.bytes.byteLength,
    });
    return new TextDecoder().decode(file.bytes);
  };

  const objects: Record<string, IndexEntry> = {};
  const kindOf = new Map<string, ObjectKind>();
  const counts: Partial<Record<ObjectKind, number>> = {};
  for (const source of KINDS) {
    const field = await nameField(source, read);
    const profile = new Profile();
    const seen = new Set<string>();
    const stringFiles = nameFileOrder(
      storage.paths().filter((path) => {
        const lower = path.toLowerCase();
        if (
          !lower.startsWith(ENUS_LAYER.toLowerCase()) ||
          !source.strings.test(path.slice(ENUS_LAYER.length)) ||
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
        `The root lists no names file ${ENUS_LAYER}${source.stringsGlob}: every ${source.kind} would be unnamed.`,
      );
    }
    for (const path of stringFiles) profile.add(await read(path), path);

    const data = parseSlk(await read(BASE_LAYER + source.data));
    if (!data.columns.includes(source.idColumn)) {
      throw new CascError(
        `${BASE_LAYER}${source.data} has no column ${source.idColumn}.`,
      );
    }
    const rawcodes = new Set<string>();
    for (const row of data.rows) {
      const rawcode = row.get(source.idColumn) ?? "";
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
              : `${rawcode} is both a ${other} and a ${source.kind}: an overload has one kind.`,
        });
        continue;
      }
      kindOf.set(rawcode, source.kind);
      rawcodes.add(rawcode);
      const text = profile.get(rawcode, field);
      const name = text === undefined ? "" : displayName(text);
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
    counts[source.kind] = rawcodes.size;
    for (const override of profile.overrides) {
      if (
        !rawcodes.has(override.section) ||
        override.key.toLowerCase() !== field.toLowerCase()
      ) {
        continue;
      }
      diagnostics.push({
        severity: "warning",
        message: `The ${source.kind} ${override.section} is named ${JSON.stringify(override.previous)}, then ${JSON.stringify(override.value)} in ${override.file}: the last name wins.`,
      });
    }
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

/**
 * The order the names files are read in, the later one's name winning
 * (`Profile`): the code-point order of their root paths, so
 * `CampaignUnitStrings.txt` comes before `HumanUnitStrings.txt`.
 *
 * Unverified: the game's own load order of these files, and whether a later
 * value or the first one wins, are assumed here, not settled by a Probe. In
 * 3.0.0.24268 no unit is named differently by two files, so the order does
 * not reach the committed index; one unit is named twice within one file
 * (`Ubtr`, "Noble" then "Death Knight" in `CampaignUnitStrings.txt`), and
 * its name rests on the last-wins rule. Every name set twice is reported as
 * a warning, the cue to settle the rule in game with a Probe.
 */
export function nameFileOrder(paths: readonly string[]): string[] {
  return [...paths].sort(byCodePoint);
}

/**
 * The profile key of the kind's name: the `field` of the metadata row whose
 * ID is the kind's name field, which must live in a profile file.
 */
async function nameField(
  source: KindSource,
  read: (path: string) => Promise<string>,
): Promise<string> {
  const path = BASE_LAYER + source.metaData;
  const meta = parseSlk(await read(path));
  const row = meta.rows.find((r) => r.get("ID") === source.nameField);
  const field = row?.get("field");
  if (row === undefined || field === undefined || field === "") {
    throw new CascError(`${path} has no row ${source.nameField} with a field.`);
  }
  if (row.get("slk") !== "Profile") {
    throw new CascError(
      `${path}: the field ${source.nameField} is in ${JSON.stringify(row.get("slk") ?? "")}, not in the profile files the names are read from.`,
    );
  }
  return field;
}
