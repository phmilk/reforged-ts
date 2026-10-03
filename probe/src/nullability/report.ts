/**
 * `probe:nullability-report`'s entry point: reads a Slice's Probe run
 * through the runner's reader (../read.ts), gives each Native a verdict from
 * the CASE, CALL and SKIP records of the case runner
 * (probes/nullability/case-runner.ts, in the format of
 * probes/nullability/records.d.ts) and the Nullability family its Overlay
 * entry names, compares it with that entry, read as JSON with no build of
 * the Typings, does the same for each parameter a Native's call cases
 * measure, against the entry's `params[].nullable`, and writes the
 * Slice's section of the sweep report, under the Patch the run's `BEGIN`
 * line names, the one its build compiled against. It reads the Overlay and
 * writes the report file only: never the Overlay.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  CallArgument,
  CallCaseFields,
  CallOutcome,
  CaseFields,
  CaseGroup,
  PendingLabel,
  SkipFields,
} from "../../probes/nullability/records.js";
import { AuthorError } from "../errors.js";
import {
  field,
  formatLine,
  formatValue,
  readProbeRun,
  type ProbeRun,
  type ReadContext,
  type ResultLine,
} from "../read.js";
import {
  formatSection,
  replaceSection,
  type NativeSection,
  type ParamSection,
  type SliceSection,
} from "./section.js";
import {
  compare,
  compareCounts,
  compareParam,
  FAMILIES,
  paramVerdictOf,
  proposedNotes,
  proposedParamNotes,
  verdictOf,
  type CaseResult,
  type Family,
  type ParamCaseResult,
} from "./verdict.js";

/** Where the report reads and writes, and its clock. */
export interface NullabilityReportContext extends ReadContext {
  /** The Overlay folder: `<source>/functions/<native>.json`. */
  overlayFolder: string;
  /** The sweep report, created when it does not exist. */
  reportFile: string;
  /** Now: the report's date is its day, in UTC. */
  clock: () => Date;
}

/** What the command wrote: the report file and the Slice's section. */
export interface NullabilityReport {
  file: string;
  slice: SliceSection;
}

/**
 * Writes the section of the Slice `probe` into the sweep report, in place
 * of its previous one, from the Probe's last run: a `finished` one, or an
 * `incomplete` or `crashed` one, whose trailing PENDING case is `crashed`
 * and whose cases after it are `not run`; any other is an AuthorError.
 * Each Native of return cases, in the order of the case list, gets a table
 * of its cases, its family, a verdict, its Overlay `returns.nullable` and
 * the comparison of the two, and a proposed `notes` text or "review"; each
 * parameter the call cases measure, after them, gets the same against its
 * Overlay `params[].nullable`, with how the `nil` counts differ from the
 * always-true ones. A Native without an Overlay entry or a family, a
 * parameter the entry does not list, a Native with both kinds of case, or
 * a record the report does not read, is an AuthorError, and the report is
 * then left as it was.
 */
export async function writeNullabilityReport(
  probe: string,
  context: NullabilityReportContext,
): Promise<NullabilityReport> {
  const run = readProbeRun(probe, context);
  const runId = acceptedRunId(run);
  const patch = builtPatch(run);
  const { returnCases, callCases } = casesByNative(run);
  const natives = [...returnCases].map(([native, cases]): NativeSection => {
    const { nullable: overlayNullable, family } = readReturns(
      readEntry(context.overlayFolder, native),
    );
    const verdict = verdictOf(cases, family);
    return {
      native,
      cases,
      family,
      verdict,
      overlayNullable,
      comparison: compare(verdict, overlayNullable),
      notes: proposedNotes(verdict, cases, family, patch),
    };
  });
  const params = [...callCases].flatMap(([native, byParam]) => {
    const entry = readEntry(context.overlayFolder, native);
    return [...byParam].map(([param, cases]): ParamSection => {
      const overlayNullable = readParamNullable(entry, param);
      const verdict = paramVerdictOf(cases);
      const counts = compareCounts(cases);
      return {
        native,
        param,
        cases,
        verdict,
        overlayNullable,
        comparison: compareParam(verdict, overlayNullable),
        countDifference:
          counts.kind === "different" ? counts.difference : undefined,
        notes: proposedParamNotes(verdict, cases, counts, param, patch),
      };
    });
  });
  const slice: SliceSection = {
    probe,
    patch,
    date: context.clock().toISOString().slice(0, "YYYY-MM-DD".length),
    runId,
    natives,
    params,
  };
  const section = await formatSection(slice);
  const report = fs.statSync(context.reportFile, { throwIfNoEntry: false })
    ? fs.readFileSync(context.reportFile, "utf8")
    : undefined;
  fs.mkdirSync(path.dirname(context.reportFile), { recursive: true });
  fs.writeFileSync(context.reportFile, replaceSection(report, probe, section));
  return { file: context.reportFile, slice };
}

