/** @noSelfInFile */

// The `boolexpr` a Wrapper member hands a Native when the Map project gave a
// plain function: through `Condition` for a trigger condition, through
// `Filter` for a filter, the function first going through the protection
// step. A `boolexpr` the Map project built itself passes unchanged.
//
// Package-internal: nothing here is exported from the library index.

import { protect } from "../reforged/protect";
import type { Handle } from "./handle";

/** A condition or filter: a `boolexpr`, or a plain function. */
export type BoolexprInput = boolexpr | (() => boolean);

/**
 * The condition `Trigger.addCondition` hands `TriggerAddCondition`: a
 * function goes through `Condition`, protected as `member` of `owner` and
 * evaluating false when it throws in Dev mode, then through `around` (the
 * Trigger's damage nesting), outside the protection, so what `around` wraps
 * never throws.
 */
export function conditionOf(
  owner: Handle<handle>,
  member: string,
  condition: BoolexprInput,
  around: (protectedCondition: () => boolean) => () => boolean = (fn) => fn,
): boolexpr {
  return typeof condition === "function"
    ? Condition(around(protect(owner, member, condition, false)))
    : condition;
}

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
