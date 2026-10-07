/**
 * The check of the committed artefacts, without the game: for each Game
 * version folder of the package, its index is validated and written again,
 * every artefact is emitted again from it and compared byte for byte with
 * the committed file, and its provenance file must exist. The package's
 * `exports` must name each Game version's overloads and send each kind's
 * entry point to the newest Game version.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  artefactPaths,
  emitArtefacts,
  KIND_ARTEFACTS,
  PACKAGE_NAME,
} from "./emit.js";
import {
  byCodePoint,
  gameVersionOf,
  INDEX_FORMAT,
  serializeIndex,
  type BuiltinsIndex,
} from "./model.js";

/** A Game version folder's name. */
const GAME_VERSION = /^\d+\.\d+\.\d+$/;
/** A Build: the Game version and its build number. */
const BUILD = /^\d+\.\d+\.\d+\.\d+$/;
const RAWCODE = /^[A-Za-z0-9]{4}$/;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface CheckResult {
  /** The Game versions checked, oldest first. */
  gameVersions: string[];
  /** The number of files compared. */
  files: number;
  /** One line per problem, in a stable order; empty when the check passes. */
  problems: string[];
}

/** Checks the committed artefacts under `packageRoot`. */
export async function checkArtefacts(
  packageRoot: string,
): Promise<CheckResult> {
  const problems: string[] = [];
  const entries = await readdir(packageRoot, { withFileTypes: true });
  const gameVersions = await gameVersionsIn(packageRoot);
  if (gameVersions.length === 0) {
    problems.push(`${packageRoot} holds no Game version folder.`);
  }

  let files = 0;
  const kindsOf = new Map<string, Set<string>>();
  for (const gameVersion of gameVersions) {
    const indexPath = artefactPaths.index(gameVersion);
    const text = await readText(join(packageRoot, ...indexPath.split("/")));
    if (text === undefined) {
      problems.push(`${indexPath}: missing`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      problems.push(`${indexPath}: not JSON (${(error as Error).message})`);
      continue;
    }
    const shape = validateIndex(parsed, gameVersion);
    if (shape.length > 0) {
      problems.push(...shape.map((problem) => `${indexPath}: ${problem}`));
      continue;
    }
    const index = parsed as BuiltinsIndex;
    files++;
    if (serializeIndex(index) !== text) {
      problems.push(`${indexPath}: not written as the generator writes it`);
    }
    problems.push(...(await checkProvenance(packageRoot, index)));

    const emitted = emitArtefacts(index);
    kindsOf.set(
      gameVersion,
      new Set(
        KIND_ARTEFACTS.filter((kind) =>
          emitted.has(artefactPaths.lua(gameVersion, kind)),
        ).map((kind) => kind.entry),
      ),
    );
    for (const [path, expected] of emitted) {
      files++;
      const committed = await readText(join(packageRoot, ...path.split("/")));
      if (committed === undefined) {
        problems.push(`${path}: emitted but not committed`);
      } else if (committed !== expected) {
        problems.push(
          `${path}: differs from the file emitted from ${indexPath}`,
        );
      }
    }
    const known = new Set([
      ...emitted.keys(),
      indexPath,
      artefactPaths.provenance(gameVersion),
    ]);
    for (const item of await readdir(join(packageRoot, gameVersion))) {
      const path = `${gameVersion}/${item}`;
      if (!known.has(path)) problems.push(`${path}: committed but not emitted`);
    }
  }
  for (const entry of entries) {
    const match = /^(\d+\.\d+\.\d+)\.d\.ts$/.exec(entry.name);
    if (entry.isFile() && match !== null && !kindsOf.has(match[1])) {
      problems.push(`${entry.name}: committed but not emitted`);
    }
  }
  problems.push(...(await checkExports(packageRoot, gameVersions, kindsOf)));
  return { gameVersions, files, problems };
}

/**
 * Writes the artefacts each valid committed index emits, under
 * `packageRoot`; returns their paths. An invalid index is left to the check.
 */
export async function writeArtefacts(packageRoot: string): Promise<string[]> {
  const written: string[] = [];
  for (const gameVersion of await gameVersionsIn(packageRoot)) {
    const text = await readText(
      join(packageRoot, ...artefactPaths.index(gameVersion).split("/")),
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text ?? "");
    } catch {
      continue;
    }
    if (validateIndex(parsed, gameVersion).length > 0) continue;
    for (const [path, emitted] of emitArtefacts(parsed as BuiltinsIndex)) {
      await writeFile(join(packageRoot, ...path.split("/")), emitted);
      written.push(path);
    }
  }
  return written;
}

