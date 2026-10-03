// The case generators of the constructor and registration families of the
// Nullability sweep: from a Slice's declaration of a Native's parameters
// (./parameters.ts), its typical arguments and which integers are
// rawcodes, the cases `probe/README.md` ("The cases per family") requires,
// one odd value at a time.

import type { Case } from "./case-runner";
import { expandCases } from "./expand";
import type { Param, ParamValues, Variant } from "./parameters";

/** A coordinate outside the world of any map: far past `GetWorldBounds()`. */
export const OUTSIDE_THE_WORLD = 1000000;

/** A rawcode no object type has: `'zzzz'`. */
export const UNKNOWN_RAWCODE = 0x7a7a7a7a;

/** A name no object, label or file has. */
export const UNKNOWN_NAME = "ReforgedTsUnknownName";

/**
 * The odd values of a parameter by the constructor's rule: a numeric
 * parameter's `0`, a negative (`-1`), a coordinate outside the world and
 * `2147483647`; a rawcode's unknown rawcode; a string's `""` and an
 * unknown name. Any other kind has none.
 */
function oddValues(param: Param<unknown>): readonly Variant<unknown>[] {
  switch (param.kind) {
    case "numeric":
      return [
        ["0", 0],
        ["negative", -1],
        ["outside the world", OUTSIDE_THE_WORLD],
        ["2147483647", 2147483647],
      ];
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

/** Each stale state a parameter declares, a destroyed trigger included. */
function staleStates(param: Param<unknown>): readonly Variant<unknown>[] {
  return param.stale;
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
): Case[] {
  return expandCases(native, params, call, oddValues, staleStates);
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
): Case[] {
  if (!params.some((param) => param.kind === "trigger")) {
    error(`${native}: a registration declares its trigger parameter.`, 0);
  }
  const live = (param: Param<unknown>): readonly Variant<unknown>[] =>
    param.kind === "filter" ? [["nil", undefined]] : oddValues(param);
  return expandCases(native, params, call, live, staleStates);
}
