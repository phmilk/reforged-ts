/**
 * The Nullability sweep's conclusions about one Native: the outcome of each
 * of its return cases, as the case runner recorded it, and its Nullability
 * family, as the Overlay names it, give the Native a verdict; the verdict
 * is compared with the Overlay's `returns.nullable` and gives a proposed
 * `notes` text. The call cases of one parameter of a Native that returns
 * nothing give that parameter a verdict the same way, compared with the
 * Overlay's `params[].nullable`. Pure: no file is read here.
 */
import type {
  CallArgument,
  CallOutcome,
  CaseGroup,
} from "../../probes/nullability/records.js";

/**
 * What a case gave: what its call returned, as its CALL record says
 * (`handle`, `nil`, `odd`, `completed` for a call case, or `error` when it
 * raised); `crashed` for a case that crashed the game, in this run (the
 * trailing PENDING) or in an earlier one (its SKIP record); `not run` for a
 * case after a crash.
 */
export type Outcome = CallOutcome | "crashed" | "not run";

/** One case of a Native, as the Probe run recorded it. */
export interface CaseResult {
  /** The case's label, a short English phrase: `removed unit`. */
  label: string;
  group: CaseGroup;
  outcome: Outcome;
  /** The handle's id (`GetHandleId`), on a `handle`; `0` for a handle of id 0. */
  id?: string;
  /** The value's `tostring`, on a `handle` or an `odd`. */
  type?: string;
  /** The count a call case reported, on a `completed`. */
  count?: string;
  /**
   * `true` on a `crashed` case of the skip list (its SKIP record): a crash
   * the crash loop confirmed. Absent on a case that crashed in this run
   * only.
   */
  skipped?: true;
  /**
   * What the call raised, on an `error`; how the case crashed, on a
   * `crashed`.
   */
  message?: string;
}

/**
 * What a Nullability family allows: its Natives may be typed non-null, or
 * they are nullable by their nature, which `reason` gives as `notes` words
 * it ("outside its event").
 */
export type FamilyRule =
  { mayBeNonNull: true } | { mayBeNonNull: false; reason: string };

/**
 * The Nullability families, as the Overlay's `returns.family` names them,
 * each keyed once with its rule. The same families as
 * `NULLABILITY_FAMILIES` in `packages/reforged-types/src/entry.ts`, which
 * the Typings' package does not publish, so it is not imported.
 */
export const FAMILIES = {
  converter: { mayBeNonNull: true },
  "enum-getter": { mayBeNonNull: true },
  constructor: { mayBeNonNull: true },
  registration: { mayBeNonNull: true },
  "intrinsic-property": { mayBeNonNull: true },
  "optional-property": {
    mayBeNonNull: false,
    reason: "when the object has none",
  },
  "event-response": { mayBeNonNull: false, reason: "outside its event" },
  "callback-getter": {
    mayBeNonNull: false,
    reason: "outside its enum or filter callback",
  },
  lookup: { mayBeNonNull: false, reason: "when nothing is found" },
} as const satisfies Record<string, FamilyRule>;

/** A Nullability family. */
export type Family = keyof typeof FAMILIES;

/** A Native's verdict, from its cases and its family. */
export type Verdict =
  | "nullable (proved)"
  | "nullable (rule)"
  | "unsafe"
  | "review"
  | "non-null (evidence)"
  | "non-null (evidence, handle id 0)";

/** Whether a case gave one of `outcomes`. */
function gave(...outcomes: readonly Outcome[]) {
  return ({ outcome }: CaseResult) => outcomes.includes(outcome);
}

/** Whether a case gave a handle of id 0, which is not `nil`. */
function gaveIdZero(testCase: CaseResult): boolean {
  return testCase.outcome === "handle" && testCase.id === "0";
}

/**
 * The verdicts, checked in this order, each with the condition the cases
 * and the family meet: the first that holds is the Native's, so a `nil` is
 * proof whatever the family and the other cases gave, a crash or a skip
 * makes the Native unsafe, an odd value or an error is reviewed, and a
 * Native of a nullable family stays nullable by the rule, whatever handles
 * it gave.
 */
