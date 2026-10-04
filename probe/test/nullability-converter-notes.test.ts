// The condensed notes of a converter the Nullability sweep found non-null
// (src/nullability/converter-notes.ts): the measured fact, worded only when
// the cases check out against the converter table.

import { describe, expect, it } from "vitest";
import {
  converterNotes,
  PAST_THE_LAST_LABEL,
} from "../src/nullability/converter-notes.js";
import type { ConverterConstant } from "../src/nullability/converters.js";
import type { CaseResult } from "../src/nullability/verdict.js";

const PATCH = "3.0.0.12345";

/** Constants of a type, two sharing an integer, one of integer 0. */
const RACE: readonly ConverterConstant[] = [
  ["RACE_NONE", 0],
  ["RACE_HUMAN", 1],
  ["RACE_ORC", 2],
  ["RACE_GREEN", 2],
];

/** A case that gave a handle of `id`. */
function handle(label: string, id: number): CaseResult {
  return { label, group: "a", outcome: "handle", id: String(id) };
}

/**
 * The cases the converter generator expands from `RACE`, each giving the
 * id of `idOf` for the integer passed in.
 */
function raceCases(idOf: (i: number) => number = (i) => i): CaseResult[] {
  return (
    [
      ["RACE_NONE", 0],
      ["RACE_HUMAN", 1],
      ["RACE_ORC or RACE_GREEN", 2],
      ["-1", -1],
      [PAST_THE_LAST_LABEL, 3],
      ["2147483647", 2147483647],
      ["-2147483648", -2147483648],
    ] as const
  ).map(([label, i]) => handle(label, idOf(i)));
}

describe("the condensed converter notes", () => {
  it("words the measured fact: every constant, the boundaries and the id rule, with no sentence for an id of 0", () => {
    expect(converterNotes(raceCases(), RACE, PATCH)).toBe(
      "Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
    );
  });

  it("names the integers of a type with no constant", () => {
    const cases = [0, 1, -1, 2147483647].map((i) => handle(String(i), i));
    expect(converterNotes(cases, [], PATCH)).toBe(
      "Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
    );
  });

  it("names the bit flag of a converter whose id is one, as ConvertMouseButtonType's", () => {
    expect(
      converterNotes(
        raceCases((i) => 1 << ((i - 1) & 31)),
        RACE,
        PATCH,
      ),
    ).toBe(
      "Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.12345); the handle's id is the bit flag `1 << ((i - 1) & 31)` of the integer `i` passed in. Evidence, not proof.",
    );
  });

  it("names no boundary a constant holds", () => {
    const constants: readonly ConverterConstant[] = [["LIMIT_NONE", -1]];
    const cases = [handle("LIMIT_NONE", -1), handle(PAST_THE_LAST_LABEL, 0)];
    expect(converterNotes(cases, constants, PATCH)).toBe(
      "Returned a handle for every common.j constant of its type and for past the last constant (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
    );
    expect(converterNotes([handle("LIMIT_NONE", -1)], constants, PATCH)).toBe(
      "Returned a handle for every common.j constant of its type (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
    );
  });

  it("leaves the converter to the full text when its cases do not check out", () => {
    const cases = raceCases();
    // A constant the cases miss.
    expect(
      converterNotes(
        cases.filter(({ label }) => label !== "RACE_HUMAN"),
        RACE,
        PATCH,
      ),
    ).toBeUndefined();
    // An id no rule gives.
    expect(
      converterNotes(
        cases.map((testCase) =>
          testCase.label === "-1" ? { ...testCase, id: "7" } : testCase,
        ),
        RACE,
        PATCH,
      ),
    ).toBeUndefined();
    // A label the converter generator never writes, or constants of two integers.
    expect(
      converterNotes([...cases, handle("typical arguments", 1)], RACE, PATCH),
    ).toBeUndefined();
    expect(
      converterNotes(
        [...cases, handle("RACE_HUMAN or RACE_ORC", 1)],
        RACE,
        PATCH,
      ),
    ).toBeUndefined();
    // A case that gave anything but a handle, and no case at all.
    expect(
      converterNotes(
        [...cases, { label: "0", group: "a", outcome: "nil" }],
        RACE,
        PATCH,
      ),
    ).toBeUndefined();
    expect(converterNotes([], RACE, PATCH)).toBeUndefined();
    // Past the last constant of a type with none.
    expect(
      converterNotes([handle(PAST_THE_LAST_LABEL, 0)], [], PATCH),
    ).toBeUndefined();
  });

  it("reads the label the converter generator gives the first integer past the greatest constant", () => {
    // test/lua/nullability-generators.test.ts pins the generator's label.
    expect(PAST_THE_LAST_LABEL).toBe("past the last constant");
  });
});