/** The Game version folders under `packageRoot`, oldest first. */
async function gameVersionsIn(packageRoot: string): Promise<string[]> {
  return (await readdir(packageRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && GAME_VERSION.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareVersions);
}

/** The provenance file of `index`'s Game version: present, and of its Build. */
async function checkProvenance(
  packageRoot: string,
  index: BuiltinsIndex,
): Promise<string[]> {
  const path = artefactPaths.provenance(index.gameVersion);
  const text = await readText(join(packageRoot, ...path.split("/")));
  if (text === undefined) {
    return [
      `${path}: missing; every Game version keeps the provenance of its index`,
    ];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return [`${path}: not JSON (${(error as Error).message})`];
  }
  const provenance = parsed as { build?: unknown; inputs?: unknown };
  if (provenance.build !== index.build) {
    return [
      `${path}: its build ${JSON.stringify(provenance.build)} is not the index's, ${index.build}`,
    ];
  }
  if (!Array.isArray(provenance.inputs) || provenance.inputs.length === 0) {
    return [`${path}: lists no input`];
  }
  return [];
}

/**
 * The package's `exports`: each Game version's overloads and index, and each
 * kind's entry point to the newest Game version's declarations and Lua (the
 * `tstl` condition, typescript-to-lua's resolver).
 */
async function checkExports(
  packageRoot: string,
  gameVersions: readonly string[],
  kindsOf: ReadonlyMap<string, ReadonlySet<string>>,
): Promise<string[]> {
  const manifestText = await readText(join(packageRoot, "package.json"));
  if (manifestText === undefined) return ["package.json: missing"];
  const exports = (JSON.parse(manifestText) as { exports?: unknown }).exports;
  const actual = JSON.stringify(exports ?? null);
  const expected: Record<string, unknown> = {};
  for (const gameVersion of gameVersions) {
    if (!kindsOf.has(gameVersion)) continue;
    expected[`./${gameVersion}`] = {
      types: `./${artefactPaths.overloads(gameVersion)}`,
    };
    expected[`./${artefactPaths.index(gameVersion)}`] =
      `./${artefactPaths.index(gameVersion)}`;
  }
  const newest = gameVersions.at(-1);
  const newestKinds = newest === undefined ? undefined : kindsOf.get(newest);
  if (newest !== undefined && newestKinds !== undefined) {
    for (const kind of KIND_ARTEFACTS) {
      if (!newestKinds.has(kind.entry)) continue;
      expected[`./${kind.entry}`] = {
        types: `./${artefactPaths.declarations(newest, kind)}`,
        // typescript-to-lua's resolver appends `.lua` to the target itself.
        tstl: `./${artefactPaths.lua(newest, kind).slice(0, -".lua".length)}`,
      };
    }
  }
  expected["./package.json"] = "./package.json";
  const wanted = JSON.stringify(expected);
  return actual === wanted
    ? []
    : [
        `package.json: its exports are ${actual}, not ${wanted}: the overloads and index of each Game version, and the kind entry points of ${PACKAGE_NAME} on the newest one`,
      ];
}

/**
 * The problems of an index's shape, as read from `gameVersion`'s folder;
 * none when it is a well-formed index of that Game version.
 */
export function validateIndex(value: unknown, gameVersion: string): string[] {
  const problems: string[] = [];
  if (!isRecord(value)) return ["not an object"];
  extraKeys(
    value,
    ["format", "build", "gameVersion", "gameDataSets", "objects"],
    "the index",
    problems,
  );
  if (value.format !== INDEX_FORMAT) {
    problems.push(
      `format ${JSON.stringify(value.format)} is not ${String(INDEX_FORMAT)}`,
    );
  }
  if (typeof value.build !== "string" || !BUILD.test(value.build)) {
    problems.push(`build ${JSON.stringify(value.build)} is not a Build`);
  } else if (gameVersionOf(value.build) !== gameVersion) {
    problems.push(`build ${value.build} is not of Game version ${gameVersion}`);
  }
  if (value.gameVersion !== gameVersion) {
    problems.push(
      `gameVersion ${JSON.stringify(value.gameVersion)} is not its folder's, ${gameVersion}`,
    );
  }

  const setIds = new Set<string>();
  if (!Array.isArray(value.gameDataSets) || value.gameDataSets.length === 0) {
    problems.push("gameDataSets is not a non-empty array");
  } else {
    for (const set of value.gameDataSets as unknown[]) {
      if (
        !isRecord(set) ||
        typeof set.id !== "string" ||
        set.id === "" ||
        typeof set.label !== "string" ||
        set.label === ""
      ) {
        problems.push(
          `gameDataSets: ${JSON.stringify(set)} is not {id, label}`,
        );
        continue;
      }
      extraKeys(set, ["id", "label"], `the Game data set ${set.id}`, problems);
      if (setIds.has(set.id)) problems.push(`gameDataSets: ${set.id} twice`);
      setIds.add(set.id);
    }
  }

  if (!isRecord(value.objects)) {
    problems.push("objects is not an object");
    return problems;
  }
  const kinds: readonly string[] = KIND_ARTEFACTS.map((kind) => kind.kind);
  for (const [rawcode, entry] of Object.entries(value.objects)) {
    const where = `objects.${rawcode}`;
    if (!RAWCODE.test(rawcode)) {
      problems.push(
        `${where}: not a Rawcode of four characters of [A-Za-z0-9]`,
      );
    }
    if (!isRecord(entry)) {
      problems.push(`${where}: not an object`);
      continue;
    }
    extraKeys(
      entry,
      ["kind", "name", "race", "sets", "constant"],
      where,
      problems,
    );
    if (typeof entry.kind !== "string" || !kinds.includes(entry.kind)) {
      problems.push(
        `${where}: kind ${JSON.stringify(entry.kind)} is not an Object kind`,
      );
    }
    for (const field of ["name", "race"]) {
      const text = entry[field];
      if (text !== undefined && (typeof text !== "string" || text === "")) {
        problems.push(`${where}: ${field} is not a non-empty string`);
      }
    }
    if (
      !Array.isArray(entry.sets) ||
      entry.sets.length === 0 ||
      !entry.sets.every((id) => typeof id === "string" && setIds.has(id)) ||
      new Set(entry.sets).size !== entry.sets.length
    ) {
      problems.push(
        `${where}: sets ${JSON.stringify(entry.sets)} are not ids of gameDataSets, each once`,
      );
    }
    // Ending in its Rawcode, a constant's name is unique.
    const constant = entry.constant;
    if (
      typeof constant !== "string" ||
      !IDENTIFIER.test(constant) ||
      !constant.endsWith(`_${rawcode}`)
    ) {
      problems.push(
        `${where}: constant ${JSON.stringify(constant)} is not an identifier ending in _${rawcode}`,
      );
    }
  }
  return problems;
}

function extraKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
  problems: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) problems.push(`${where}: unknown key ${key}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Game versions by their numbers, oldest first. */
function compareVersions(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return byCodePoint(a, b);
}

async function readText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}
