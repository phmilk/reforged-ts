/**
 * The check of the committed artefacts, without the game: each Game
 * version's index is validated, its artefacts are emitted again and compared
 * byte for byte with the committed ones, its provenance file must exist, and
 * the package's `exports` must be the ones the Game versions call for.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  constantsPath,
  emit,
  KIND_CONSTANTS,
  kindsOf,
  luaPath,
  overloadsPath,
} from "./emit.js";
import {
  byCodePoint,
  gameVersionOf,
  INDEX_FORMAT,
  serializeIndex,
  type BuiltinsIndex,
  type ObjectKind,
} from "./model.js";

/** A Game version's folder name: `3.0.0`. */
const GAME_VERSION = /^\d+\.\d+\.\d+$/;
/** A Build: `3.0.0.24268`. */
const BUILD = /^\d+\.\d+\.\d+\.\d+$/;
/** A Rawcode a Built-in object may have: four characters of `[A-Za-z0-9]`. */
const RAWCODE = /^[A-Za-z0-9]{4}$/;
/**
 * A constant's name: an identifier ending in `_` and the Rawcode. Since each
 * must end in its own Rawcode, two objects never share a constant.
 */
const CONSTANT = /^[A-Za-z_][A-Za-z0-9_]*_[A-Za-z0-9]{4}$/;

export interface CheckResult {
  /** The Game versions found, oldest first. */
  gameVersions: string[];
  /** The number of artefacts compared. */
  compared: number;
  /** One line per problem; empty when the package is in sync. */
  problems: string[];
}

