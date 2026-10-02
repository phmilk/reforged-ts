// A Probe of the Lua tests only, never of probe/probes: a small case list
// for the Nullability sweep's case runner, whose cases call stand-in
// Natives the test defines before the runner's timer fires
// (../nullability-cases.test.ts). The global setup builds it with the
// bridge fixtures' runId as the module `nullability-cases_bundle`.

import type { ProbeContext } from "../../../game/probe";
import { runCases, type Case } from "../../../probes/nullability/case-runner";

/** A stand-in Native that returns a stub handle, a timer. */
declare function StandInHandle(): handle;

/** A stand-in Native that returns nothing. */
declare function StandInNil(): handle | undefined;

/** A stand-in Native that raises an error. */
declare function StandInRaise(): handle;

/** A stand-in Native that returns the frame stub's id-0 "not found" frame. */
declare function StandInNotFound(): handle;

/** A stand-in Native that returns a number. */
declare function StandInNumber(): handle;

/**
 * A stand-in Native that returns a stub handle and keeps the Result file as
 * it is on disk when it is called.
 */
declare function StandInSnapshot(): handle;

/** The cases, in the order they run: each outcome, a skipped case and a checkpointed one. */
const CASES: readonly Case[] = [
  {
    native: "StandInHandle",
    label: "live handle",
    group: "a",
    call: () => StandInHandle(),
  },
  {
    native: "StandInNumber",
    label: "a number",
    group: "a",
    call: () => StandInNumber(),
  },
  {
    native: "StandInNil",
    label: "removed unit",
    group: "b",
    call: () => StandInNil(),
  },
  {
    native: "StandInRaise",
    label: "raising call",
    group: "b",
    call: () => StandInRaise(),
  },
  {
    native: "StandInNotFound",
    label: "not found frame",
    group: "b",
    call: () => StandInNotFound(),
  },
  {
    native: "StandInHandle",
    label: "crashing call",
    group: "b",
    call: () => StandInHandle(),
  },
  {
    native: "StandInSnapshot",
    label: "risky call",
    group: "b",
    call: () => StandInSnapshot(),
    checkpoint: true,
  },
];

/** The harness's stub handles: tables with a handle id, not userdata. */
function isStubHandle(value: unknown): boolean {
  return (
    type(value) === "table" &&
    (value as { __handleId?: unknown }).__handleId !== undefined
  );
}

export function run(p: ProbeContext): void {
  runCases(p, CASES, {
    skip: ["StandInHandle crashing call"],
    isHandle: isStubHandle,
  });
}
