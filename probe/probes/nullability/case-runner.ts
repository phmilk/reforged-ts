// The Nullability sweep's case runner, shared by every Slice: records a
// Slice's case list up front, then runs it in order, each case after its
// PENDING line and a checkpoint and under `pcall`, and records what the
// Native returned, or for a call case whether the call completed and the
// count it reports, as one CALL record, or one SKIP record for a case of the
// skip list, which `probe:nullability-report` reads back
// (src/nullability/). The records' format is ./records.d.ts. It reaches the
// Result file through the runner's `p` only, and the game through Natives
// only, never the library, so no Wrapper hides the `nil` being measured. A
// Slice's Probe holds its own case list and skip list; this module holds
// no case.

import { describe, errorMessage } from "../../game/errors";
import type { ProbeContext } from "../../game/probe";
import type {
  CallArgument,
  CallCaseFields,
  CallFields,
  CaseFields,
  CaseGroup,
  PendingLabel,
  SkipFields,
} from "./records";

/**
 * A return case of a Slice: one direct call of one Native with arguments in
 * a known state, recording what it returned.
 * @noSelf
 */
export interface ReturnCase {
  /** The Native called, as the Typings name it: `CreateTimer`. */
  readonly native: string;
  /**
   * What the case calls it with, a short English phrase that reads well in
   * the report and in a proposed `notes` text: `removed unit`. Unique among
   * the Native's cases.
   */
  readonly label: string;
  readonly group: CaseGroup;
  /** Calls the Native once and returns what it returned; called under `pcall`. */
  readonly call: () => unknown;
  /** No parameter: a return case measures the return value. */
  readonly param?: undefined;
}

/**
 * A call case of a Slice: one direct call of a Native that returns nothing,
 * with one parameter given `argument`, recording whether the call completed
 * and the count it reports.
 * @noSelf
 */
export interface CallCase {
  /** The Native called, as the Typings name it: `GroupEnumUnitsInRect`. */
  readonly native: string;
  /**
   * What the case calls it with, as `ReturnCase.label`: `nil filter`.
   * Unique among the Native's cases.
   */
  readonly label: string;
  readonly group: CaseGroup;
  /** The parameter measured, as the Overlay's `params[].name` names it: `filter`. */
  readonly param: string;
  /** What the case passes for `param`. */
  readonly argument: CallArgument;
  /** What `call` counts, singular: `unit`, `player`, `item` or `destructable`. */
  readonly counted: string;
  /**
   * Calls the Native once and returns how many objects the call enumerated,
   * the units of the group it filled, say; called under `pcall`.
   */
  readonly call: () => number;
}

/** One case of a Slice: a return case or a call case. */
export type Case = ReturnCase | CallCase;

/**
 * How `runCases` runs a case list besides the cases.
 * @noSelf
 */
export interface RunOptions {
  /**
   * The cases not to call, each as its PENDING label names it,
   * `<native> <case>`, as `probe:read` prints the pending step of a crashed
   * run: a case that crashed the game in an earlier run. A label that names
   * no case fails the run.
   */
  readonly skip?: readonly string[];
  /**
   * Whether a value a call returned is a handle: a userdata in the game.
   * The harness's stub handles are tables, so its tests pass their own.
   */
  readonly isHandle?: (value: unknown) => boolean;
}

/** A handle in the game: a userdata. */
function isUserdata(value: unknown): boolean {
  return type(value) === "userdata";
}

/**
 * What a call returned, classified: `nil`; a `handle` with its id and its
 * `tostring`, a handle of id 0 included, since it is not `nil`; or
 * `odd`, any value that is neither `nil` nor a handle.
 */
function classify(
  value: unknown,
  isHandle: (value: unknown) => boolean,
): CallFields {
  if (value === undefined) return { outcome: "nil" };
  if (!isHandle(value)) return { outcome: "odd", type: describe(value) };
  const id = GetHandleId(value as handle);
  return { outcome: "handle", id, type: describe(value) };
}

/** The PENDING label of a case, which names it in a skip list. */
function pendingLabel(testCase: Case): PendingLabel {
  return `${testCase.native} ${testCase.label}`;
}

/**
 * What a call case's call returned, which should be its count: `completed`
 * with the count, or an `error` naming what it returned instead, so a case
 * that counts nothing is reviewed.
 */
function completed(value: unknown): CallFields {
  if (type(value) === "number") {
    return { outcome: "completed", count: value as number };
  }
  return {
    outcome: "error",
    message: `The case reported no count: it returned ${describe(value)}.`,
  };
}

/**
 * The fields that name a case in its CASE, CALL and SKIP records, a call
 * case's `param`, `argument` and `counted` included.
 */
function caseFields(testCase: Case): CaseFields | CallCaseFields {
  const fields: CaseFields = {
    native: testCase.native,
    case: testCase.label,
    group: testCase.group,
  };
  if (testCase.param === undefined) return fields;
  return {
    ...fields,
    param: testCase.param,
    argument: testCase.argument,
    counted: testCase.counted,
  };
}

/**
 * Runs one case: the line `PENDING label=<native> <case>`, a checkpoint,
 * so a crash in the call leaves that line last on disk and names the case,
 * then the call under `pcall`, then the record
 * `CALL case=<label> group=<group> native=<native> outcome=<outcome>`, with
 * the case's call-case fields and the outcome's fields.
 */
function runCase(
  p: ProbeContext,
  testCase: Case,
  isHandle: (value: unknown) => boolean,
): void {
  p.pending(pendingLabel(testCase));
  p.checkpoint();
  const [ok, value] = pcall(testCase.call);
  let outcome: CallFields;
  if (!ok) outcome = { outcome: "error", message: errorMessage(value) };
  else if (testCase.param === undefined) outcome = classify(value, isHandle);
  else outcome = completed(value);
  p.record("CALL", { ...caseFields(testCase), ...outcome });
}

/**
 * Runs a Slice's whole case list, return cases and call cases alike. First
 * one record `CASE case=<label> group=<group> native=<native>` per case,
 * with a call case's `argument`, `counted` and `param`, in order, so
 * the report lists the cases a crash left unrun, and a checkpoint; then
 * each case in order (`runCase`), except a case of `options.skip`, which
 * is not called and gets the record `SKIP case=<label> group=<group>
 * native=<native> reason=crashed` in its place, and a checkpoint. So the
 * last PENDING line on disk is always the case a crash stopped in, with
 * every result before it. Two cases with one PENDING label, or a skip
 * label that names no case, fail the run before any case runs.
 */
export function runCases(
  p: ProbeContext,
  cases: readonly Case[],
  options: RunOptions = {},
): void {
  const labels = new Set<string>();
  for (const testCase of cases) {
    const label = pendingLabel(testCase);
    if (labels.has(label)) {
      error(`Two cases are labelled "${label}".`, 0);
    }
    labels.add(label);
  }
  const skip = new Set(options.skip ?? []);
  for (const label of skip) {
    if (!labels.has(label)) {
      error(`The skip list names "${label}", which is no case.`, 0);
    }
  }
  const isHandle = options.isHandle ?? isUserdata;
  for (const testCase of cases) {
    p.record("CASE", { ...caseFields(testCase) });
  }
  p.checkpoint();
  for (const testCase of cases) {
    if (skip.has(pendingLabel(testCase))) {
      const skipped: SkipFields = { reason: "crashed" };
      p.record("SKIP", { ...caseFields(testCase), ...skipped });
      p.checkpoint();
    } else {
      runCase(p, testCase, isHandle);
    }
  }
}
