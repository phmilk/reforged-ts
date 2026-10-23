// `map:measure:definitions [--runs <n>]`: the cost of the Rawcode lookup's
// reload over a Map project of 500 Object definition files (#707), printed.
// Each file defines one Custom unit; the map folder is the World Editor's
// fixture. The first lookup loads every file (each transpiled); then each
// run edits one file, moves its modification time, and times the lookup
// that reloads, every other file's transpiled text reused. A measurement,
// not a gate: past 200 ms per reload, #700 is asked first. A bad argument
// exits 2.

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { openRawcodeLookup } from "../../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "../support/map-folder.js";
import { customUnitRawcode } from "./measure.js";

/** What {@link measureReload} measures. */
export interface ReloadOptions {
  /** The number of definition files, one Custom unit each. */
  files: number;
  /** The timed reloads; the median is reported. */
  runs: number;
}

/** What {@link measureReload} returns, in milliseconds. */
export interface ReloadResult {
  files: number;
  /** The first lookup: the map folder read and every file transpiled. */
  firstLoad: number;
  /** The median lookup after one file was edited. */
  reload: number;
  /** The slowest of those lookups. */
  slowestReload: number;
}

/** The Rawcode of the `index`th definition: `h100` onwards, clear of the fixture's `h000` and `h001`. */
const rawcodeOf = (index: number): string => customUnitRawcode(36 * 36 + index);

/** A definition file of one Custom unit, named `name`. */
function definitionSource(rawcode: string, name: string): string {
  return `import { defineUnit } from "reforged-map/objects";

export const Unit = defineUnit({
  rawcode: "${rawcode}",
  base: FourCC("hfoo"),
  fields: { unam: "${name}", uhpm: 420, umvs: 300 },
});
`;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Measures the lookup's first load and its reload after one edit, over a
 * temporary Map project, which is left to `removeTemporary`.
 */
export function measureReload(options: ReloadOptions): ReloadResult {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  fs.cpSync(fixtureMap("editor-objects.w3m"), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  for (const name of ["typescript", "reforged-builtins"]) {
    const link = path.join(root, "node_modules", name);
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(
      fs.realpathSync(path.join(PACKAGE_ROOT, "node_modules", name)),
      link,
      "junction",
    );
  }
  const folder = path.join(root, "src", "objects", "units");
  fs.mkdirSync(folder, { recursive: true });
  const fileOf = (index: number) =>
    path.join(folder, `Unit_${rawcodeOf(index)}.ts`);
  for (let index = 0; index < options.files; index++) {
    fs.writeFileSync(
      fileOf(index),
      definitionSource(rawcodeOf(index), `Captain ${String(index)}`),
    );
  }
  const lookup = openRawcodeLookup({
    mapFolder,
    projectRoot: root,
    minInterval: 0,
  });
  const look = (rawcode: string, name: string): number => {
    const start = performance.now();
    const result = lookup.lookup(rawcode);
    const elapsed = performance.now() - start;
    if (result.status !== "known" || result.objects[0]?.name !== name) {
      throw new Error(
        `The lookup of ${rawcode} gave ${JSON.stringify(result)}, not ${name}.`,
      );
    }
    return elapsed;
  };
  const firstLoad = look(rawcodeOf(0), "Captain 0");
  const times: number[] = [];
  for (let run = 0; run < options.runs; run++) {
    const index = run % options.files;
    const rawcode = rawcodeOf(index);
    const name = `Edited ${String(run)}`;
    fs.writeFileSync(fileOf(index), definitionSource(rawcode, name));
    const later = new Date(Date.now() + (run + 1) * 1000);
    fs.utimesSync(fileOf(index), later, later);
    times.push(look(rawcode, name));
  }
  return {
    files: options.files,
    firstLoad,
    reload: median(times),
    slowestReload: Math.max(...times),
  };
}

/** The result as text. */
export function formatReload(result: ReloadResult): string {
  const ms = (value: number) => `${value.toFixed(0)} ms`;
  return `Rawcode lookup over ${String(result.files)} Object definition files: first load ${ms(result.firstLoad)}, reload after editing one file ${ms(result.reload)} (median), ${ms(result.slowestReload)} at most.\n`;
}

const USAGE = "Usage: map:measure:definitions [--runs <n>]\n";

/** Runs the command on its arguments; returns its exit code. */
export function main(
  args: readonly string[],
  output: { stdout: (text: string) => void; stderr: (text: string) => void },
  files = 500,
): number {
  const rest = args[0] === "--" ? args.slice(1) : args;
  let runs = 15;
  if (rest.length > 0) {
    const value = Number(rest[1]);
    if (
      rest[0] !== "--runs" ||
      rest.length !== 2 ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      output.stderr(USAGE);
      return 2;
    }
    runs = value;
  }
  try {
    output.stdout(formatReload(measureReload({ files, runs })));
  } finally {
    removeTemporary();
  }
  return 0;
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(path.resolve(script)).href === import.meta.url
) {
  process.exitCode = main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
}
