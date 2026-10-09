/**
 * The check-time cost of the `FourCC` overloads (#515): the fixture Map
 * project (`test/fixtures/map-project`, its compiler options and `types`)
 * with a file of `calls` literal `FourCC` calls is type-checked with and
 * without the overloads' entry of a Game version, each case `runs` times in
 * a fresh program, and the median reported. The fixture's own sources stay
 * out: its negative fixtures fail the check on purpose. A measurement, not a gate: #462
 * estimated about 2 ms per call at 6,000 overloads.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import * as ts from "typescript";
import { overloadsPath } from "./emit.js";
import type { BuiltinsIndex } from "./model.js";

export interface MeasureOptions {
  /** The package root, which holds the Game version's index and overloads. */
  root: string;
  gameVersion: string;
  /** The numbers of calls of each case. */
  calls: readonly number[];
  /** The runs of each case; the median is reported. */
  runs: number;
}

export interface Measurement {
  calls: number;
  /** The median check time without the overloads, in milliseconds. */
  withoutOverloads: number;
  /** The median check time with them, in milliseconds. */
  withOverloads: number;
}

export interface MeasureResult {
  /** The number of overloads of the Game version. */
  overloads: number;
  measurements: Measurement[];
}

/**
 * The source of a Map project file of `calls` statements, each a literal
 * `FourCC` call of a Built-in object's Rawcode passed where its kind is
 * expected, cycling through the index's objects of the kinds a Native takes.
 */
export function mapProjectSource(index: BuiltinsIndex, calls: number): string {
  const units = Object.keys(index.objects).filter(
    (rawcode) => index.objects[rawcode].kind === "unit",
  );
  const abilities = Object.keys(index.objects).filter(
    (rawcode) => index.objects[rawcode].kind === "ability",
  );
  const lines = ["declare const owner: player;", "declare const target: unit;"];
  for (let i = 0; i < calls; i++) {
    lines.push(
      i % 2 === 0
        ? `CreateUnit(owner, FourCC(${JSON.stringify(units[i % units.length])}), 0, 0, 0);`
        : `UnitAddAbility(target, FourCC(${JSON.stringify(abilities[i % abilities.length])}));`,
    );
  }
  return `${lines.join("\n")}\nexport {};\n`;
}

/** The fixture Map project, relative to the package root. */
const FIXTURE = join("test", "fixtures", "map-project");

/** The compiler options of the fixture Map project's `tsconfig.json`. */
function fixtureOptions(root: string): ts.CompilerOptions {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    join(root, FIXTURE, "tsconfig.json"),
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
  if (parsed === undefined) {
    throw new Error("The fixture Map project's tsconfig.json does not parse.");
  }
  return parsed.options;
}

/** The milliseconds of one full type check of `rootNames`, the source served in memory. */
function checkTime(
  rootNames: readonly string[],
  options: ts.CompilerOptions,
  main: string,
  source: string,
): number {
  const host = ts.createCompilerHost(options);
  // TypeScript hands the host `/`-separated paths, also on Windows.
  const isMain = (name: string) => resolve(name) === resolve(main);
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

/** Measures the check time of each number of calls, with and without the overloads. */
export function measure(options: MeasureOptions): MeasureResult {
  const index = JSON.parse(
    readFileSync(join(options.root, options.gameVersion, "index.json"), "utf8"),
  ) as BuiltinsIndex;
  const compilerOptions = fixtureOptions(options.root);
  const overloads = join(options.root, overloadsPath(options.gameVersion));
  // Served in memory, inside the fixture so its packages resolve from there.
  const main = join(options.root, FIXTURE, "measure.ts");
  const measurements = options.calls.map((calls) => {
    const source = mapProjectSource(index, calls);
    const time = (roots: string[]) =>
      median(
        Array.from({ length: options.runs }, () =>
          checkTime(roots, compilerOptions, main, source),
        ),
      );
    return {
      calls,
      withoutOverloads: time([main]),
      withOverloads: time([overloads, main]),
    };
  });
  return { overloads: Object.keys(index.objects).length, measurements };
}

/** The result as text: one line per number of calls, and the cost per call. */
export function formatMeasurement(result: MeasureResult): string {
  const ms = (value: number) => `${value.toFixed(0)} ms`;
  const lines = [
    `Check time of a Map project, median, with ${String(result.overloads)} FourCC overloads and without:`,
    ...result.measurements.map(
      (m) =>
        `- ${String(m.calls)} calls: ${ms(m.withoutOverloads)} without, ${ms(m.withOverloads)} with (+${ms(m.withOverloads - m.withoutOverloads)}, ${((m.withOverloads - m.withoutOverloads) / m.calls).toFixed(2)} ms per call).`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}