/** Checks the package whose root is `root`. */
export async function checkPackage(root: string): Promise<CheckResult> {
  const problems: string[] = [];
  const gameVersions = (await readdir(root, { withFileTypes: true }))
    .filter((item) => item.isDirectory() && GAME_VERSION.test(item.name))
    .map((item) => item.name)
    .sort(compareVersions);
  if (gameVersions.length === 0) {
    problems.push(`${root} holds no Game version folder.`);
  }

  let compared = 0;
  const generated = new Set<string>();
  const kindsByVersion = new Map<string, ObjectKind[]>();
  for (const gameVersion of gameVersions) {
    const indexPath = `${gameVersion}/index.json`;
    const text = await readText(join(root, indexPath));
    if (text === undefined) {
      problems.push(`${indexPath}: missing.`);
      continue;
    }
    if (
      (await readText(join(root, gameVersion, "provenance.json"))) === undefined
    ) {
      problems.push(`${gameVersion}/provenance.json: missing.`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      problems.push(`${indexPath}: not JSON (${(error as Error).message}).`);
      continue;
    }
    const shape = validateIndex(parsed, gameVersion);
    if (shape.length > 0) {
      problems.push(...shape.map((problem) => `${indexPath}: ${problem}`));
      continue;
    }
    const index = parsed as BuiltinsIndex;
    if (serializeIndex(index) !== text) {
      problems.push(
        `${indexPath}: not written as the generator writes it (one object per line, in code-point order).`,
      );
    }
    kindsByVersion.set(gameVersion, kindsOf(index));
    for (const [path, expected] of emit(index)) {
      generated.add(path);
      compared++;
      const committed = await readText(join(root, path));
      if (committed === undefined) {
        problems.push(`${path}: emitted from ${indexPath} but not committed.`);
      } else if (committed !== expected) {
        problems.push(`${path}: differs from what ${indexPath} emits.`);
      }
    }
  }

  const unchecked = new Set(
    gameVersions.filter((gameVersion) => !kindsByVersion.has(gameVersion)),
  );
  problems.push(...(await stale(root, gameVersions, unchecked, generated)));
  problems.push(...(await checkExports(root, gameVersions, kindsByVersion)));
  return { gameVersions, compared, problems };
}

/**
 * The shape of an index, as one problem per line: `format`, the Build and
 * the Game version of its folder, the Game data sets, and each object's
 * Rawcode, kind, name, race, sets and constant.
 */
export function validateIndex(value: unknown, gameVersion: string): string[] {
  if (!isRecord(value)) return ["not a JSON object."];
  const problems: string[] = [];
  if (value.format !== INDEX_FORMAT) {
    problems.push(
      `format is ${JSON.stringify(value.format)}, not ${String(INDEX_FORMAT)}.`,
    );
  }
  if (typeof value.build !== "string" || !BUILD.test(value.build)) {
    problems.push(`build is ${JSON.stringify(value.build)}, not a Build.`);
  } else if (gameVersionOf(value.build) !== value.gameVersion) {
    problems.push(
      `gameVersion is ${JSON.stringify(value.gameVersion)}, not the Game version of the Build ${value.build}.`,
    );
  }
  if (value.gameVersion !== gameVersion) {
    problems.push(
      `gameVersion is ${JSON.stringify(value.gameVersion)}, not ${gameVersion}, its folder.`,
    );
  }

  const setIds = new Set<string>();
  if (!Array.isArray(value.gameDataSets) || value.gameDataSets.length === 0) {
    problems.push("gameDataSets is not a list of Game data sets.");
  } else {
    for (const set of value.gameDataSets as unknown[]) {
      if (
        !isRecord(set) ||
        typeof set.id !== "string" ||
        typeof set.label !== "string" ||
        setIds.has(set.id)
      ) {
        problems.push(
          `gameDataSets: ${JSON.stringify(set)} is not a Game data set of a new id and a label.`,
        );
      } else {
        setIds.add(set.id);
      }
    }
  }

  if (!isRecord(value.objects)) {
    problems.push("objects is not an object.");
    return problems;
  }
  for (const [rawcode, entry] of Object.entries(value.objects)) {
    const at = `objects.${rawcode}`;
    if (!RAWCODE.test(rawcode)) {
      problems.push(`${at}: not a Rawcode of four characters of [A-Za-z0-9].`);
    }
    if (!isRecord(entry)) {
      problems.push(`${at}: not an object.`);
      continue;
    }
    if (
      typeof entry.kind !== "string" ||
      !Object.hasOwn(KIND_CONSTANTS, entry.kind)
    ) {
      problems.push(
        `${at}.kind is ${JSON.stringify(entry.kind)}, not an Object kind.`,
      );
    }
    for (const field of ["name", "race"] as const) {
      const text = entry[field];
      if (text !== undefined && (typeof text !== "string" || text === "")) {
        problems.push(`${at}.${field} is ${JSON.stringify(text)}, not a text.`);
      }
    }
    if (
      !Array.isArray(entry.sets) ||
      entry.sets.length === 0 ||
      !(entry.sets as unknown[]).every(
        (id) => typeof id === "string" && setIds.has(id),
      )
    ) {
      problems.push(
        `${at}.sets is ${JSON.stringify(entry.sets)}, not a list of the index's Game data sets.`,
      );
    }
    const constant = entry.constant;
    if (
      typeof constant !== "string" ||
      !CONSTANT.test(constant) ||
      !constant.endsWith(`_${rawcode}`)
    ) {
      problems.push(
        `${at}.constant is ${JSON.stringify(constant)}, not an identifier ending in _${rawcode}.`,
      );
    }
  }
  return problems;
}

/**
 * The generated files committed but no longer emitted: an overloads' entry
 * at the root, or a declarations file or Lua module in a Game version's
 * folder, that no index emits. The files of an `unchecked` Game version, whose
 * index is missing or invalid, are not looked at: it emits nothing to compare.
 */
async function stale(
  root: string,
  gameVersions: readonly string[],
  unchecked: ReadonlySet<string>,
  generated: ReadonlySet<string>,
): Promise<string[]> {
  const candidates = (await readdir(root)).filter(
    (name) =>
      /^\d+\.\d+\.\d+\.d\.ts$/.test(name) &&
      !unchecked.has(name.slice(0, -".d.ts".length)),
  );
  for (const gameVersion of gameVersions) {
    if (unchecked.has(gameVersion)) continue;
    for (const name of await readdir(join(root, gameVersion))) {
      if (name.endsWith(".d.ts") || name.endsWith(".lua")) {
        candidates.push(`${gameVersion}/${name}`);
      }
    }
  }
  return candidates
    .filter((path) => !generated.has(path))
    .sort(byCodePoint)
    .map((path) => `${path}: committed but no longer emitted.`);
}

/**
 * The `exports` the Game versions call for: each one's overloads' entry and
 * index, then the kind entry points, on the newest Game version, the
 * declarations for TypeScript and the Lua module for typescript-to-lua
 * (whose resolver adds `.lua`), then `package.json`.
 */
export function expectedExports(
  kindsByVersion: ReadonlyMap<string, readonly ObjectKind[]>,
): Record<string, unknown> {
  const gameVersions = [...kindsByVersion.keys()].sort(compareVersions);
  const exports: Record<string, unknown> = {};
  for (const gameVersion of gameVersions) {
    exports[`./${gameVersion}`] = { types: `./${overloadsPath(gameVersion)}` };
    exports[`./${gameVersion}/index.json`] = `./${gameVersion}/index.json`;
  }
  const newest = gameVersions.at(-1);
  if (newest !== undefined) {
    for (const kind of kindsByVersion.get(newest) ?? []) {
      exports[`./${KIND_CONSTANTS[kind].entry}`] = {
        types: `./${constantsPath(newest, kind)}`,
        tstl: `./${luaPath(newest, kind).replace(/\.lua$/, "")}`,
      };
    }
  }
  exports["./package.json"] = "./package.json";
  return exports;
}

async function checkExports(
  root: string,
  gameVersions: readonly string[],
  kindsByVersion: ReadonlyMap<string, readonly ObjectKind[]>,
): Promise<string[]> {
  if (kindsByVersion.size !== gameVersions.length) return [];
  const manifest = JSON.parse(
    (await readText(join(root, "package.json"))) ?? "{}",
  ) as { exports?: unknown };
  const expected = expectedExports(kindsByVersion);
  return JSON.stringify(manifest.exports) === JSON.stringify(expected)
    ? []
    : [
        `package.json: exports is not what the Game versions call for: ${JSON.stringify(expected, null, 2)}`,
      ];
}

/** Game versions in numeric order: `3.0.0` before `3.0.10`. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}
