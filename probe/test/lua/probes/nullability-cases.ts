// A Probe of the Lua tests only, never of probe/probes: a small case list
// for the Nullability sweep's case runner, whose cases call stand-in
// Natives the test defines before the runner's timer fires
// (../nullability-cases.test.ts). The global setup builds it with the
// bridge fixtures' runId as the module `nullability_cases_bundle`.

import type { ProbeContext } from "../../../game/probe";
import { runCases, type Case } from "../../../probes/nullability/case-runner";

/** A stand-in Native that returns a stub handle, a timer. */
declare function StandInHandle(): handle;

/** A stand-in Native that returns nothing. */
declare function StandInNil(): handle | undefined;

/** The cases, in the order they run: each outcome, then a second handle. */
const CASES: readonly Case[] = [
  {
    native: "StandInHandle",
    label: "live handle",
    group: "a",
    call: () => StandInHandle(),
  },
  {
    native: "StandInNil",
    label: "removed unit",
    group: "b",
    call: () => StandInNil(),
  },
  {
    native: "StandInHandle",
    label: "second call",
    group: "b",
    call: () => StandInHandle(),
  },
];

export function run(p: ProbeContext): void {
  runCases(p, CASES);
}
