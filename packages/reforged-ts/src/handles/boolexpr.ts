/** @noSelfInFile */

// The `boolexpr` a Wrapper member hands a filtering Native when the Map
// project gave a plain function: through `Filter`, the function first going
// through the protection step. A `boolexpr` the Map project built itself
// passes unchanged. (`Trigger.addCondition`, the one member taking a
// condition, builds its `Condition` itself: it adds the damage nesting.)
//
// Package-internal: nothing here is exported from the library index.

import { protect } from "../reforged/protect";
import type { Handle } from "./handle";

/** A filter: a `boolexpr`, or a plain function. */
export type BoolexprInput = boolexpr | (() => boolean);

/**
 * The filter a registration or enumeration member hands its Native: a
 * function goes through `Filter`, protected as `member` of `owner` and
 * excluding its candidate when it throws in Dev mode.
 */
export function filterOf(
  owner: Handle<handle>,
  member: string,
  filter: BoolexprInput | undefined,
): boolexpr | undefined {
  return typeof filter === "function"
    ? Filter(protect(owner, member, filter, false))
    : filter;
}
