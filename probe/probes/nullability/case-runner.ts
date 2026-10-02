// The Nullability sweep's case runner, shared by every Slice: records a
// Slice's case list up front, then runs it in order, each case after its
// PENDING line and under `pcall`, and records what the Native returned as
// one CALL record, or one SKIP record for a case of the skip list, which
// `probe:nullability-report` reads back (src/nullability/). It reaches the
// Result file through the runner's `p` only, and the game through Natives
// only, never the library, so no Wrapper hides the `nil` being measured. A
// Slice's Probe holds its own case list and skip list; this module holds
// no case.

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
   * the report and in a proposed `notes` text: `removed unit`. Unique among
   * the Native's cases.
   */
  readonly label: string;
  readonly group: CaseGroup;
  /** Calls the Native once and returns what it returned; called under `pcall`. */
  readonly call: () => unknown;
  /**
   * Puts every line on disk right before the call, the case's PENDING line
   * included, so a crash in the call keeps every result before it and names
   * the case. A Slice sets it on its first `b` case, which ends the `a`
   * group, and on each risky `b` case.
   */
  readonly checkpoint?: true;
}

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

/**
 * What a case's call gave, as its CALL record holds it: the `outcome` and
 * the fields that go with it, `id` (from `GetHandleId`) and `type` (from
 * `tostring`) for a `handle`, `type` for an `odd` value, `message` for an
 * `error`.
 */
type OutcomeFields =
  | { outcome: "nil" }
  | { outcome: "handle"; id: number; type: string }
  | { outcome: "odd"; type: string }
  | { outcome: "error"; message: string };

/** A value as `tostring` gives it, or a description when `tostring` fails. */
function describe(value: unknown): string {
  const [ok, text] = pcall(tostring, value);
  return ok ? text : `a ${type(value)} whose tostring failed`;
}

/**
 * The message of what a call raised: `<name>: <message>` for an Error
 * thrown from TypeScript, whose `__tostring` reads the `debug` library the
 * game does not have (as the runner's `errorMessage` does), else what
 * `describe` gives.
 */
function errorText(raised: unknown): string {
  if (type(raised) === "table") {
    const { name, message } = raised as { name?: unknown; message?: unknown };
    if (typeof name === "string" && typeof message === "string") {
      return message === "" ? name : `${name}: ${message}`;
    }
  }
  return describe(raised);
}

/** A handle in the game: a userdata. */
function isUserdata(value: unknown): boolean {
  return type(value) === "userdata";
}

/**
 * What a call returned, classified: `nil`; a `handle` with its id and its
 * `tostring`; or `odd`, a disguised null or no handle at all: a handle
 * whose id is 0, or any value that is neither `nil` nor a handle.
 */
function classify(
  value: unknown,
  isHandle: (value: unknown) => boolean,
): OutcomeFields {
  if (value === undefined) return { outcome: "nil" };
  if (!isHandle(value)) return { outcome: "odd", type: describe(value) };
  const id = GetHandleId(value as handle);
  return id === 0
    ? { outcome: "odd", type: describe(value) }
    : { outcome: "handle", id, type: describe(value) };
}

/** The PENDING label of a case, which names it in a skip list. */
function pendingLabel(testCase: Case): string {
  return `${testCase.native} ${testCase.label}`;
}

/** The fields that name a case in its CASE, CALL and SKIP records. */
function caseFields(testCase: Case) {
  return {
    native: testCase.native,
    case: testCase.label,
    group: testCase.group,
  };
}

/**
 * Runs one case: the line `PENDING label=<native> <case>`, a checkpoint
 * when the case asks for one, then the call under `pcall`, then the record
 * `CALL case=<label> group=<group> native=<native> outcome=<outcome>`, with
 * the outcome's fields.
 */
function runCase(
  p: ProbeContext,
  testCase: Case,
  isHandle: (value: unknown) => boolean,
): void {
  p.pending(pendingLabel(testCase));
  if (testCase.checkpoint) p.checkpoint();
  const [ok, value] = pcall(testCase.call);
  p.record("CALL", {
    ...caseFields(testCase),
    ...(ok
      ? classify(value, isHandle)
      : { outcome: "error", message: errorText(value) }),
  });
}

/**
 * Runs a Slice's whole case list. First one record
 * `CASE case=<label> group=<group> native=<native>` per case, in order, so
 * the report lists the cases a crash left unrun; then each case in order
 * (`runCase`), except a case of `options.skip`, which is not called and
 * gets the record `SKIP case=<label> group=<group> native=<native>
 * reason=crashed` in its place. Two cases with one PENDING label, or a
 * skip label that names no case, fail the run before any case runs.
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
    p.record("CASE", caseFields(testCase));
  }
  for (const testCase of cases) {
    if (skip.has(pendingLabel(testCase))) {
      p.record("SKIP", { ...caseFields(testCase), reason: "crashed" });
    } else {
      runCase(p, testCase, isHandle);
    }
  }
}
