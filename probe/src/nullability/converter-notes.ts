/**
 * The condensed `notes` of a converter the Nullability sweep found
 * non-null: not its case list, which runs to thousands of characters for a
 * type of many constants, but the measured fact, that every `common.j`
 * constant of its type and each boundary integer gave a handle, and how the
 * handle's id follows from the integer passed in. The fact is checked
 * against the cases before it is worded: a case whose integer the
 * converter table cannot tell, a constant the cases miss, or an id no rule
 * of `ID_RULES` gives, leaves the converter to the report's full text.
 * Pure: the converter table comes in as data.
 */
import type { ConverterConstant } from "./converters.js";
import type { CaseResult } from "./verdict.js";

/**
 * The label of the case of the first integer past the greatest constant,
 * as the converter generator writes it (`PAST_THE_LAST_LABEL` of
 * probes/nullability/converter.ts, which this package's build cannot
 * import): the generators' tests pin that label, and this module's tests
 * pin this one to the same text.
 */
export const PAST_THE_LAST_LABEL = "past the last constant";

/**
 * How a converter's handle id may follow from the integer `i` passed in,
 * each with the words `notes` gives it, checked in this order: the first
 * every case meets is the converter's.
 */
const ID_RULES: readonly (readonly [
  id: (i: number) => number,
  words: string,
])[] = [
  [(i) => i, "the handle's id is the integer passed in"],
  // ConvertMouseButtonType: a bit flag, the shift taken modulo 32 as the
  // game's 32-bit integers take it.
  [
    (i) => 1 << ((i - 1) & 31),
    "the handle's id is the bit flag `1 << ((i - 1) & 31)` of the integer `i` passed in",
  ],
];

/** Words joined as a list: `a`, `a and b`, `a, b and c`. */
function list(words: readonly string[]): string {
  return words.length < 2
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} and ${words.at(-1) ?? ""}`;
}

/**
 * The integer a converter's case passed, from its label as the converter
 * generator writes it: an integer (`-1`, `2147483647`), the first integer
 * past the greatest constant, or the constants that hold it, joined by
 * ` or `; undefined for any other label, or constants of different
 * integers.
 */
function integerOf(
  label: string,
  constants: readonly ConverterConstant[],
): { value: number; constant: boolean } | undefined {
  if (/^-?\d+$/.test(label)) return { value: Number(label), constant: false };
  if (label === PAST_THE_LAST_LABEL) {
    if (constants.length === 0) return undefined;
    const greatest = Math.max(...constants.map(([, value]) => value));
    return { value: greatest + 1, constant: false };
  }
  const values = new Set(
    label
      .split(" or ")
      .map((name) => constants.find(([constant]) => constant === name)?.[1]),
  );
  const [value] = values;
  return values.size === 1 && value !== undefined
    ? { value, constant: true }
    : undefined;
}

/**
 * The condensed `notes` of a converter whose every case returned a handle,
 * from its cases and the `common.j` constants of its type, citing the
 * Patch and the sweep:
 * `Returned a handle for every common.j constant of its type and for
 * <boundaries> (nullability sweep, <Patch>); <id rule>. Evidence, not
 * proof.`, or, for a type with no constant,
 * `Returned a handle for <integers>, its type having no common.j constant
 * (nullability sweep, <Patch>); <id rule>. Evidence, not proof.` A handle
 * of id 0 needs no sentence of its own: the id rule gives it. Undefined
 * when a case gave anything but a handle, a label is not one the converter
 * generator writes, a constant's integer was not passed, or no rule of
 * `ID_RULES` gives every id.
 */
export function converterNotes(
  cases: readonly CaseResult[],
  constants: readonly ConverterConstant[],
  patch: string,
): string | undefined {
  const passed = cases.map((testCase) => ({
    testCase,
    integer: integerOf(testCase.label, constants),
  }));
  if (
    passed.length === 0 ||
    passed.some(
      ({ testCase, integer }) =>
        testCase.outcome !== "handle" || integer === undefined,
    )
  ) {
    return undefined;
  }
  const values = new Set(passed.map(({ integer }) => integer?.value));
  if (constants.some(([, value]) => !values.has(value))) return undefined;
  const rule = ID_RULES.find(([id]) =>
    passed.every(
      ({ testCase, integer }) =>
        integer !== undefined && testCase.id === String(id(integer.value)),
    ),
  );
  if (rule === undefined) return undefined;
  const sweep = `(nullability sweep, ${patch})`;
  const others = passed
    .filter(({ integer }) => integer?.constant === false)
    .map(({ testCase }) => testCase.label);
  const handles =
    constants.length === 0
      ? `for ${list(others)}, its type having no common.j constant ${sweep}`
      : `for every common.j constant of its type${others.length === 0 ? "" : ` and for ${list(others)}`} ${sweep}`;
  return `Returned a handle ${handles}; ${rule[1]}. Evidence, not proof.`;
}