/**
 * The refusal of each run state the report does not read, as the one-line
 * AuthorError's message.
 */
const REFUSALS: Readonly<
  Partial<Record<ProbeRun["state"], (run: ProbeRun) => string>>
> = {
  running: ({ probe }) =>
    `Probe ${probe}'s last run is still running: close the game first, then run the report again.`,
  failed: ({ probe, error }) =>
    `Probe ${probe}'s last run failed with the error ${formatValue(error ?? "")}: fix the Probe and run it again.`,
  "not-started": ({ probe, runId, expectedRunId, file }) =>
    runId === undefined
      ? `Probe ${probe}'s last build has no run: there is no Result file at ${file}.`
      : `Probe ${probe}'s last build has no run: the Result file is from run ${formatValue(runId)}, not from this build's run ${expectedRunId}.`,
};

/**
 * The runId of a run the report accepts: a `finished`, `incomplete` or
 * `crashed` one. Any other is an AuthorError that says why (`REFUSALS`).
 */
function acceptedRunId(run: ProbeRun): string {
  const refusal = REFUSALS[run.state];
  if (refusal !== undefined) throw new AuthorError(refusal(run));
  if (run.runId === undefined) {
    throw new AuthorError(`Probe ${run.probe}'s last run has no runId.`);
  }
  return run.runId;
}

/** What a call case adds to the case its records name. */
type CallCaseExtra = Omit<CallCaseFields, keyof CaseFields>;

/** A record of the case runner read: the case it names, and what it gave. */
interface CaseRecord extends CaseFields {
  /** A call case's parameter, argument and what it counts; undefined for a return case. */
  call?: CallCaseExtra;
  /** What the case gave; undefined for a CASE record, which plans it. */
  result?: Omit<CaseResult, "label" | "group">;
}

/** Reads one record of the case runner's kind. */
type RecordReader = (record: ResultLine) => CaseRecord;

/** The readers of the records a Slice's Probe run holds, by kind. */
const RECORD_READERS: Readonly<Partial<Record<string, RecordReader>>> = {
  CASE: readCase,
  CALL: readCall,
  SKIP: readSkip,
};

/**
 * The outcomes a CALL record may hold, each keyed once with the kind of
 * case that gives it, so an outcome added to the format is a type error
 * here until it is read: `return` for a return case, `call` for a call
 * case, `both` for either.
 */
const CALL_OUTCOMES: Readonly<Record<CallOutcome, "return" | "call" | "both">> =
  {
    handle: "return",
    nil: "return",
    odd: "return",
    completed: "call",
    error: "both",
  };

/** The groups a case may be in, each keyed once. */
const GROUPS: Readonly<Record<CaseGroup, true>> = { a: true, b: true };

/** The arguments a call case may pass, each keyed once. */
const ARGUMENTS: Readonly<Record<CallArgument, true>> = {
  nil: true,
  "always-true": true,
  live: true,
};

/** The reason of a SKIP record, the only one the case runner writes. */
const SKIP_REASON: SkipFields["reason"] = "crashed";

/** Whether `value` is a key of `keys`. */
function isKeyOf<Key extends string>(
  keys: Readonly<Record<Key, unknown>>,
  value: unknown,
): value is Key {
  return typeof value === "string" && Object.hasOwn(keys, value);
}

/**
 * The case a record `<kind> native=<native> case=<label> group=<group>`
 * names, a call case's `argument=<argument> counted=<counted>
 * param=<param>` included. A record without these fields, with a group or
 * an argument the case runner never writes, or with only some of a call
 * case's fields, is an AuthorError.
 */
function readCase(record: ResultLine): CaseRecord {
  const native = field(record, "native");
  const label = field(record, "case");
  const group = field(record, "group");
  if (native === undefined || label === undefined || !isKeyOf(GROUPS, group)) {
    throw notRead(record);
  }
  const param = field(record, "param");
  const argument = field(record, "argument");
  const counted = field(record, "counted");
  if (param === undefined && argument === undefined && counted === undefined) {
    return { native, case: label, group };
  }
  if (
    param === undefined ||
    counted === undefined ||
    !isKeyOf(ARGUMENTS, argument)
  ) {
    throw notRead(record);
  }
  return { native, case: label, group, call: { param, argument, counted } };
}

