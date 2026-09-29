/** @noSelfInFile */

// The `boolexpr` a Wrapper member hands a filtering Native when the Map
// project gave a plain function: through `Filter`, the function first going
// through the protection step. A `boolexpr` the Map project built itself
// passes unchanged. (`Trigger.addCondition`, the one member taking a
// condition, builds its `Condition` itself: it adds the damage nesting.)
//
// Package-internal but for `BoolexprInput`, which `Trigger.addCondition`'s
// signature names.

import { protect } from "../reforged/protect";
import type { Handle } from "./handle";

/** A filter or a condition: a `boolexpr`, or a plain function returning a boolean. */
export type BoolexprInput = boolexpr | (() => boolean);

/**
 * The filter a registration or enumeration member hands its Native: a
 * function goes through `Filter`, protected as `member` of `owner` and
 * excluding its candidate when it throws in Dev mode.
 * @param owner - The Wrapper whose member takes the filter, named in a
 * failure report.
 * @param member - The member's name, such as `Group.enumUnitsInRect`.
 * @param filter - The filter the Map project gave, if any.
 * @returns A new `filterfunc` for a function, `filter` itself for a
 * `boolexpr`, or `undefined` when no filter was given.
 * @native Filter
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