const VERDICTS: readonly (readonly [
  verdict: Verdict,
  holds: (cases: readonly CaseResult[], family: Family) => boolean,
])[] = [
  ["nullable (proved)", (cases) => cases.some(gave("nil"))],
  ["unsafe", (cases) => cases.some(gave("crashed"))],
  // The arguments are well-typed, so an error points first at the Probe, a
  // Fixture or the Typings; a case left unrun by a crash leaves the
  // evidence short of every case.
  ["review", (cases) => cases.some(gave("odd", "error", "not run"))],
  ["nullable (rule)", (_cases, family) => !FAMILIES[family].mayBeNonNull],
  [
    "non-null (evidence, handle id 0)",
    (cases) => cases.every(gave("handle")) && cases.some(gaveIdZero),
  ],
  ["non-null (evidence)", (cases) => cases.every(gave("handle"))],
];

/**
 * The verdict of a Native of `family` from its cases, the first of
 * `VERDICTS` that holds. Whether the cases are every case the family
 * requires is the Slice's to ensure: their labels are free text the report
 * cannot check.
 */
export function verdictOf(
  cases: readonly CaseResult[],
  family: Family,
): Verdict {
  const found = VERDICTS.find(([, holds]) => holds(cases, family));
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
 * The verdicts that propose a nullable return: proved, by its family, or
 * unsafe, since a crashed case is a required case that returned no handle.
 */
const NULLABLE_VERDICTS: readonly Verdict[] = [
  "nullable (proved)",
  "nullable (rule)",
  "unsafe",
];

/**
 * `mismatch` when the Overlay says the Native never returns nothing and
 * the verdict proposes it nullable, by proof, by its family or for a
 * crash; `consistent` otherwise.
 */
export function compare(
  verdict: Verdict,
  overlayNullable: boolean,
): Comparison {
  return !overlayNullable && NULLABLE_VERDICTS.includes(verdict)
    ? "mismatch"
    : "consistent";
}

/** Case labels, joined with commas. */
function labels(selected: readonly CaseResult[]): string {
  return selected.map(({ label }) => label).join(", ");
}

/**
 * The `notes` text proposed for the Native's Overlay entry, citing the
 * Patch the Probe was built against and the sweep, never an issue number
 * or a family's name, since `notes` is published as `@remarks`: the cases
 * that returned nothing for `nullable (proved)`; every case for
 * `non-null (evidence)`, then, for its id-0 variant, the cases that gave a
 * handle of id 0; for `nullable (rule)`, what the family may have nothing
 * for, then every case; for `unsafe`, the crash, then the sentence the
 * other cases give (`unsafeNotes`). Labels are joined with commas. A
 * Native proved nullable next to a crashed case gets the crash first too.
 * `review` gets no text, only "review", so no unchecked text reaches
 * `@remarks`. `nullable (rule)` for a family whose Natives may be
 * non-null, a pair `verdictOf` never gives, throws.
 */
export function proposedNotes(
  verdict: Verdict,
  cases: readonly CaseResult[],
  family: Family,
  patch: string,
): string {
  const everyCase = `every case of the nullability sweep (${labels(cases)}) on ${patch}`;
  switch (verdict) {
    case "nullable (proved)":
      return [
        ...crashSentence(cases, patch),
        `Returns nothing for ${labels(cases.filter(gave("nil")))} (nullability sweep, ${patch}).`,
      ].join(" ");
    case "unsafe":
      return unsafeNotes(cases, family, patch);
    case "non-null (evidence)":
      return `Returned a handle in ${everyCase}; evidence, not proof.`;
    case "non-null (evidence, handle id 0)":
      return `Returned a handle in ${everyCase}; evidence, not proof. For ${labels(cases.filter(gaveIdZero))}, a handle of id 0.`;
    case "nullable (rule)": {
      const rule: FamilyRule = FAMILIES[family];
      if (rule.mayBeNonNull) {
        throw new Error(
          `The family ${family} may be non-null: it gives no verdict of nullable (rule).`,
        );
      }
      return `May return nothing ${rule.reason}. Returned a handle in ${everyCase}.`;
    }
    default:
      return "review";
  }
}

/**
 * The sentence that opens the `notes` of a Native with a crashed case,
 * `Crashes the game for <cases> (nullability sweep, <Patch>).`, alone in
 * its list; an empty list for a Native without one.
 */
function crashSentence(cases: readonly CaseResult[], patch: string): string[] {
  const crashed = cases.filter(gave("crashed"));
  return crashed.length === 0
    ? []
    : [
        `Crashes the game for ${labels(crashed)} (nullability sweep, ${patch}).`,
      ];
}

/**
 * The `notes` of an `unsafe` Native, which the report proposes nullable
 * whatever its family: the crash, then the sentence its other cases give,
 * `Returned a handle in every other case (<cases>).`, then
 * `For <cases>, a handle of id 0.` when one gave a handle of id 0; for a
 * Native of a nullable family, what it may have nothing for comes before
 * that sentence. "review" when another case gave anything but a handle, an
 * error, an odd value, a second crash or a case not run, which leaves no
 * checked sentence to follow the crash.
 */
function unsafeNotes(
  cases: readonly CaseResult[],
  family: Family,
  patch: string,
): string {
  const crashed = gave("crashed");
  const others = cases.filter((testCase) => !crashed(testCase));
  if (!others.every(gave("handle"))) return "review";
  const rule: FamilyRule = FAMILIES[family];
  const idZero = others.filter(gaveIdZero);
  return [
    ...crashSentence(cases, patch),
    ...(rule.mayBeNonNull ? [] : [`May return nothing ${rule.reason}.`]),
    ...(others.length === 0
      ? []
      : [`Returned a handle in every other case (${labels(others)}).`]),
    ...(idZero.length === 0
      ? []
      : [`For ${labels(idZero)}, a handle of id 0.`]),
  ].join(" ");
}

/**
 * One call case of a parameter, as the Probe run recorded it: a
 * `CaseResult` with what the case passed for the parameter and what it
 * counts.
 */
export interface ParamCaseResult extends CaseResult {
  argument: CallArgument;
  /** What the case counts, singular: `unit`. */
  counted: string;
}

/** A parameter's verdict, from the call cases that measure it. */
export type ParamVerdict =
  "nullable (completed)" | "non-null (crashed)" | "review";

/** Whether a call case passed `nil` for the parameter. */
function passedNil(testCase: ParamCaseResult): boolean {
  return testCase.argument === "nil";
}

/**
 * The verdicts of a parameter, checked in this order, each with the
 * condition its call cases meet: the first that holds is the parameter's.
 * A `nil` case that was skipped, a crash the crash loop confirmed, makes it
 * non-null, whatever the other cases gave; every case completed, a `nil`
 * one at least, keeps it nullable; anything else gives `review`: an
 * `error`, a crash with a live value, a case not run, no `nil` case, or a
 * `nil` case that crashed in this run only, since making a parameter
 * non-null narrows it, which is breaking, and a crash not yet confirmed is
 * no ground for it.
 */
const PARAM_VERDICTS: readonly (readonly [
  verdict: ParamVerdict,
  holds: (cases: readonly ParamCaseResult[]) => boolean,
])[] = [
  [
    "non-null (crashed)",
    (cases) =>
      cases.some(
        (testCase) =>
          passedNil(testCase) &&
          testCase.outcome === "crashed" &&
          testCase.skipped === true,
      ),
  ],
  [
    "nullable (completed)",
    (cases) => cases.some(passedNil) && cases.every(gave("completed")),
  ],
  ["review", () => true],
];

/**
 * The verdict of a parameter from its call cases, the first of
 * `PARAM_VERDICTS` that holds.
 */
export function paramVerdictOf(
  cases: readonly ParamCaseResult[],
): ParamVerdict {
  const found = PARAM_VERDICTS.find(([, holds]) => holds(cases));
  if (found === undefined) {
    throw new Error(
      `No parameter verdict holds for the outcomes ${cases.map(({ outcome }) => outcome).join(", ")}.`,
    );
  }
  return found[0];
}

/**
 * How a parameter's verdict stands against the Overlay's
 * `params[].nullable`: `mismatch` when the verdict is nullable and the
 * Overlay says non-null, or the verdict is non-null and the Overlay says
 * nullable; `consistent` otherwise, for `review` too.
 */
export function compareParam(
  verdict: ParamVerdict,
  overlayNullable: boolean,
): Comparison {
  if (verdict === "review") return "consistent";
  return (verdict === "nullable (completed)") === overlayNullable
    ? "consistent"
    : "mismatch";
}

/**
 * How the counts of a parameter's completed `nil` cases stand against its
 * completed `always-true` cases', group by group: `nothing to compare`
 * when no group has both; `same` when every group that has both has one
 * count; `different` otherwise, with the difference in words for the
 * report's section and the pull request,
 * `nil: <case> <count>; always-true: <case> <count>`, naming the cases of
 * the groups whose counts differ.
 */
export type CountComparison =
  | { kind: "nothing to compare" }
  | { kind: "same" }
  | { kind: "different"; difference: string };

/**
 * The comparison of a parameter's `nil` counts with its always-true
 * counts (`CountComparison`). A `nil` case is compared with the
 * always-true cases of its own group only, since a stale handle may leave
 * fewer objects to enumerate than a live one.
 */
export function compareCounts(
  cases: readonly ParamCaseResult[],
): CountComparison {
  const completed = cases.filter(gave("completed"));
  const of = (group: CaseGroup, argument: CallArgument) =>
    completed.filter(
      (testCase) => testCase.group === group && testCase.argument === argument,
    );
  const compared = [...new Set(cases.map(({ group }) => group))]
    .map((group) => ({
      nil: of(group, "nil"),
      alwaysTrue: of(group, "always-true"),
    }))
    .filter(({ nil, alwaysTrue }) => nil.length > 0 && alwaysTrue.length > 0);
  if (compared.length === 0) return { kind: "nothing to compare" };
  const differing = compared.filter(
    ({ nil, alwaysTrue }) =>
      new Set([...nil, ...alwaysTrue].map(({ count }) => count)).size > 1,
  );
  if (differing.length === 0) return { kind: "same" };
  const counts = (selected: readonly ParamCaseResult[]) =>
    selected.map(({ label, count }) => `${label} ${count ?? ""}`).join(", ");
  return {
    kind: "different",
    difference: `nil: ${counts(differing.flatMap(({ nil }) => nil))}; always-true: ${counts(differing.flatMap(({ alwaysTrue }) => alwaysTrue))}`,
  };
}

/**
 * The sentence proposed for the `notes` of a parameter's Native, naming
 * the parameter, since the Overlay has no `notes` of a parameter: `notes`
 * is the Native's, rendered as its `@remarks`. It cites the Patch and the
 * sweep as `proposedNotes` does: for `nullable (completed)`,
 * `A nil <param> keeps every <counted>` when the `nil` counts equal the
 * always-true cases' (`counts` is `same`), or `A nil <param> is accepted`
 * when they differ or there is nothing to compare them with, the
 * difference left to the report's section and the pull request; for
 * `non-null (crashed)`, `Crashes the game with a nil <param>`; for
 * `review`, only "review".
 */
export function proposedParamNotes(
  verdict: ParamVerdict,
  cases: readonly ParamCaseResult[],
  counts: CountComparison,
  param: string,
  patch: string,
): string {
  const sweep = `(nullability sweep, ${patch})`;
  switch (verdict) {
    case "non-null (crashed)":
      return `Crashes the game with a nil ${param} ${sweep}.`;
    case "nullable (completed)": {
      const counted = cases.find(passedNil)?.counted;
      return counts.kind === "same" && counted !== undefined
        ? `A nil ${param} keeps every ${counted} ${sweep}.`
        : `A nil ${param} is accepted ${sweep}.`;
    }
    default:
      return "review";
  }
}