/**
 * The case of a record `CALL native=<native> case=<label> group=<group>
 * outcome=<outcome>`, with `id` and `type` on a `handle`, `type` on an
 * `odd`, `count` on a `completed` and `message` on an `error`. A record
 * with an outcome the case runner never writes, one its kind of case
 * never gives (`completed` from a return case, a `handle` from a call
 * case), or a `completed` without an integer `count`, is an AuthorError.
 */
function readCall(record: ResultLine): CaseRecord {
  const outcome = field(record, "outcome");
  if (!isKeyOf(CALL_OUTCOMES, outcome)) throw notRead(record);
  const testCase = readCase(record);
  const kind = testCase.call === undefined ? "return" : "call";
  if (CALL_OUTCOMES[outcome] !== "both" && CALL_OUTCOMES[outcome] !== kind) {
    throw notRead(record);
  }
  const id = field(record, "id");
  const type = field(record, "type");
  const count = field(record, "count");
  const message = field(record, "message");
  if (outcome === "completed" && !/^-?\d+$/.test(count ?? "")) {
    throw notRead(record);
  }
  return {
    ...testCase,
    result: {
      outcome,
      ...(id !== undefined && { id }),
      ...(type !== undefined && { type }),
      ...(count !== undefined && { count }),
      ...(message !== undefined && { message }),
    },
  };
}

/**
 * The case of a record `SKIP native=<native> case=<label> group=<group>
 * reason=crashed`, a case that crashed the game in an earlier run:
 * `crashed`.
 */
function readSkip(record: ResultLine): CaseRecord {
  if (field(record, "reason") !== SKIP_REASON) throw notRead(record);
  return {
    ...readCase(record),
    result: {
      outcome: "crashed",
      message: "skipped: crashed in an earlier run",
      skipped: true,
    },
  };
}

function notRead(record: ResultLine): AuthorError {
  return new AuthorError(
    `The record ${formatLine(record)} is not one the nullability report reads.`,
  );
}

/**
 * A case as its PENDING line labels it, `<native> <case>`, as the case
 * runner writes it (`PendingLabel`).
 */
function pendingLabel(testCase: CaseFields): PendingLabel {
  return `${testCase.native} ${testCase.case}`;
}

/** The cases of a run, by Native: return cases, and call cases by parameter. */
interface RunCases {
  returnCases: Map<string, CaseResult[]>;
  callCases: Map<string, Map<string, ParamCaseResult[]>>;
}

/**
 * The cases of each Native, from the run's records: the case list the
 * CASE records plan, each case with what its CALL or SKIP record says it
 * gave; a Native's call cases grouped by the parameter they measure. A
 * case of a `finished` run without one is an AuthorError. A case of a run
 * a crash ended without one is `crashed` when its PENDING line is the
 * run's last, and `not run` otherwise. The Natives, and a Native's
 * parameters, come in the order of their first case. A CALL or SKIP of no
 * planned case, of a case planned as the other kind or with another
 * `param`, `argument` or `counted`, a second one of a case, or a Native
 * planned with both kinds of case, is an AuthorError.
 */
function casesByNative(run: ProbeRun): RunCases {
  const planned = new Map<string, CaseRecord>();
  const given = new Map<string, CaseRecord["result"]>();
  for (const record of run.records) {
    const read = RECORD_READERS[record.kind];
    if (read === undefined) throw notRead(record);
    const testCase = read(record);
    const key = pendingLabel(testCase);
    if (testCase.result === undefined) {
      if (planned.has(key)) throw notRead(record);
      planned.set(key, testCase);
    } else {
      const plan = planned.get(key);
      if (
        plan === undefined ||
        given.has(key) ||
        !sameCall(plan.call, testCase.call)
      ) {
        throw notRead(record);
      }
      given.set(key, testCase.result);
    }
  }
  const cases: RunCases = { returnCases: new Map(), callCases: new Map() };
  for (const [key, testCase] of planned) {
    const result: CaseResult = {
      label: testCase.case,
      group: testCase.group,
      ...(given.get(key) ?? unrecorded(run, key)),
    };
    const { native, call } = testCase;
    if (call === undefined) {
      if (cases.callCases.has(native)) throw bothKinds(native);
      const ofNative = cases.returnCases.get(native) ?? [];
      ofNative.push(result);
      cases.returnCases.set(native, ofNative);
    } else {
      if (cases.returnCases.has(native)) throw bothKinds(native);
      const byParam =
        cases.callCases.get(native) ?? new Map<string, ParamCaseResult[]>();
      const ofParam = byParam.get(call.param) ?? [];
      ofParam.push({
        ...result,
        argument: call.argument,
        counted: call.counted,
      });
      byParam.set(call.param, ofParam);
      cases.callCases.set(native, byParam);
    }
  }
  return cases;
}

