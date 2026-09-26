/**
 * Fixture inputs for the report: a manifest, library sources, a Wrapper
 * configuration and an exclusions file, written to a temporary folder from
 * the values a test gives.
 */
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { main, type Context } from "../../src/cli/report.js";
import type { CoverageInput } from "../../src/report.js";

/** The Build of every fixture manifest. */
export const FIXTURE_PATCH = "3.0.0.24268";

const PRIMITIVES = new Set(["integer", "real", "boolean", "string", "code"]);

/**
 * A manifest entry of a function from its Jass declaration without the
 * leading keyword (`GetUnitX takes unit whichUnit returns real`).
 */
export function jassFunction(
  declaration: string,
  source = "common.j",
  kind: "native" | "function" = "native",
) {
  const match = /^(\w+) takes (.+) returns (\w+)$/.exec(declaration);
  if (!match) throw new Error(`not a Jass declaration: ${declaration}`);
  const [, name, takes, returns] = match;
  const params =
    takes === "nothing"
      ? []
      : takes.split(", ").map((param) => {
          const [type, paramName] = param.split(" ");
          return { name: paramName, type, nullable: false };
        });
  return {
    name,
    source,
    kind,
    constant: false,
    params,
    returns: { type: returns, nullable: !PRIMITIVES.has(returns) },
    async: false,
    since: null,
    deprecated: null,
  };
}

/** A manifest entry of a global of `type`. */
export function jassGlobal(name: string, type: string, source = "common.j") {
  return {
    name,
    source,
    kind: "global",
    constant: true,
    array: false,
    type,
    nullable: false,
    since: null,
    deprecated: null,
  };
}

/** The common.j Natives of the standard fixture, by role. */
export const NATIVES = {
  /** Handle first, owned by `Unit` and called by it. */
  getUnitX: "GetUnitX takes unit whichUnit returns real",
  /** Handle first, owned by `Unit` and called by no class. */
  setUnitFacingTimed:
    "SetUnitFacingTimed takes unit whichUnit, real facingAngle, real duration returns nothing",
  /** Handle first, owned by `Unit`; the standard exclusions name it. */
  isUnitInvisible:
    "IsUnitInvisible takes unit whichUnit, player whichPlayer returns boolean",
  /** Parameterless, returning a wrapped type: owned by `Unit`. */
  getTriggerUnit: "GetTriggerUnit takes nothing returns unit",
  /** Another Wrapper's type first: owned by `MapPlayer`, called by `Unit`. */
  createUnit:
    "CreateUnit takes player id, integer unitid, real x, real y, real face returns unit",
  /** Handle first, owned by `MapPlayer` and called by it. */
  getPlayerId: "GetPlayerId takes player whichPlayer returns integer",
  /** A creation Native: an integer first, returns a `player`. */
  player: "Player takes integer number returns player",
  /** Parameterless, owned by `MapPlayer`, called by the static `Camera`. */
  getLocalPlayer: "GetLocalPlayer takes nothing returns player",
  /** A hashtable first, returning a wrapped type: unowned. */
  loadUnitHandle:
    "LoadUnitHandle takes hashtable table, integer parentKey, integer childKey returns unit",
  /** An unwrapped handle type first, called by the static `Camera`: unowned. */
  setCameraField:
    "SetCameraField takes camerafield whichField, real value, real duration returns nothing",
  /** A number first, no wrapped handle returned: unowned. */
  r2i: "R2I takes real r returns integer",
  /** Parameterless, no wrapped handle returned: unowned. */
  doNotSaveReplay: "DoNotSaveReplay takes nothing returns nothing",
} as const;

/**
 * The standard fixture manifest: the Natives above in their order, then
 * what the report ignores: a global, a Blizzard.j function and a common.ai
 * Native.
 */
export function standardManifest(): unknown[] {
  return [
    ...Object.values(NATIVES).map((declaration) => jassFunction(declaration)),
    jassGlobal("bj_lastCreatedUnit", "unit", "blizzard.j"),
    jassFunction(
      "CreateNUnitsAtLoc takes integer count, integer unitId, player whichPlayer, location loc, real face returns group",
      "blizzard.j",
      "function",
    ),
    jassFunction(
      "GetUnitCountDone takes integer unitid returns integer",
      "common.ai",
    ),
  ];
}

/**
 * The standard fixture sources: the Handle base, two Wrappers (`Unit`,
 * `MapPlayer`) and one static-only class (`Camera`). Parsed, never
 * type-checked.
 */
