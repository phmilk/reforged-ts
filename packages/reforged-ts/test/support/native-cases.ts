/** @noSelfInFile */

// The table-driven suite of a Wrapper's plain members: one case per Native,
// named by it, so a suite reads against the coverage report's list of the
// Natives it closes. Each case runs its member with the Native answering a
// value the case controls (`withNative`), and asserts the call-log line the
// Native recorded and what the member returned.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { type NativeName, withNative } from "./native-override";

/**
 * One member under test.
 * @noSelf
 */
export interface NativeCase {
  /** The Native the member calls, which names the case. */
  readonly native: string;
  /** Runs the member with the Native answering the case's value. */
  readonly run: () => unknown;
  /** The line the Native records in the call log. */
  readonly line: string;
  /** What the member returns: the answer, a Wrapper, or undefined. */
  readonly returns: unknown;
}

/**
 * A case for the member `member` over the Native `native`, which answers
 * what `answer` returns. `returns` is what the member gives back, by
 * identity; left out, undefined, for a member that returns nothing.
 * @noSelf
 */
export interface NativeCaseOptions<N extends NativeName> {
  readonly native: N;
  readonly answer: Parameters<typeof withNative<N, unknown>>[1];
  readonly member: () => unknown;
  readonly line: string;
  readonly returns?: unknown;
}

/** The case `options` describes, its member run under `withNative`. */
export function nativeCase<N extends NativeName>(
  options: NativeCaseOptions<N>,
): NativeCase {
  return {
    native: options.native,
    run: () => withNative(options.native, options.answer, options.member),
    line: options.line,
    returns: options.returns,
  };
}

/**
 * The suite `title`: one test per case, named by its Native, asserting the
 * line the Native recorded during the member's call and the member's return.
 */
export function describeNatives(
  title: string,
  cases: readonly NativeCase[],
): void {
  describe(title, () => {
    for (const each of cases) {
      it(`${each.native} records ${each.line}`, () => {
        const before = stubCalls().length;
        const result = each.run();
        expect(stubCalls().slice(before)).toContainCall(each.line);
        expect(result).toBe(each.returns);
      });
    }
  });
}
