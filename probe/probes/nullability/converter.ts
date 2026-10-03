// The case generator of the converter family of the Nullability sweep:
// fully generated from the converter table (./converter-constants.ts),
// the integer of every `common.j` constant of the converter's return type,
// then the boundary values `probe/README.md` ("The cases per family")
// requires.

import type { ReturnCase } from "./case-runner";
import { CONVERTER_CONSTANTS, type ConverterName } from "./converter-constants";

/** The label of the case of the first integer past the greatest constant. */
export const PAST_THE_LAST_LABEL = "past the last constant";

/**
 * `-2147483648`, the least 32-bit integer, as an integer: the literal
 * would be a float in the game's Lua, whose integers are 32-bit.
 */
const LEAST_INTEGER = -2147483647 - 1;

/**
 * A converter, looked up as a global when its case runs, so a converter
 * missing from the game is that case's error.
 * @noSelf
 */
type Converter = (i: number) => unknown;

/** The global function `native`, or an error naming it. */
function converter(native: ConverterName): Converter {
  const found = (_G as unknown as Record<string, Converter | undefined>)[
    native
  ];
  if (found === undefined) error(`${native} is not defined.`, 0);
  return found;
}

/**
 * The integers a converter's cases pass, each with its label: every
 * distinct integer of the constants, in `common.j` order, labelled by the
 * constants that hold it, joined by ` or `; then `-1`, the first integer
 * past the greatest constant (`past the last constant`), `2147483647` and
 * `-2147483648`, each unless a constant holds it. With no constant, `0`,
 * `1`, `-1` and `2147483647`.
 */
function converterValues(
  native: ConverterName,
): readonly (readonly [label: string, value: number])[] {
  const constants = CONVERTER_CONSTANTS[native];
  if (constants.length === 0) {
    return [
      ["0", 0],
      ["1", 1],
      ["-1", -1],
      ["2147483647", 2147483647],
    ];
  }
  const values: number[] = [];
  const names: string[][] = [];
  let greatest = constants[0][1];
  for (const [name, value] of constants) {
    const at = values.indexOf(value);
    if (at === -1) {
      values.push(value);
      names.push([name]);
    } else {
      names[at].push(name);
    }
    if (value > greatest) greatest = value;
  }
  const labelled: (readonly [string, number])[] = values.map((value, at) => [
    names[at].join(" or "),
    value,
  ]);
  const boundaries: readonly (readonly [string, number])[] = [
    ["-1", -1],
    [PAST_THE_LAST_LABEL, greatest + 1],
    ["2147483647", 2147483647],
    ["-2147483648", LEAST_INTEGER],
  ];
  for (const [label, value] of boundaries) {
    if (!values.includes(value)) labelled.push([label, value]);
  }
  return labelled;
}

/**
 * The cases of the converter `native`, all of group a, each one call with
 * one integer (`converterValues`), labelled by the constants that hold it
 * or by the boundary it is.
 */
export function converterCases(native: ConverterName): ReturnCase[] {
  return converterValues(native).map(([label, value]) => ({
    native,
    label,
    group: "a",
    call: () => converter(native)(value),
  }));
}