export function standardSources(): Record<string, string> {
  return {
    "handles/handle.ts": [
      "export abstract class Handle<T extends handle> {",
      "  protected constructor(readonly handle: T) {}",
      "}",
      "",
    ].join("\n"),
    "handles/unit.ts": [
      'import { Handle } from "./handle";',
      'import type { MapPlayer } from "./player";',
      "",
      "export class Unit extends Handle<unit> {",
      "  static create(owner: MapPlayer, id: number, x: number, y: number) {",
      "    return new Unit(CreateUnit(owner.handle, id, x, y, 0));",
      "  }",
      "  static fromEvent() {",
      "    return GetTriggerUnit();",
      "  }",
      "  get x() {",
      "    return GetUnitX(this.handle);",
      "  }",
      "}",
      "",
    ].join("\n"),
    "handles/player.ts": [
      'import { Handle } from "./handle";',
      "",
      "export class MapPlayer extends Handle<player> {",
      "  static fromIndex(index: number) {",
      "    return new MapPlayer(Player(index));",
      "  }",
      "  get id() {",
      "    return GetPlayerId(this.handle);",
      "  }",
      "}",
      "",
    ].join("\n"),
    "handles/camera.ts": [
      "export class Camera {",
      "  static setField(field: camerafield, value: number) {",
      "    SetCameraField(field, value, 0);",
      "  }",
      "  static isLocal(handle: player) {",
      "    return GetLocalPlayer() === handle;",
      "  }",
      "}",
      "",
    ].join("\n"),
  };
}

/** The standard Wrapper configuration: the two fixture Wrappers. */
export function standardWrappers(): Record<string, string> {
  return { Unit: "unit", MapPlayer: "player" };
}

/** The standard exclusions: `IsUnitInvisible`, with a reason. */
export function standardExclusions(): unknown[] {
  return [
    {
      native: "IsUnitInvisible",
      reason: "Returns false for every unit in 3.0.0.",
      source: "probe map, invisibility round 1",
      date: "2026-09-25",
    },
  ];
}

export interface Fixture {
  /** The manifest's entries; the standard ones when absent. */
  entries?: unknown[];
  /** Source text by `/`-separated path; the standard sources when absent. */
  sources?: Record<string, string>;
  /** The Wrapper configuration as its file holds it. */
  wrappers?: unknown;
  /** The exclusions as their file holds them. */
  exclusions?: unknown;
}

/** Writes `text` at the `/`-separated `path` under `root`. */
async function writeText(root: string, path: string, text: string) {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}

/** The fixture written to a new temporary folder, as the report's input. */
export async function writeFixture(
  fixture: Fixture = {},
): Promise<CoverageInput> {
  const root = await mkdtemp(join(tmpdir(), "reforged-wrapper-coverage-"));
  const input: CoverageInput = {
    manifestFile: join(root, "manifest.json"),
    sourceDir: join(root, "src"),
    wrappersFile: join(root, "wrappers.json"),
    exclusionsFile: join(root, "exclusions.json"),
  };
  await writeText(
    root,
    "manifest.json",
    JSON.stringify({
      patch: FIXTURE_PATCH,
      entries: fixture.entries ?? standardManifest(),
    }),
  );
  for (const [path, text] of Object.entries(
    fixture.sources ?? standardSources(),
  )) {
    await writeText(root, `src/${path}`, text);
  }
  await writeText(
    root,
    "wrappers.json",
    JSON.stringify(fixture.wrappers ?? standardWrappers()),
  );
  await writeText(
    root,
    "exclusions.json",
    JSON.stringify(fixture.exclusions ?? standardExclusions()),
  );
  return input;
}

export interface Run {
  status: number;
  stdout: string;
  stderr: string;
  /** The written JSON report, parsed; `null` when none was written. */
  json: unknown;
  /** The written Markdown report; `null` when none was written. */
  markdown: string | null;
}

/** Runs the command on the fixture, writing the report next to its inputs. */
export async function runOn(
  fixture: Fixture = {},
  args: readonly string[] = [],
): Promise<Run> {
  const input = await writeFixture(fixture);
  const outDir = dirname(input.manifestFile);
  const context: Context = {
    input: () => Promise.resolve(input),
    jsonFile: join(outDir, "report.json"),
    markdownFile: join(outDir, "report.md"),
  };
  let stdout = "";
  let stderr = "";
  const status = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    context,
  );
  const read = (path: string) => readFile(path, "utf8").catch(() => null);
  const json = await read(context.jsonFile);
  return {
    status,
    stdout,
    stderr,
    json: json === null ? null : (JSON.parse(json) as unknown),
    markdown: await read(context.markdownFile),
  };
}
