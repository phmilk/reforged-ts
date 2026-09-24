/**
 * One-off import that seeded the Overlay from war3-types-strict (MIT,
 * Copyright (c) 2021 Nikolaj Mariager, https://github.com/TinkerWorX/war3-types-strict).
 * Kept for provenance; the build type-checks it (`tsconfig.scripts.json`)
 * but neither the build nor the generator runs it. It imports only the
 * modules of `src/` that load under `--experimental-strip-types`: those
 * without a relative runtime import.
 *
 * Usage (Node 22.13 or later, from the package folder):
 *
 *   node --experimental-strip-types scripts/seed-from-war3-types-strict.ts <checkout> <commit> [patchDir] [overlayDir]
 *
 * `<checkout>` is a local clone of war3-types-strict at `<commit>` (clone it
 * with `core.autocrlf=false`); the script checks that the clone is at that
 * commit and records it in `scripts/war3-types-strict.json`. `patchDir`
 * defaults to the vendored Patch named by `reforged.patch`, `overlayDir` to
 * the package's Overlay. The Overlay was seeded from commit
 * fc3d2f5e85bd944bca038fc5f2467e6f77a6c51a, the last commit of `main`
 * (2023-02-05).
 *
 * What it does: reads the native, function and global records of the three
 * layers in the order upstream's `build.ts` reads them, a later record
 * replacing an earlier one of the same kind and name; matches each merged
 * record to the Patch declaration of the same source, kind and name; and
 * writes one Overlay entry carrying only nullability (return and parameters
 * by position, or the global's) and `origin`. Parameter names and every type
 * come from the Patch, never from the record. It never writes `since`.
 * `async: true` is set on the names of `ASYNC_NATIVES` it writes.
 *
 * Skipped and reported, with no file written: a record with no declaration in
 * the Patch, a record whose parameter count differs from the Patch, and a
 * record whose entry file already exists without `origin` (a hand-written
 * entry is never overwritten).
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SEED_ORIGIN } from "../src/entry.ts";
import {
  SOURCES,
  type Declaration,
  type FunctionDeclaration,
  type SourceName,
} from "../src/model.ts";
import { byCodePoint } from "../src/order.ts";
import { parseJass } from "../src/parser.ts";

export const UPSTREAM = "https://github.com/TinkerWorX/war3-types-strict";

/** The layer folders, in the order upstream's `build.ts` is run with. */
export const LAYERS = ["1.29.2", "1.32.10", "1.33.0"] as const;

/** Record folders read from each layer; `types` records carry no fact to seed. */
const RECORD_FOLDERS = ["natives", "functions", "globals"] as const;

/**
 * The 56 Natives jassdoc tags `@async` (commit
 * 8610958b3b77b8213f9db45ab664458650a07294), listed in the pitfall catalogue
 * (#15, section D3), whose prose list leaves out `GetUnitName`. Sorted by
 * code point.
 */
export const ASYNC_NATIVES: readonly string[] = [
  "BlzFrameGetAlpha",
  "BlzFrameGetChild",
  "BlzFrameGetChildrenCount",
  "BlzFrameGetEnable",
  "BlzFrameGetHeight",
  "BlzFrameGetParent",
  "BlzFrameGetText",
  "BlzFrameGetValue",
  "BlzFrameGetWidth",
  "BlzFrameIsVisible",
  "BlzGetAbilityActivatedExtendedTooltip",
  "BlzGetAbilityActivatedTooltip",
  "BlzGetAbilityExtendedTooltip",
  "BlzGetAbilityResearchExtendedTooltip",
  "BlzGetAbilityResearchTooltip",
  "BlzGetAbilityTooltip",
  "BlzGetItemDescription",
  "BlzGetItemExtendedTooltip",
  "BlzGetItemTooltip",
  "BlzGetLocalClientHeight",
  "BlzGetLocalClientWidth",
  "BlzGetLocalSpecialEffectX",
  "BlzGetLocalSpecialEffectY",
  "BlzGetLocalSpecialEffectZ",
  "BlzGetLocalUnitZ",
  "BlzGetLocale",
  "BlzGetMouseFocusUnit",
  "BlzGetUnitZ",
  "BlzIsLocalClientActive",
  "GetAllyColorFilterState",
  "GetCameraBoundMaxX",
  "GetCameraBoundMaxY",
  "GetCameraBoundMinX",
  "GetCameraBoundMinY",
  "GetCameraEyePositionLoc",
  "GetCameraEyePositionX",
  "GetCameraEyePositionY",
  "GetCameraEyePositionZ",
  "GetCameraField",
  "GetCameraTargetPositionLoc",
  "GetCameraTargetPositionX",
  "GetCameraTargetPositionY",
  "GetCameraTargetPositionZ",
  "GetCreepCampFilterState",
  "GetDestructableName",
  "GetItemName",
  "GetLocalPlayer",
  "GetLocalizedHotkey",
  "GetLocalizedString",
  "GetLocationZ",
  "GetObjectName",
  "GetSoundDuration",
  "GetSoundFileDuration",
  "GetSoundIsPlaying",
  "GetUnitName",
  "IsMultiboardMinimized",
];

