// The case generator of the Nullability sweep's Slice `nullability-filters`
// (#364): the call cases of a Native that returns nothing and takes a
// `filter` the Overlay types nullable (`EnumDestructablesInRect`,
// `EnumItemsInRect`, the `ForceEnum*` and the `GroupEnum*`), which measure
// whether the call takes a `nil` filter, against an always-true one and a
// live one, as `probe/README.md` ("Call cases and the parameter verdict")
// requires.

import type { CallCase } from "./case-runner";

/** The parameter the call cases measure, as the Overlay names it. */
export const FILTER_PARAM = "filter";

/**
 * The two filters a filter Native's cases pass besides `nil`, Fixtures
 * built before the cases.
 * @noSelf
 */
export interface Filters {
  /** A filter that keeps everything: `Filter(() => true)`. */
  readonly alwaysTrue: boolexpr;
  /** A filter that keeps some of what the call enumerates, not all. */
  readonly live: boolexpr;
}

/**
 * The call cases of a filter `native`, all of group a, in this order: an
 * always-true filter (`filter: always-true`), `nil` (`filter: nil`) and a
 * live filter (`filter: live`). `call` calls the Native once with the
 * filter it is given, the other arguments typical, and returns how many
 * `counted` the call enumerated, so the report compares the `nil` count
 * with the always-true one.
 */
export function filterCases(
  native: string,
  counted: string,
  filters: Filters,
  call: (filter: boolexpr | undefined) => number,
): CallCase[] {
  const cases = [
    ["always-true", filters.alwaysTrue],
    ["nil", undefined],
    ["live", filters.live],
  ] as const;
  return cases.map(([argument, value]) => ({
    native,
    label: `${FILTER_PARAM}: ${argument}`,
    group: "a",
    param: FILTER_PARAM,
    argument,
    counted,
    call: () => call(value),
  }));
}
