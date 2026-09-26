/**
 * `coverage:report`, programmatic entry point: the Wrapper coverage report
 * of ADR 0008, generated from the Typings' manifest and a scan of the
 * library sources, never from a hand-written list of Natives.
 *
 * Only the common.j Natives count. A Native is owned by the Wrapper whose
 * handle type is the Jass type of its first parameter; a Native whose first
 * parameter is not a handle (or that has none) and that returns a wrapped
 * handle type is owned by the returned type's Wrapper (the creation
 * Natives). Every other Native is unowned: its first parameter is a handle
 * type no Wrapper owns (`hashtable`, `ability`), or it takes no handle first
 * and returns no wrapped one. An owned Native is covered when any class of
 * the library calls it, excluded when the exclusions list names it, and
 * missing otherwise.
 *
 * The report fails (`failed`) on a missing Native or on any problem: a stale
 * exclusion, or a configuration that disagrees with the sources or the
 * manifest. Inputs it cannot read fail it before any report is computed.
 */
import { readFile } from "node:fs/promises";
import {
  readExclusions,
  readWrappers,
  type Exclusion,
  type WrapperEntry,
} from "./configuration.js";
import { InputError } from "./input-error.js";
import {
  isHandleType,
  readManifest,
  signature,
  type Manifest,
  type Native,
} from "./manifest.js";
import { byCodePoint } from "./order.js";
import { renderJson, renderMarkdown } from "./render.js";
import { scanSources, type Scan } from "./scan.js";
import { errorMessage } from "./unknown.js";

/** The report's inputs, by absolute path. */
export interface CoverageInput {
  /** The per-Patch manifest `reforged-types` writes. */
  manifestFile: string;
  /** The library's sources: every `.ts` file under it is scanned. */
  sourceDir: string;
  /** The Wrapper configuration: one line per Wrapper, class to handle type. */
  wrappersFile: string;
  /** The exclusions list. */
  exclusionsFile: string;
}

/** The version of the JSON shape; it changes when a consumer must adapt. */
export const REPORT_FORMAT = 1;

/** The class name every Wrapper extends, directly or through another. */
export const HANDLE_BASE = "Handle";

export interface ReportedNative {
  name: string;
  /** The Jass declaration without its keyword. */
  signature: string;
}

export interface CoveredNative extends ReportedNative {
  /** Every class calling the Native, in code-point order. */
  coveredBy: string[];
}

export type ExcludedNative = ReportedNative & Omit<Exclusion, "native">;

export interface WrapperCoverage {
  wrapper: string;
  /** The handle type the Wrapper owns. */
  type: string;
  counts: { owned: number; covered: number; missing: number; excluded: number };
  /** Each list in the manifest's order. */
  covered: CoveredNative[];
  missing: ReportedNative[];
  excluded: ExcludedNative[];
}

/** The unowned Natives taking one handle type first. */
export interface UnownedGroup {
  type: string;
  count: number;
  /** In the manifest's order. */
  natives: string[];
}

export type ProblemKind =
  /** An excluded Native some class now calls. */
  | "stale-exclusion"
  /** An excluded name that is no common.j Native of the manifest. */
  | "unknown-exclusion"
  /** An excluded Native no Wrapper owns. */
  | "unowned-exclusion"
  /** A class extending the Handle base that the configuration does not list. */
  | "unlisted-wrapper"
  /** A configured Wrapper with no class declaration in the sources. */
  | "missing-wrapper"
  /** A configured handle type the manifest names nowhere. */
  | "unknown-type";

export interface Problem {
  kind: ProblemKind;
  message: string;
}

