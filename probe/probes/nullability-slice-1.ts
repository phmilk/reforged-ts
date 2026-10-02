// The Nullability sweep's first Slice: calls the handle-returning Natives
// whose Overlay entry says they never return nothing (`returns.nullable:
// false`), each directly through the Typings, in hand-listed cases, and
// records what each call returned (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-slice-1` turns its Result file
// into this Slice's section of the sweep report. Every case is listed here,
// to be read and reviewed without running anything.

import type { ProbeContext } from "../game/probe";
import { runCases, type Case } from "./nullability/case-runner";

/** The cases, in the order they run. */
const CASES: readonly Case[] = [
  {
    native: "CreateTimer",
    label: "one call",
    group: "a",
    call: () => CreateTimer(),
  },
];

export function run(p: ProbeContext): void {
  runCases(p, CASES);
}
