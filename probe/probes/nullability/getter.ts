// The case generators of the enum-getter and intrinsic-property families of
// the Nullability sweep: from a Slice's declaration of a Native's
// parameters (./parameters.ts), each handle parameter live and in every
// stale state, a player parameter as a user slot, an empty slot and a
// neutral player, and a numeric parameter through the constructor's odd
// values, as `probe/README.md` ("The cases per family") requires.

import type { ReturnCase } from "./case-runner";
import { NUMERIC_ODD_VALUES } from "./constructor";
import { expandCases } from "./expand";
import { emptySlotPlayer, neutralPassivePlayer } from "./fixtures";
import type { Param, ParamValues, Variant } from "./parameters";

/**
 * A player parameter's empty slot and neutral player, Fixtures built here,
 * before the cases run, and only for a getter; a numeric parameter's odd
 * values, the constructor's; nothing for any other kind, a rawcode or a
 * string included.
 */
function liveValues(param: Param<unknown>): readonly Variant<unknown>[] {
  switch (param.kind) {
    case "player":
      return [
        ["empty slot", emptySlotPlayer()],
        ["neutral player", neutralPassivePlayer()],
      ];
    case "numeric":
      return NUMERIC_ODD_VALUES;
    default:
      return [];
  }
}

/**
 * The cases of a getter: one call with every parameter live, a player as
 * `Player(0)` (`typical arguments`), or `one call` with no parameter; per
 * player parameter, an empty slot and a neutral player; per numeric
 * parameter, `0`, a negative, a coordinate outside the world and
 * `2147483647` (group a); each
 * handle parameter in every stale state it declares (group b). One value
 * varies at a time, the others typical; labels are `<param>: <phrase>`.
 */
function getterCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): ReturnCase[] {
  return expandCases(native, params, call, liveValues);
}

/** The cases of an enum-getter `native`, by the getters' rule (`getterCases`). */
export function enumGetterCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): ReturnCase[] {
  return getterCases(native, params, call);
}

/** The cases of an intrinsic-property `native`, by the getters' rule (`getterCases`). */
export function intrinsicPropertyCases<
  const P extends readonly Param<unknown>[],
>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): ReturnCase[] {
  return getterCases(native, params, call);
}
