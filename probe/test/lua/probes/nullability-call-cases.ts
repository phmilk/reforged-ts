// A Probe of the Lua tests only, never of probe/probes: a small case list
// of call cases for the Nullability sweep's case runner, after one return
// case, whose cases call a stand-in Native that returns nothing, defined by
// the test before the runner's timer fires
// (../nullability-call-cases.test.ts). The global setup builds it with the
// bridge fixtures' runId as the module `nullability-call-cases_bundle`.

import type { ProbeContext } from "../../../game/probe";
import { runCases, type Case } from "../../../probes/nullability/case-runner";

/** A stand-in Native that returns nothing, as `GroupEnumUnitsInRect` does. */
declare function StandInEnum(filter: string | undefined): void;

/** A stand-in Native that returns nothing in a return case. */
declare function StandInNil(): handle | undefined;

/**
 * The cases, in the order they run: a return case, then call cases that
 * complete with a count, one on the skip list, one that raises and one
 * that reports no count.
 */
const CASES: readonly Case[] = [
  {
    native: "StandInNil",
    label: "removed unit",
    group: "a",
    call: () => StandInNil(),
  },
  {
    native: "StandInEnum",
    label: "always-true filter",
    group: "a",
    param: "filter",
    argument: "always-true",
    counted: "unit",
    call: () => {
      StandInEnum("always true");
      return 5;
    },
  },
  {
    native: "StandInEnum",
    label: "nil filter",
    group: "a",
    param: "filter",
    argument: "nil",
    counted: "unit",
    call: () => {
      StandInEnum(undefined);
      return 3;
    },
  },
  {
    native: "StandInEnum",
    label: "crashing filter",
    group: "a",
    param: "filter",
    argument: "live",
    counted: "unit",
    call: () => {
      StandInEnum("crashing");
      return 0;
    },
  },
  {
    native: "StandInEnum",
    label: "raising filter",
    group: "b",
    param: "filter",
    argument: "live",
    counted: "unit",
    call: () => {
      StandInEnum("raising");
      return 0;
    },
  },
  {
    native: "StandInEnum",
    label: "no count",
    group: "b",
    param: "filter",
    argument: "nil",
    counted: "unit",
    call: () => {
      StandInEnum(undefined);
      return "one" as unknown as number;
    },
  },
];

export function run(p: ProbeContext): void {
  runCases(p, CASES, { skip: ["StandInEnum crashing filter"] });
}
