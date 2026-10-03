/**
 * The converter table of the Nullability sweep: for each Native whose
 * Overlay entry names the `converter` family, in `common.j` order, the
 * integer of every `common.j` constant of its return type, which the
 * converter generator (probes/nullability/converter.ts) expands into cases.
 * The game cannot read `common.j`, so the table is a module of the Probes,
 * `probes/nullability/converter-constants.ts`, rendered here from the
 * vendored `common.j` of the Typings' Patch and the Overlay, and written by
 * `probe:nullability-converters`; a test fails when it drifts.
 */
import fs from "node:fs";
import path from "node:path";
import * as prettier from "prettier";
import { AuthorError } from "../errors.js";
import { readPatch } from "../manifest.js";

/** One constant of a converter's return type: its name and its integer. */
export type ConverterConstant = readonly [name: string, value: number];

/** A converter and the constants of its return type, in `common.j` order. */
export interface Converter {
  native: string;
  constants: ConverterConstant[];
}

/** The files the table is rendered from. */
export interface ConverterSources {
  /** The Typings' manifest, whose `patch` names the vendored `common.j`. */
  manifest: string;
  /** The vendor folder of reforged-types: `<vendor>/<patch>/common.j`. */
  vendorFolder: string;
  /** The Overlay folder: `<source>/functions/<native>.json`. */
  overlayFolder: string;
}

const CONVERTER_NATIVE =
  /^\s*constant\s+native\s+(\w+)\s+takes\s+integer\s+\w+\s+returns\s+(\w+)/gm;

const CONVERTER_CONSTANT =
  /^\s*constant\s+(\w+)\s+(\w+)\s*=\s*(\w+)\s*\(([^)]*)\)\s*(?:\/\/.*)?$/gm;

/**
 * The integer a constant's argument in `common.j` stands for: a decimal
 * (`12`, `-1`), a hexadecimal (`$0C`, `0x0C`), a rawcode (`'abpx'`) or a
 * product of two decimals (`8192*16`). Anything else fails, naming the
 * constant, so a new form is read on purpose.
 */
export function jassInteger(text: string, constant: string): number {
  const source = text.trim();
  if (/^-?\d+$/.test(source)) return Number(source);
  const hex = /^(?:\$|0x)([0-9a-f]+)$/i.exec(source);
  if (hex !== null) return parseInt(hex[1], 16);
  const rawcode = /^'([\x20-\x7e]{4})'$/.exec(source);
  if (rawcode !== null) {
    let value = 0;
    for (let at = 0; at < 4; at++) {
      value = value * 256 + rawcode[1].charCodeAt(at);
    }
    return value;
  }
  const product = /^(\d+)\s*\*\s*(\d+)$/.exec(source);
  if (product !== null) return Number(product[1]) * Number(product[2]);
  throw new AuthorError(
    `${constant} = ${source}: the converter table reads decimals, hexadecimals, rawcodes and products only.`,
  );
}

/**
 * The converters of `converters`, in `common.j` order, each with the
 * constants of its return type, from the text of `common.j`. A converter
 * that `common.j` does not declare, or a constant of a converter's return
 * type made by another Native, fails.
 */
export function converterTable(
  commonJ: string,
  converters: ReadonlySet<string>,
): Converter[] {
  const table: Converter[] = [];
  const byType = new Map<string, Converter>();
  for (const [, native, returnType] of commonJ.matchAll(CONVERTER_NATIVE)) {
    if (!converters.has(native)) continue;
    const other = byType.get(returnType);
    if (other !== undefined) {
      throw new AuthorError(
        `${native} and ${other.native} both return ${returnType}: the table cannot tell their constants apart.`,
      );
    }
    const converter: Converter = { native, constants: [] };
    table.push(converter);
    byType.set(returnType, converter);
  }
  const missing = [...converters].filter(
    (native) => !table.some((converter) => converter.native === native),
  );
  if (missing.length > 0) {
    throw new AuthorError(
      `common.j declares no converter ${missing.join(", ")}.`,
    );
  }
  for (const [, type, name, native, argument] of commonJ.matchAll(
    CONVERTER_CONSTANT,
  )) {
    const converter = byType.get(type);
    if (converter === undefined) continue;
    if (native !== converter.native) {
      throw new AuthorError(
        `${name} is a ${type} made by ${native}, not by ${converter.native}.`,
      );
    }
    converter.constants.push([name, jassInteger(argument, name)]);
  }
  return table;
}

/** The Natives whose Overlay entry names the `converter` family. */
export function overlayConverters(overlayFolder: string): Set<string> {
  const converters = new Set<string>();
  for (const source of fs.readdirSync(overlayFolder, { withFileTypes: true })) {
    if (!source.isDirectory()) continue;
    const functions = path.join(overlayFolder, source.name, "functions");
    if (!fs.existsSync(functions)) continue;
    for (const file of fs.readdirSync(functions)) {
      if (!file.endsWith(".json")) continue;
      const entry = readJson(path.join(functions, file)) as {
        name: string;
        returns?: { family?: string };
      };
      if (entry.returns?.family === "converter") converters.add(entry.name);
    }
  }
  return converters;
}

/** An Overlay entry, parsed; one that cannot be read is an AuthorError. */
function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new AuthorError(
      `${file} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * The text of the vendored `common.j` of `patch`; a Patch the vendor folder
 * does not hold is an AuthorError.
 */
function readCommonJ(vendorFolder: string, patch: string): string {
  const file = path.join(vendorFolder, patch, "common.j");
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    throw new AuthorError(
      `${file} could not be read: the Patch ${patch} is not vendored.`,
    );
  }
}

/**
 * The text of the module `probes/nullability/converter-constants.ts`: the
 * table rendered from `sources`, formatted with the workspace's Prettier
 * options as `file`, where it is written.
 */
export async function renderConverterModule(
  sources: ConverterSources,
  file: string,
): Promise<string> {
  const patch = readPatch(sources.manifest);
  const commonJ = readCommonJ(sources.vendorFolder, patch);
  const table = converterTable(
    commonJ,
    overlayConverters(sources.overlayFolder),
  );
  const text = [
    `// Generated by \`pnpm probe:nullability-converters\` from the common.j of`,
    `// Patch ${patch} and the Overlay: do not edit. For each converter, in`,
    `// common.j order, the constants of its return type, name and integer, in`,
    `// common.j order, which ./converter.ts expands into cases. A converter`,
    `// whose type has no constant has none.`,
    ``,
    `/** A converter, as the Typings name it: \`ConvertRace\`. */`,
    `export type ConverterName =`,
    ...table.map(({ native }) => `  | ${JSON.stringify(native)}`),
    `;`,
    ``,
    `/** A constant of a converter's return type: its name and its integer. */`,
    `export type ConverterConstant = readonly [name: string, value: number];`,
    ``,
    `/** Each converter's constants, in common.j order. */`,
    `export const CONVERTER_CONSTANTS: Readonly<`,
    `  Record<ConverterName, readonly ConverterConstant[]>`,
    `> = {`,
    ...table.map(
      ({ native, constants }) =>
        `  ${native}: [${constants
          .map(([name, value]) => `[${JSON.stringify(name)}, ${String(value)}]`)
          .join(", ")}],`,
    ),
    `};`,
    ``,
  ].join("\n");
  const options = await prettier.resolveConfig(file);
  return prettier.format(text, { ...options, filepath: file });
}
