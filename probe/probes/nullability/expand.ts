// What the Nullability sweep's case generators share: expanding a Native's
// parameter declarations (./parameters.ts) into its cases, one value
// varied at a time and never the cartesian product, and putting a Slice's
// cases in group order.

import type { Case } from "./case-runner";
import type { Param, ParamValues, Variant } from "./parameters";

/** The label of the case of a Native's typical arguments. */
export const TYPICAL_LABEL = "typical arguments";

/** The label of the one case of a Native with no parameter. */
export const ONE_CALL_LABEL = "one call";

/**
 * The cases of `native`, which `call` calls with one tuple of arguments:
 * with no parameter, one call (`one call`); else the typical arguments
 * (`typical arguments`), then, one parameter at a time, the others typical,
 * each value of `live` for that parameter (group a), then each stale state
 * it declares (group b), each labelled `<param>: <phrase>`. A value equal to
 * the parameter's typical one is not run again. Every (a) case comes
 * before any (b) case.
 */
export function expandCases<const P extends readonly Param<unknown>[]>(
  native: string,
  params: P,
  call: (args: ParamValues<P>) => unknown,
  live: (param: Param<unknown>) => readonly Variant<unknown>[],
): Case[] {
  if (params.length === 0) {
    return [
      {
        native,
        label: ONE_CALL_LABEL,
        group: "a",
        call: () => call([] as unknown as ParamValues<P>),
      },
    ];
  }
  const typical = argumentsWith(params, -1, undefined);
  const cases: Case[] = [
    { native, label: TYPICAL_LABEL, group: "a", call: () => call(typical) },
  ];
  const groups = [
    ["a", live],
    ["b", (param: Param<unknown>) => param.stale],
  ] as const;
  for (const [group, variants] of groups) {
    params.forEach((param, index) => {
      for (const [phrase, value] of variants(param)) {
        if (value === param.typical) continue;
        const args = argumentsWith(params, index, value);
        cases.push({
          native,
          label: `${param.name}: ${phrase}`,
          group,
          call: () => call(args),
        });
      }
    });
  }
  return cases;
}

/**
 * The typical value of each parameter, in order, but `value` for the
 * parameter at `index`; `nil` included, so the tuple may have a hole.
 */
function argumentsWith<P extends readonly Param<unknown>[]>(
  params: P,
  index: number,
  value: unknown,
): ParamValues<P> {
  const args: unknown[] = [];
  for (let at = 0; at < params.length; at++) {
    args[at] = at === index ? value : params[at].typical;
  }
  return args as unknown as ParamValues<P>;
}

/**
 * A Slice's case list from each Native's cases, in order, with every (a)
 * case before any (b) case: the (a) cases of each Native in turn, then
 * their (b) cases, so a crash on a stale handle cannot hide a live result.
 */
export function inGroupOrder(...natives: readonly (readonly Case[])[]): Case[] {
  const cases = natives.flat();
  return [
    ...cases.filter((testCase) => testCase.group === "a"),
    ...cases.filter((testCase) => testCase.group === "b"),
  ];
}
