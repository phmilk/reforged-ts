// The records of the Nullability sweep's case runner, `CASE`, `CALL` and
// `SKIP`, and the PENDING label of a case: the format the case runner
// (./case-runner.ts) writes and the report (../../src/nullability/) reads.
// Types only, so the game side and the Node side both import them, with no
// `require` in a bundle and no file outside the Node side's sources to
// compile.

/**
 * The group of a case: `a` for live arguments, odd but well-typed ones
 * included; `b` for stale handles, arguments whose object is dead, removed
 * or destroyed. A Slice lists every `a` case before any `b` case.
 */
export type CaseGroup = "a" | "b";

/** The fields that name a case in its `CASE`, `CALL` and `SKIP` records. */
export interface CaseFields {
  /** The Native called, as the Typings name it: `CreateTimer`. */
  native: string;
  /** The case's label, a short English phrase: `removed unit`. */
  case: string;
  group: CaseGroup;
}

/**
 * What a case's call gave, as its `CALL` record holds it: the `outcome` and
 * the fields that go with it, `id` (from `GetHandleId`, 0 for a handle the
 * game hands back in place of nothing) and `type` (from `tostring`) for a
 * `handle`, `type` for an `odd` value, one that is no handle at all,
 * `message` for an `error`.
 */
export type CallFields =
  | { outcome: "nil" }
  | { outcome: "handle"; id: number; type: string }
  | { outcome: "odd"; type: string }
  | { outcome: "error"; message: string };

/** The outcome of a `CALL` record. */
export type CallOutcome = CallFields["outcome"];

/** The fields of a `SKIP` record besides the case's: why it was not called. */
export interface SkipFields {
  reason: "crashed";
}

/**
 * The label of a case's `PENDING` line, `<native> <case>`, which names it
 * in a skip list and in the pending step `probe:read` prints.
 */
export type PendingLabel = `${string} ${string}`;
