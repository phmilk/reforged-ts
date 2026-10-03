// The case generators of the enum-getter and intrinsic-property families of
// the Nullability sweep: from a Slice's declaration of a Native's
// parameters (./parameters.ts), each handle parameter live and in every
// stale state, and a player parameter as a user slot, an empty slot and a
// neutral player, as `probe/README.md` ("The cases per family") requires.

import type { Case } from "./case-runner";
import { expandCases } from "./expand";
import { emptySlotPlayer, neutralPassivePlayer } from "./fixtures";
import type { Param, ParamValues, Variant } from "./parameters";

/**
 * A player parameter's empty slot and neutral player, Fixtures built here,
 * before the cases run, and only for a getter; nothing for any other kind.
 */
function liveValues(param: Param<unknown>): readonly Variant<unknown>[] {
  if (param.kind !== "player") return [];
  return [
    ["empty slot", emptySlotPlayer()],
    ["neutral player", neutralPassivePlayer()],
  ];
}

/** Each stale state a parameter declares. */
function staleStates(param: Param<unknown>): readonly Variant<unknown>[] {
  return param.stale;
}

/**
 * The cases of a getter: one call with every parameter live, a player as
 * `Player(0)` (`typical arguments`), or `one call` with no parameter; per
 * player parameter, an empty slot and a neutral player (group a); each
 * handle parameter in every stale state it declares (group b). One value
 * varies at a time, the others typical; labels are `<param>: <phrase>`.
 */
function getterCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): Case[] {
  return expandCases(native, params, call, liveValues, staleStates);
}

/** The cases of an enum-getter `native`, by the getters' rule (`getterCases`). */
export function enumGetterCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
): Case[] {
  return getterCases(native, params, call);
}

/** The cases of an intrinsic-property `native`, by the getters' rule (`getterCases`). */
export function intrinsicPropertyCases<
  const P extends readonly Param<unknown>[],
>(native: string, params: P, call: (args: ParamValues<P>) => unknown): Case[] {
  return getterCases(native, params, call);
}