export interface SeedInput {
  /** A local clone of war3-types-strict. */
  checkout: string;
  /** The commit the clone is at; recorded, not checked here. */
  commit: string;
  /** A vendored Patch folder holding `common.j`, `blizzard.j`, `common.ai`. */
  patchDir: string;
  /** The Overlay folder the entries are written to. */
  overlayDir: string;
  /** Natives whose entry gets `async: true`. */
  asyncNames: readonly string[];
}

export type EntryKind = "functions" | "globals";

export interface Skipped {
  kind: EntryKind;
  source: string;
  name: string;
  reason: string;
}

export interface SeedReport {
  /** The pinned commit and what was read and written, as recorded. */
  upstream: string;
  commit: string;
  layers: readonly string[];
  /** Entries written, by `<source>/<kind>`. */
  written: Record<string, number>;
  /** Records not written, sorted by source, kind and name. */
  skipped: Skipped[];
  /** Names of `asyncNames` that got no seeded entry. */
  asyncUnseeded: string[];
}

/** A native or function record's facts the seed reads. */
interface FunctionRecord {
  name: string;
  source: string;
  takes: { name: string; isNullable: boolean }[];
  isNullable: boolean;
}

/** A global record's facts the seed reads. */
interface GlobalRecord {
  name: string;
  source: string;
  isNullable: boolean;
}

interface Merged {
  kind: EntryKind;
  record: FunctionRecord | GlobalRecord;
}

export async function seed(input: SeedInput): Promise<SeedReport> {
  const records = await readLayers(input.checkout);
  const declarations = await readPatch(input.patchDir);
  const asyncNames = new Set(input.asyncNames);

  const written: Record<string, number> = {};
  const skipped: Skipped[] = [];
  const seededAsync = new Set<string>();

  for (const { kind, record } of records.values()) {
    const source = record.source;
    const declaration = declarations.get(
      declarationKey(source, kind, record.name),
    );
    const skip = (reason: string) =>
      skipped.push({ kind, source, name: record.name, reason });
    if (!declaration) {
      skip(`no declaration in ${source} of the Patch`);
      continue;
    }
    let entry: Record<string, unknown>;
    if (kind === "functions") {
      const fn = declaration as FunctionDeclaration;
      const takes = (record as FunctionRecord).takes;
      if (takes.length !== fn.params.length) {
        skip(
          `the record has ${takes.length} parameters, the Patch ${fn.params.length}`,
        );
        continue;
      }
      entry = {
        name: fn.name,
        source: fn.source,
        returns: { nullable: record.isNullable },
        params: fn.params.map((param, index) => ({
          name: param.name,
          nullable: takes[index].isNullable,
        })),
        ...(asyncNames.has(fn.name) ? { async: true } : {}),
        origin: SEED_ORIGIN,
      };
    } else {
      entry = {
        name: declaration.name,
        source: declaration.source,
        nullable: record.isNullable,
        origin: SEED_ORIGIN,
      };
    }
    const file = join(
      input.overlayDir,
      declaration.source,
      kind,
      `${declaration.name}.json`,
    );
    if (await handWritten(file)) {
      skip("a hand-written entry exists");
      continue;
    }
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(entry, null, 2) + "\n");
    const group = `${declaration.source}/${kind}`;
    written[group] = (written[group] ?? 0) + 1;
    if (entry.async === true) seededAsync.add(declaration.name);
  }

  skipped.sort(
    (a, b) =>
      byCodePoint(a.source, b.source) ||
      byCodePoint(a.kind, b.kind) ||
      byCodePoint(a.name, b.name),
  );
  return {
    upstream: UPSTREAM,
    commit: input.commit,
    layers: LAYERS,
    written: Object.fromEntries(
      Object.entries(written).sort(([a], [b]) => byCodePoint(a, b)),
    ),
    skipped,
    asyncUnseeded: [...asyncNames]
      .filter((name) => !seededAsync.has(name))
      .sort(byCodePoint),
  };
}