export interface CoverageReport {
  format: typeof REPORT_FORMAT;
  /** The Build of the manifest. */
  patch: string;
  totals: {
    /** The common.j Natives. */
    natives: number;
    owned: number;
    covered: number;
    missing: number;
    excluded: number;
    unowned: number;
  };
  problems: Problem[];
  /** In the configuration's order. */
  wrappers: WrapperCoverage[];
  unowned: {
    /** In code-point order of the type. */
    handleFirst: UnownedGroup[];
    /** No handle first and no wrapped handle returned, in the manifest's order. */
    noHandle: { count: number; natives: string[] };
  };
}

export type CoverageResult =
  | {
      ok: true;
      report: CoverageReport;
      /** A missing Native or a problem: the command exits non-zero. */
      failed: boolean;
      /** The report as its JSON file holds it. */
      json: string;
      /** The report's Markdown rendering. */
      markdown: string;
    }
  | { ok: false; message: string };

async function readJson(path: string, what: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    throw new InputError(`Cannot read ${what}: ${errorMessage(error)}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new InputError(`${what} is not JSON: ${errorMessage(error)}`);
  }
}

/**
 * The handle type owning `native` among the `wrapped` ones: its first
 * parameter's type when that is a handle type, else its return type (the
 * creation Natives); `undefined` when no Wrapper owns that type.
 */
function ownerType(
  native: Native,
  wrapped: ReadonlySet<string>,
): string | undefined {
  const first = native.params.at(0)?.type;
  const type =
    first !== undefined && isHandleType(first) ? first : native.returns;
  return wrapped.has(type) ? type : undefined;
}

/** Whether `name` reaches the Handle base through its `extends` chain. */
function extendsHandle(name: string, scan: Scan): boolean {
  const seen = new Set<string>();
  let base = scan.classes.get(name)?.base;
  while (base !== undefined && !seen.has(base)) {
    if (base === HANDLE_BASE) return true;
    seen.add(base);
    base = scan.classes.get(base)?.base;
  }
  return false;
}

/** Where the Wrapper configuration disagrees with the sources or the manifest. */
function configurationProblems(
  wrappers: readonly WrapperEntry[],
  scan: Scan,
  types: ReadonlySet<string>,
): Problem[] {
  const listed = new Set(wrappers.map((entry) => entry.wrapper));
  const unlisted = [...scan.classes.keys()]
    .filter((name) => !listed.has(name) && extendsHandle(name, scan))
    .sort(byCodePoint)
    .map((name): Problem => ({
      kind: "unlisted-wrapper",
      message: `${name} extends ${HANDLE_BASE} but the Wrapper configuration does not list it.`,
    }));
  const configured = wrappers.flatMap(({ wrapper, type }) => {
    const problems: Problem[] = [];
    if (!extendsHandle(wrapper, scan))
      problems.push({
        kind: "missing-wrapper",
        message: `The Wrapper configuration lists ${wrapper}, which is no class extending ${HANDLE_BASE} in the sources.`,
      });
    if (!types.has(type))
      problems.push({
        kind: "unknown-type",
        message: `The Wrapper configuration gives ${wrapper} the handle type ${type}, which the manifest names nowhere.`,
      });
    return problems;
  });
  return [...unlisted, ...configured];
}

/** The exclusions that no longer hold, in the order of the file. */
function exclusionProblems(
  exclusions: readonly Exclusion[],
  natives: readonly Native[],
  wrapped: ReadonlySet<string>,
  scan: Scan,
): Problem[] {
  const byName = new Map(natives.map((native) => [native.name, native]));
  return exclusions.flatMap(({ native: name }): Problem[] => {
    const native = byName.get(name);
    const callers = scan.calls.get(name);
    if (native === undefined)
      return [
        {
          kind: "unknown-exclusion",
          message: `${name} is excluded, but it is no common.j Native of the manifest: remove the exclusion.`,
        },
      ];
    if (ownerType(native, wrapped) === undefined)
      return [
        {
          kind: "unowned-exclusion",
          message: `${name} is excluded, but no Wrapper owns it: remove the exclusion.`,
        },
      ];
    if (callers !== undefined)
      return [
        {
          kind: "stale-exclusion",
          message: `${name} is excluded, but ${[...callers].sort(byCodePoint).join(", ")} now calls it: remove the exclusion.`,
        },
      ];
    return [];
  });
}

/** The report of `input`; a failed result when an input cannot be read. */
export async function coverageReport(
  input: CoverageInput,
): Promise<CoverageResult> {
  try {
    const manifest = readManifest(
      await readJson(input.manifestFile, "the manifest"),
    );
    const wrappers = readWrappers(
      await readJson(input.wrappersFile, "the Wrapper configuration"),
    );
    const exclusions = readExclusions(
      await readJson(input.exclusionsFile, "the exclusions file"),
    );
    const scan = await scanSources(
      input.sourceDir,
      new Set(manifest.natives.map((native) => native.name)),
    );
    const report = buildReport(manifest, wrappers, exclusions, scan);
    return {
      ok: true,
      report,
      failed: report.totals.missing > 0 || report.problems.length > 0,
      json: renderJson(report),
      markdown: renderMarkdown(report),
    };
  } catch (error) {
    if (error instanceof InputError)
      return { ok: false, message: error.message };
    throw error;
  }
}

function buildReport(
  manifest: Manifest,
  wrappers: readonly WrapperEntry[],
  exclusions: readonly Exclusion[],
  scan: Scan,
): CoverageReport {
  const { natives } = manifest;
  const byType = new Map(
    wrappers.map((entry): [string, WrapperCoverage] => [
      entry.type,
      {
        ...entry,
        counts: { owned: 0, covered: 0, missing: 0, excluded: 0 },
        covered: [],
        missing: [],
        excluded: [],
      },
    ]),
  );
  const wrapped = new Set(byType.keys());
  const excluded = new Map(
    exclusions.map((exclusion) => [exclusion.native, exclusion]),
  );
  const handleFirst = new Map<string, string[]>();
  const noHandle: string[] = [];

  for (const native of natives) {
    const type = ownerType(native, wrapped);
    const entry = type === undefined ? undefined : byType.get(type);
    if (entry === undefined) {
      const first = native.params.at(0)?.type;
      if (first !== undefined && isHandleType(first)) {
        handleFirst.set(first, [
          ...(handleFirst.get(first) ?? []),
          native.name,
        ]);
      } else {
        noHandle.push(native.name);
      }
      continue;
    }
    const reported = { name: native.name, signature: signature(native) };
    const callers = scan.calls.get(native.name);
    const exclusion = excluded.get(native.name);
    entry.counts.owned++;
    if (callers !== undefined) {
      entry.counts.covered++;
      entry.covered.push({
        ...reported,
        coveredBy: [...callers].sort(byCodePoint),
      });
    } else if (exclusion !== undefined) {
      entry.counts.excluded++;
      const { reason, source, date } = exclusion;
      entry.excluded.push({ ...reported, reason, source, date });
    } else {
      entry.counts.missing++;
      entry.missing.push(reported);
    }
  }

  const list = [...byType.values()];
  const sum = (key: keyof WrapperCoverage["counts"]) =>
    list.reduce((total, entry) => total + entry.counts[key], 0);
  const groups = [...handleFirst]
    .sort(([a], [b]) => byCodePoint(a, b))
    .map(([type, names]) => ({ type, count: names.length, natives: names }));
  return {
    format: REPORT_FORMAT,
    patch: manifest.patch,
    totals: {
      natives: natives.length,
      owned: sum("owned"),
      covered: sum("covered"),
      missing: sum("missing"),
      excluded: sum("excluded"),
      unowned: natives.length - sum("owned"),
    },
    problems: [
      ...configurationProblems(wrappers, scan, manifest.types),
      ...exclusionProblems(exclusions, natives, wrapped, scan),
    ],
    wrappers: list,
    unowned: {
      handleFirst: groups,
      noHandle: { count: noHandle.length, natives: noHandle },
    },
  };
}
