// The case generators of the constructor and registration families of the
// Nullability sweep: from a Slice's declaration of a Native's parameters
// (./parameters.ts), its typical arguments and which integers are
// rawcodes, the cases `probe/README.md` ("The cases per family") requires,
// one odd value at a time.

import type { ReturnCase } from "./case-runner";
import { expandCases } from "./expand";
import type { Param, ParamValues, Variant } from "./parameters";

/** A coordinate outside the world of any map: far past `GetWorldBounds()`. */
export const OUTSIDE_THE_WORLD = 1000000;

/** A rawcode no object type has: `'zzzz'`. */
export const UNKNOWN_RAWCODE = 0x7a7a7a7a;

/** A name no object, label or file has. */
export const UNKNOWN_NAME = "ReforgedTsUnknownName";

/**
 * The odd values of a numeric parameter, an integer or a real: `0`, a
 * negative (`-1`), a coordinate outside the world and `2147483647`. The
 * constructor's rule runs them, and the getters' rule too (./getter.ts).
 */
export const NUMERIC_ODD_VALUES: readonly Variant<number>[] = [
  ["0", 0],
  ["negative", -1],
  ["outside the world", OUTSIDE_THE_WORLD],
  ["2147483647", 2147483647],
];

/**
 * The odd values of a parameter by the constructor's rule: a numeric
 * parameter's (`NUMERIC_ODD_VALUES`); a rawcode's unknown rawcode; a
 * string's `""` and an unknown name. Any other kind has none.
 */
function oddValues(param: Param<unknown>): readonly Variant<unknown>[] {
  switch (param.kind) {
    case "numeric":
      return NUMERIC_ODD_VALUES;
    case "rawcode":
      return [["unknown rawcode", UNKNOWN_RAWCODE]];
    case "string":
      return [
        ["empty string", ""],
        ["unknown name", UNKNOWN_NAME],
      ];
    default:
      return [];
  }
}

/**
 * The cases of a constructor `native`, which `call` calls with one tuple of
 * arguments in the order of `params`: one call with typical arguments, or
 * `one call` with no parameter; per numeric parameter, `0`, a negative, a
 * coordinate outside the world and `2147483647`; per rawcode parameter, an
 * unknown rawcode; per string parameter, `""` and an unknown name (group
 * a); each handle parameter in every stale state it declares (group b).
 * One value varies at a time, the others typical; labels are
 * `typical arguments` and `<param>: <phrase>`.
 */
export function constructorCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): ReturnCase[] {
  return expandCases(native, params, call, oddValues);
}

/**
 * The cases of a registration `native`: the constructor's cases, the
 * trigger destroyed among them, from its `trigger` parameter, plus `nil`
 * for each `filter` parameter (`<param>: nil`, group a). A declaration
 * without a `trigger` parameter fails the run.
 */
export function registrationCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): ReturnCase[] {
  if (!params.some((param) => param.kind === "trigger")) {
    error(`${native}: a registration declares its trigger parameter.`, 0);
  }
  const live = (param: Param<unknown>): readonly Variant<unknown>[] =>
    param.kind === "filter" ? [["nil", undefined]] : oddValues(param);
  return expandCases(native, params, call, live);
}

/**
 * A catalogue case of a constructor or registration `native`, beyond the
 * family's rule: one live argument the rule cannot reach, since it varies
 * no `fixed` parameter and runs no other live object, that the
 * handle-type catalogue (#362), jassdoc or an earlier run of the Slice
 * gives as returning nothing (a unit with no inventory, an empty pool, a
 * boolean set, an event its Native does not list), or another live kind
 * of a parameter's type than its typical one (a destructable or an item
 * for a widget). One case of group a,
 * labelled `<param>: <phrase>` as a generated case; `call` calls the
 * Native with the other arguments typical, over Fixtures built before the
 * cases.
 */
export function catalogueCase(
  native: string,
  param: string,
  phrase: string,
  call: () => unknown,
): ReturnCase[] {
  return [{ native, label: `${param}: ${phrase}`, group: "a", call }];
}
