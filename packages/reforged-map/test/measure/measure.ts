// The check-time cost of the map's FourCC overloads (#584), measured as
// reforged-builtins measures its own (its src/measure.ts, #515): a map folder
// of `objects` Custom units, written by the test-only encoder and read by
// generateObjects, gives a Map project its map-objects.d.ts; the project,
// with a file of `calls` literal FourCC calls of those units, is type-checked
// with and without it, each case `runs` times in a fresh program after an
// untimed one, the two cases alternating, and the median reported. The
// project's other sources stay out: the fixtures' negative ones fail the
// check on purpose. A measurement, not a gate: at more than
// 1 ms per call the overloads do not ship on by default unasked (#579).

import path from "node:path";
import { performance } from "node:perf_hooks";
import * as ts from "typescript";
import { OBJECTS_DECLARATIONS_FILE, generateObjects } from "../../src/index.js";
import { PACKAGE_ROOT, mapFolder } from "../support/map-folder.js";
import { createMapProject } from "../support/map-project.js";
import { buildObjectData } from "../support/object-data.js";

/** What {@link measure} measures. */
export interface MeasureOptions {
  /** The number of Custom units of the map. */
  objects: number;
  /** The numbers of calls of each case. */
  calls: readonly number[];
  /** The runs of each case; the median is reported. */
  runs: number;
}

/** The check times of one number of calls. */
export interface Measurement {
  calls: number;
  /** The median check time without the map's overloads, in milliseconds. */
  withoutOverloads: number;
  /** The median check time with them, in milliseconds. */
  withOverloads: number;
}

/** What {@link measure} returns. */
export interface MeasureResult {
  /** The number of Custom units, each one overload. */
  objects: number;
  measurements: Measurement[];
}

const BASE_36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The Rawcode of the map's `index`th Custom unit, as the World Editor numbers a human unit's: `h000`, `h001`, … `h00Z`, `h010`. */
export function customUnitRawcode(index: number): string {
  let digits = "";
  for (let rest = index, i = 0; i < 3; i++, rest = Math.floor(rest / 36)) {
    digits = BASE_36[rest % 36] + digits;
  }
  return `h${digits}`;
}

/**
 * The source of a Map project file of `calls` statements, each a literal
 * `FourCC` call of a Custom unit passed where a unit's Rawcode is expected,
 * cycling through `rawcodes`.
 */
export function mapProjectSource(
  rawcodes: readonly string[],
  calls: number,
): string {
  const lines = ["declare const owner: player;"];
  for (let i = 0; i < calls; i++) {
    lines.push(
      `CreateUnit(owner, FourCC(${JSON.stringify(rawcodes[i % rawcodes.length])}), 0, 0, 0);`,
    );
  }
  return `${lines.join("\n")}\nexport {};\n`;
}

/** The generated files of a map folder of `objects` Custom units, each a named Footman. */
function generatedFiles(rawcodes: readonly string[]) {
  const folder = mapFolder({
    "war3map.w3u": buildObjectData({
      custom: rawcodes.map((custom, i) => ({
        original: "hfoo",
        custom,
        modifications: [{ field: "unam", value: `Captain ${String(i)}` }],
      })),
    }),
  });
  const output = generateObjects(folder, { projectRoot: PACKAGE_ROOT });
  if (output.warnings.length > 0) {
    throw new Error(`generateObjects warned: ${output.warnings.join("\n")}`);
  }
  return output.files;
}

/** The compiler options of a Map project's `tsconfig.json`. */
function projectOptions(tsconfig: string): ts.CompilerOptions {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    { noEmit: true },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (parsed === undefined) throw new Error(`${tsconfig} does not parse.`);
  return parsed.options;
}

/** The milliseconds of one full type check of `rootNames`, the source of `main` served in memory. */
function checkTime(
  rootNames: readonly string[],
  options: ts.CompilerOptions,
  main: string,
  source: string,
): number {
  const host = ts.createCompilerHost(options);
  // TypeScript hands the host `/`-separated paths, also on Windows.
  const isMain = (name: string) => path.resolve(name) === path.resolve(main);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, language, onError, create) =>
    isMain(name)
      ? ts.createSourceFile(name, source, language)
      : getSourceFile(name, language, onError, create);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => isMain(name) || fileExists(name);
  const start = performance.now();
  const program = ts.createProgram({ rootNames, options, host });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const elapsed = performance.now() - start;
  if (diagnostics.length > 0) {
    throw new Error(
      `The measured project does not type-check: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, "\n")}`,
    );
  }
  return elapsed;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Measures the check time of each number of calls, with and without the
 * map's overloads. Reads reforged-ts from its emitted declarations: `pnpm
 * build` runs first. The temporary Map project is left to `removeTemporary`.
 */
export function measure(options: MeasureOptions): MeasureResult {
  const rawcodes = Array.from({ length: options.objects }, (_, i) =>
    customUnitRawcode(i),
  );
  const tsconfig = createMapProject(generatedFiles(rawcodes));
  const compilerOptions = projectOptions(tsconfig);
  const src = path.join(path.dirname(tsconfig), "src");
  const overloads = path.join(src, OBJECTS_DECLARATIONS_FILE);
  const main = path.join(src, "measure.ts");
  const measurements = options.calls.map((calls) => {
    const source = mapProjectSource(rawcodes, calls);
    const check = (roots: readonly string[]) =>
      checkTime(roots, compilerOptions, main, source);
    const without = [main];
    const withOverloads = [overloads, main];
    // A first, untimed check of each case: the first programs run on a cold
    // JIT, and a program of 500 overloads is fast enough for that to show.
    // The runs then alternate the two cases, so that a change in the
    // machine's load weighs on both.
    check(without);
    check(withOverloads);
    const times = Array.from({ length: options.runs }, () => [
      check(without),
      check(withOverloads),
    ]);
    return {
      calls,
      withoutOverloads: median(times.map(([time]) => time)),
      withOverloads: median(times.map(([, time]) => time)),
    };
  });
  return { objects: options.objects, measurements };
}

/** The result as text: one line per number of calls, and the cost per call. */
export function formatMeasurement(result: MeasureResult): string {
  const ms = (value: number) => `${value.toFixed(0)} ms`;
  const lines = [
    `Check time of a Map project, median, with the FourCC overloads of ${String(result.objects)} Custom units and without:`,
    ...result.measurements.map(
      (m) =>
        `- ${String(m.calls)} calls: ${ms(m.withoutOverloads)} without, ${ms(m.withOverloads)} with (+${ms(m.withOverloads - m.withoutOverloads)}, ${((m.withOverloads - m.withoutOverloads) / m.calls).toFixed(2)} ms per call).`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}
