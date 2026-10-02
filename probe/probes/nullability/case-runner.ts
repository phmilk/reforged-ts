// The Nullability sweep's case runner, shared by every Slice: runs a Slice's
// case list in order, each case after its PENDING line and under `pcall`,
// and records what the Native returned as one CALL record, which
// `probe:nullability-report` reads back (src/nullability/). It reaches the
// Result file through the runner's `p` only, and the game through Natives
// only, never the library, so no Wrapper hides the `nil` being measured. A
// Slice's Probe holds its own case list; this module holds no case.

import type { ProbeContext } from "../../game/probe";

/**
 * The group of a case: `a` for live arguments, odd but well-typed ones
 * included; `b` for stale handles, arguments whose object is dead, removed
 * or destroyed. A Slice lists every `a` case before any `b` case.
 */
export type CaseGroup = "a" | "b";

/**
 * One case of a Slice: one direct call of one Native with arguments in a
 * known state.
 * @noSelf
 */
export interface Case {
  /** The Native called, as the Typings name it: `CreateTimer`. */
  readonly native: string;
  /**
   * What the case calls it with, a short English phrase that reads well in
   * the report and in a proposed `notes` text: `removed unit`.
   */
  readonly label: string;
  readonly group: CaseGroup;
  /** Calls the Native once and returns what it returned; called under `pcall`. */
  readonly call: () => unknown;
}

/**
 * What a case's call returned, as its CALL record holds it: the `outcome`
 * and the fields that go with it, `id` (from `GetHandleId`) and `type`
 * (from `tostring`) for a `handle`.
 */
type OutcomeFields =
  { outcome: "nil" } | { outcome: "handle"; id: number; type: string };

/** What a call returned, classified: `nil`, or a handle with its id and its `tostring`. */
function classify(value: unknown): OutcomeFields {
  if (value === undefined) return { outcome: "nil" };
  const handle = value as handle;
  return { outcome: "handle", id: GetHandleId(handle), type: tostring(handle) };
}

/**
 * Runs one case: the line `PENDING label=<native> <case>`, so a crash in
 * the call names the case, then the call under `pcall`, then the record
 * `CALL case=<label> group=<group> native=<native> outcome=<outcome>`, with
 * `id` and `type` on a `handle`. An error the call raises is raised again,
 * which fails the Probe run with its message.
 */
function runCase(p: ProbeContext, testCase: Case): void {
  p.pending(`${testCase.native} ${testCase.label}`);
  const [ok, value] = pcall(testCase.call);
  if (!ok) {
    error(value, 0);
  }
  p.record("CALL", {
    native: testCase.native,
    case: testCase.label,
    group: testCase.group,
    ...classify(value),
  });
}

/** Runs each case of `cases`, in order (`runCase`). */
export function runCases(p: ProbeContext, cases: readonly Case[]): void {
  for (const testCase of cases) {
    runCase(p, testCase);
  }
}
