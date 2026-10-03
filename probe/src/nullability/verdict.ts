/**
 * The Nullability sweep's conclusions about one Native: the outcome of each
 * of its cases, as the case runner recorded it, and its Nullability family,
 * as the Overlay names it, give the Native a verdict; the verdict is
 * compared with the Overlay's `returns.nullable` and gives a proposed
 * `notes` text. Pure: no file is read here.
 */
import type {
  CallOutcome,
  CaseGroup,
} from "../../probes/nullability/records.js";

/**
 * What a case gave: what its call returned, as its CALL record says
 * (`handle`, `nil`, `odd`, or `error` when it raised); `crashed` for a case
 * that crashed the game, in this run (the trailing PENDING) or in an
 * earlier one (its SKIP record); `not run` for a case after a crash.
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
  /**
   * What the call raised, on an `error`; how the case crashed, on a
   * `crashed`.
   */
  message?: string;
}

/**
 * The Nullability families, as the Overlay's `returns.family` names them,
 * each keyed once with what its Natives may have nothing for: `undefined`
 * for a family whose Natives may be non-null, the reason, as `notes` gives
 * it, for a family whose Natives are nullable by their nature.
 */
export const FAMILIES = {
  converter: undefined,
  "enum-getter": undefined,
  constructor: undefined,
  registration: undefined,
  "intrinsic-property": undefined,
  "optional-property": "when the object has none",
  "event-response": "outside its event",
  "callback-getter": "outside its enum or filter callback",
  lookup: "when nothing is found",
} as const satisfies Record<string, string | undefined>;

/** A Nullability family. */
export type Family = keyof typeof FAMILIES;

/** Whether `value` names a Nullability family. */
export function isFamily(value: unknown): value is Family {
  return typeof value === "string" && Object.hasOwn(FAMILIES, value);
}

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
 * proof whatever the family and the other cases gave, a crash, a skip or an
 * error makes the Native unsafe, an odd value is reviewed, and a Native of
 * a nullable family stays nullable by the rule, whatever handles it gave.
 */
const VERDICTS: readonly (readonly [
  verdict: Verdict,
  holds: (cases: readonly CaseResult[], family: Family) => boolean,
])[] = [
  ["nullable (proved)", (cases) => cases.some(gave("nil"))],
  ["unsafe", (cases) => cases.some(gave("crashed", "error"))],
  // A case left unrun by a crash leaves the evidence short of every case.
  ["review", (cases) => cases.some(gave("odd", "not run"))],
  ["nullable (rule)", (_cases, family) => FAMILIES[family] !== undefined],
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
 * Patch the Probe was built against and the sweep, never an issue number
 * or a family's name, since `notes` is published as `@remarks`: the cases
 * that returned nothing for `nullable (proved)`; every case for
 * `non-null (evidence)`, then, for its id-0 variant, the cases that gave a
 * handle of id 0; for `nullable (rule)`, what the family may have nothing
 * for, then every case. Labels are joined with commas. `unsafe` and
 * `review` get no text, only "review", so no unchecked text reaches
 * `@remarks`.
 */
export function proposedNotes(
  verdict: Verdict,
  cases: readonly CaseResult[],
  family: Family,
  patch: string,
): string {
  const labels = (selected: readonly CaseResult[]) =>
    selected.map(({ label }) => label).join(", ");
  const everyCase = `every case of the nullability sweep (${labels(cases)}) on ${patch}`;
  switch (verdict) {
    case "nullable (proved)":
      return `Returns nothing for ${labels(cases.filter(gave("nil")))} (nullability sweep, ${patch}).`;
    case "non-null (evidence)":
      return `Returned a handle in ${everyCase}; evidence, not proof.`;
    case "non-null (evidence, handle id 0)":
      return `Returned a handle in ${everyCase}; evidence, not proof. For ${labels(cases.filter(gaveIdZero))}, a handle of id 0.`;
    case "nullable (rule)":
      return `May return nothing ${FAMILIES[family] ?? ""}. Returned a handle in ${everyCase}.`;
    default:
      return "review";
  }
}