/**
 * The merged records by `<kind>/<name>`, as upstream's `build.ts` merges them:
 * one map per record folder, a later layer replacing the whole record. Natives
 * and functions both become `functions` entries.
 */
async function readLayers(checkout: string): Promise<Map<string, Merged>> {
  const merged = new Map<string, Merged>();
  for (const layer of LAYERS) {
    for (const folder of RECORD_FOLDERS) {
      const path = join(checkout, layer, folder);
      let files: string[];
      try {
        files = (await readdir(path)).filter((f) => f.endsWith(".json"));
      } catch {
        continue; // A layer holds only the folders it changes.
      }
      for (const file of files.sort(byCodePoint)) {
        const record = JSON.parse(await readFile(join(path, file), "utf8"));
        const name = file.slice(0, -".json".length);
        if (record.name !== name) {
          throw new Error(
            `${layer}/${folder}/${file}: name is ${JSON.stringify(record.name)}`,
          );
        }
        merged.set(`${folder}/${name}`, {
          kind: folder === "globals" ? "globals" : "functions",
          record,
        });
      }
    }
  }
  return new Map([...merged].sort(([a], [b]) => byCodePoint(a, b)));
}

/** Functions and globals of the Patch by source, entry kind and name. */
async function readPatch(patchDir: string): Promise<Map<string, Declaration>> {
  const declarations = new Map<string, Declaration>();
  for (const source of SOURCES) {
    const text = await readFile(join(patchDir, source), "utf8");
    const parsed = parseJass(source, text);
    if (parsed.diagnostics.length > 0) {
      throw new Error(
        `${source}: ${parsed.diagnostics.map((d) => d.message).join("; ")}`,
      );
    }
    for (const declaration of parsed.declarations) {
      if (declaration.kind === "type") continue;
      const kind = declaration.kind === "global" ? "globals" : "functions";
      declarations.set(
        declarationKey(source, kind, declaration.name),
        declaration,
      );
    }
  }
  return declarations;
}

function declarationKey(source: string, kind: EntryKind, name: string): string {
  return `${source}/${kind}/${name}`;
}

/** Whether `file` holds an entry without `origin`, which is never overwritten. */
async function handWritten(file: string): Promise<boolean> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return false;
  }
  return JSON.parse(text).origin !== SEED_ORIGIN;
}

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

/** The record of the seed next to this script. */
export const RECORD_FILE = join(
  packageRoot,
  "scripts",
  "war3-types-strict.json",
);

async function main(args: readonly string[]): Promise<number> {
  if (args.length < 2 || args.length > 4) {
    console.error(
      "Usage: seed-from-war3-types-strict <checkout> <commit> [patchDir] [overlayDir]",
    );
    return 2;
  }
  const [checkout, commit] = args as [string, string];
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: checkout,
    encoding: "utf8",
  }).trim();
  if (head !== commit) {
    console.error(`${checkout} is at ${head}, not at ${commit}`);
    return 1;
  }
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  const report = await seed({
    checkout,
    commit,
    patchDir: args[2] ?? join(packageRoot, "vendor", manifest.reforged.patch),
    overlayDir: args[3] ?? join(packageRoot, "overlay"),
    asyncNames: ASYNC_NATIVES,
  });
  await writeFile(RECORD_FILE, JSON.stringify(report, null, 2) + "\n");

  for (const [group, count] of Object.entries(report.written)) {
    console.log(`wrote ${String(count).padStart(5)} ${group}`);
  }
  console.log(`skipped ${report.skipped.length}:`);
  for (const s of report.skipped) {
    console.log(`  ${s.source}/${s.kind}/${s.name}: ${s.reason}`);
  }
  if (report.asyncUnseeded.length > 0) {
    console.log(
      `async Natives with no seeded entry: ${report.asyncUnseeded.join(", ")}`,
    );
  }
  return 0;
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2));
}