/**
 * Whether a CALL or SKIP record names its case as its CASE record planned
 * it: both of a return case, or both of a call case with the same `param`,
 * `argument` and `counted`.
 */
function sameCall(
  planned: CallCaseExtra | undefined,
  given: CallCaseExtra | undefined,
): boolean {
  if (planned === undefined || given === undefined) {
    return planned === given;
  }
  return (
    planned.param === given.param &&
    planned.argument === given.argument &&
    planned.counted === given.counted
  );
}

function bothKinds(native: string): AuthorError {
  return new AuthorError(
    `${native} has both return cases and call cases: a Native that returns a value has return cases only, one that returns nothing call cases only.`,
  );
}

/** What a planned case without a CALL or SKIP record gave (`casesByNative`). */
function unrecorded(
  run: ProbeRun,
  key: string,
): NonNullable<CaseRecord["result"]> {
  if (run.state === "finished") {
    throw new AuthorError(
      `Probe ${run.probe}'s run finished without a CALL or SKIP record of the case ${formatValue(key)}.`,
    );
  }
  return key === run.pending
    ? { outcome: "crashed", message: "crashed the game in this run" }
    : { outcome: "not run" };
}

/**
 * The Patch the run's build compiled against, as its `BEGIN` line names
 * it. A run whose `BEGIN` line names none, from a build older than the
 * line's `patch`, is an AuthorError.
 */
function builtPatch(run: ProbeRun): string {
  if (run.patch === undefined) {
    throw new AuthorError(
      `Probe ${run.probe}'s last run names no Patch in its BEGIN line: build it with \`pnpm probe:build ${run.probe}\` and run it again.`,
    );
  }
  return run.patch;
}

/** An Overlay entry, as far as the report reads it. */
interface OverlayEntry {
  returns?: { nullable?: unknown; family?: unknown };
  params?: unknown;
}

/** An Overlay entry, with the file it was read from. */
interface ReadEntry {
  file: string;
  entry: OverlayEntry;
}

/**
 * The Overlay entry of `native`, found as `<source>/functions/<native>.json`
 * under any source of the Overlay, with its file; read once per Native. A
 * Native without an entry, or with entries under several sources, is an
 * AuthorError.
 */
function readEntry(overlayFolder: string, native: string): ReadEntry {
  const files = fs
    .readdirSync(overlayFolder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      path.join(overlayFolder, entry.name, "functions", `${native}.json`),
    )
    .filter((file) => fs.statSync(file, { throwIfNoEntry: false })?.isFile())
    .sort();
  const file = files.at(0);
  if (file === undefined) {
    throw new AuthorError(
      `${native} has no Overlay entry in ${overlayFolder}: the report compares each verdict with one.`,
    );
  }
  if (files.length > 1) {
    throw new AuthorError(
      `${native} has an Overlay entry under several sources, ${files.join(", ")}: the report compares each verdict with one.`,
    );
  }
  return { file, entry: readJson(file) as OverlayEntry };
}

/**
 * The `returns.nullable` and `returns.family` of a Native's Overlay entry.
 * An entry with no boolean `returns.nullable` or no Nullability family is
 * an AuthorError.
 */
function readReturns({ file, entry: { returns } }: ReadEntry): {
  nullable: boolean;
  family: Family;
} {
  if (typeof returns?.nullable !== "boolean") {
    throw new AuthorError(`${file} has no boolean returns.nullable.`);
  }
  if (!isKeyOf(FAMILIES, returns.family)) {
    throw new AuthorError(
      `${file} names no Nullability family in returns.family (${Object.keys(FAMILIES).join(", ")}): the verdict depends on it.`,
    );
  }
  return { nullable: returns.nullable, family: returns.family };
}

/**
 * The `nullable` of the parameter `param` in the `params` of a Native's
 * Overlay entry. An entry that lists no such parameter with a boolean
 * `nullable` is an AuthorError.
 */
function readParamNullable({ file, entry }: ReadEntry, param: string): boolean {
  const params = Array.isArray(entry.params)
    ? (entry.params as readonly { name?: unknown; nullable?: unknown }[])
    : [];
  const nullable = params.find(({ name }) => name === param)?.nullable;
  if (typeof nullable !== "boolean") {
    throw new AuthorError(
      `${file} has no parameter ${param} with a boolean nullable in params.`,
    );
  }
  return nullable;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new AuthorError(
      `${file} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
