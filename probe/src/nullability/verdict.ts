/**
 * The Nullability sweep's conclusions about one Native: the outcome of each
 * of its cases, as the case runner recorded it, gives the Native a verdict;
 * the verdict is compared with the Overlay's `returns.nullable` and gives a
 * proposed `notes` text. Pure: no file is read here.
 */

/** The group of a case: `a` for live arguments, `b` for stale handles. */
export type CaseGroup = "a" | "b";

/**
 * What a case gave: what its call returned, as its CALL record says
 * (`handle`, `nil`, `odd`, or `error` when it raised); `crashed` for a case
 * that crashed the game, in this run (the trailing PENDING) or in an
 * earlier one (its SKIP record); `not run` for a case after a crash.
 */
export type Outcome =
  "handle" | "nil" | "odd" | "error" | "crashed" | "not run";

/** One case of a Native, as the Probe run recorded it. */
export interface CaseResult {
  /** The case's label, a short English phrase: `removed unit`. */
  label: string;
  group: CaseGroup;
  outcome: Outcome;
  /** The handle's id (`GetHandleId`), on a `handle`. */
  id?: string;
  /** The value's `tostring`, on a `handle` or an `odd`. */
  type?: string;
  /**
   * What the call raised, on an `error`; how the case crashed, on a
   * `crashed`.
   */
  message?: string;
}

/** A Native's verdict, from its cases. */
export type Verdict =
  "nullable (proved)" | "unsafe" | "review" | "non-null (evidence)";

/** Whether a case gave one of `outcomes`. */
function gave(...outcomes: readonly Outcome[]) {
  return ({ outcome }: CaseResult) => outcomes.includes(outcome);
}

/**
 * The verdicts, checked in this order, each with the condition its cases
 * meet: the first that holds is the Native's, so a `nil` is proof whatever
 * the other cases gave, a crash, a skip or an error makes the Native
 * unsafe, and an odd value is reviewed.
 */
const VERDICTS: readonly (readonly [
  verdict: Verdict,
  holds: (cases: readonly CaseResult[]) => boolean,
])[] = [
  ["nullable (proved)", (cases) => cases.some(gave("nil"))],
  ["unsafe", (cases) => cases.some(gave("crashed", "error"))],
  // A case left unrun by a crash leaves the evidence short of every case.
  ["review", (cases) => cases.some(gave("odd", "not run"))],
  ["non-null (evidence)", (cases) => cases.every(gave("handle"))],
];

/** The verdict of a Native from its cases, the first of `VERDICTS` that holds. */
export function verdictOf(cases: readonly CaseResult[]): Verdict {
  const found = VERDICTS.find(([, holds]) => holds(cases));
  if (found === undefined) {
    throw new Error(
      `No verdict holds for the outcomes ${cases.map(({ outcome }) => outcome).join(", ")}.`,
    );
  }
  return found[0];
}

/** How a verdict stands against the Overlay's `returns.nullable`. */
export type Comparison = "mismatch" | "consistent";

/**
 * `mismatch` when the Overlay says the Native never returns nothing and
 * the verdict proves it does; `consistent` otherwise.
 */
export function compare(
  verdict: Verdict,
  overlayNullable: boolean,
): Comparison {
  return !overlayNullable && verdict === "nullable (proved)"
    ? "mismatch"
    : "consistent";
}

/**
 * The `notes` text proposed for the Native's Overlay entry, citing the
 * Patch the Probe was built against and the sweep, never an issue number,
 * since `notes` is published as `@remarks`: the cases that returned
 * nothing for `nullable (proved)`, every case for `non-null (evidence)`,
 * their labels joined with commas. `unsafe` and `review` get no text, only
 * "review", so no unchecked text reaches `@remarks`.
 */
export function proposedNotes(
  verdict: Verdict,
  cases: readonly CaseResult[],
  patch: string,
): string {
  const labels = (selected: readonly CaseResult[]) =>
    selected.map(({ label }) => label).join(", ");
  if (verdict === "nullable (proved)") {
    const nil = cases.filter(gave("nil"));
    return `Returns nothing for ${labels(nil)} (nullability sweep, ${patch}).`;
  }
  if (verdict === "non-null (evidence)") {
    return `Returned a handle in every case of the nullability sweep (${labels(cases)}) on ${patch}; evidence, not proof.`;
  }
  return "review";
}
