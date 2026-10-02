/**
 * `probe:nullability-report`'s entry point: reads a Slice's Probe run
 * through the runner's reader (../read.ts), gives each Native a verdict from
 * the CASE, CALL and SKIP records of the case runner
 * (probes/nullability/case-runner.ts), compares it with the Native's
 * Overlay entry, read as JSON with no build of the Typings, and writes the
 * Slice's section of the sweep report. It reads the Overlay and the
 * Typings' manifest and writes the report file only: never the Overlay.
 */
import fs from "node:fs";
import path from "node:path";
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
  type SliceSection,
} from "./section.js";
import {
  compare,
  proposedNotes,
  verdictOf,
  type CaseGroup,
  type CaseResult,
  type Outcome,
} from "./verdict.js";

/** Where the report reads and writes, and its clock. */
export interface NullabilityReportContext extends ReadContext {
  /** The Overlay folder: `<source>/functions/<native>.json`. */
  overlayFolder: string;
  /** The Typings' manifest, whose `patch` names the Build. */
  manifestFile: string;
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
 * Each Native, in the order of the case list, gets a table of its cases, a
 * verdict, its Overlay `returns.nullable` and the comparison of the two,
 * and a proposed `notes` text or "review". A Native without an Overlay
 * entry, or a record the report does not read, is an AuthorError, and the
 * report is then left as it was.
 */
export function writeNullabilityReport(
  probe: string,
  context: NullabilityReportContext,
): NullabilityReport {
  const run = readProbeRun(probe, context);
  const runId = acceptedRunId(run);
  const patch = readPatch(context.manifestFile);
  const natives = [...casesByNative(run)].map(
    ([native, cases]): NativeSection => {
      const verdict = verdictOf(cases);
      const overlayNullable = readReturnsNullable(
        context.overlayFolder,
        native,
      );
      return {
        native,
        cases,
        verdict,
        overlayNullable,
        comparison: compare(verdict, overlayNullable),
        notes: proposedNotes(verdict, cases, patch),
      };
    },
  );
  const slice: SliceSection = {
    probe,
    patch,
    date: context.clock().toISOString().slice(0, "YYYY-MM-DD".length),
    runId,
    natives,
  };
  const report = fs.statSync(context.reportFile, { throwIfNoEntry: false })
    ? fs.readFileSync(context.reportFile, "utf8")
    : undefined;
  fs.mkdirSync(path.dirname(context.reportFile), { recursive: true });
  fs.writeFileSync(
    context.reportFile,
    replaceSection(report, probe, formatSection(slice)),
  );
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

/** A record of the case runner read: the case it names, and what it gave. */
interface CaseRecord {
  native: string;
  label: string;
  group: CaseGroup;
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

/** The outcomes a CALL record may hold. */
const CALL_OUTCOMES: readonly Outcome[] = ["handle", "nil", "odd", "error"];

/** The groups a case may be in. */
const GROUPS: readonly CaseGroup[] = ["a", "b"];

/**
 * The case a record `<kind> native=<native> case=<label> group=<group>`
 * names. A record without these fields, or with a group the case runner
 * never writes, is an AuthorError.
 */
function readCase(record: ResultLine): CaseRecord {
  const native = field(record, "native");
  const label = field(record, "case");
  const group = field(record, "group") as CaseGroup | undefined;
  if (
    native === undefined ||
    label === undefined ||
    group === undefined ||
    !GROUPS.includes(group)
  ) {
    throw notRead(record);
  }
  return { native, label, group };
}

/**
 * The case of a record `CALL native=<native> case=<label> group=<group>
 * outcome=<outcome>`, with `id` and `type` on a `handle`, `type` on an
 * `odd` and `message` on an `error`. A record with an outcome the case
 * runner never writes is an AuthorError.
 */
function readCall(record: ResultLine): CaseRecord {
  const outcome = field(record, "outcome") as Outcome | undefined;
  if (outcome === undefined || !CALL_OUTCOMES.includes(outcome)) {
    throw notRead(record);
  }
  const id = field(record, "id");
  const type = field(record, "type");
  const message = field(record, "message");
  return {
    ...readCase(record),
    result: {
      outcome,
      ...(id !== undefined && { id }),
      ...(type !== undefined && { type }),
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
  if (field(record, "reason") !== "crashed") throw notRead(record);
  return {
    ...readCase(record),
    result: {
      outcome: "crashed",
      message: "skipped: crashed in an earlier run",
    },
  };
}

function notRead(record: ResultLine): AuthorError {
  return new AuthorError(
    `The record ${formatLine(record)} is not one the nullability report reads.`,
  );
}

/** A case as its PENDING line labels it: `<native> <case>`. */
function pendingLabel({ native, label }: CaseRecord): string {
  return `${native} ${label}`;
}

/**
 * The cases of each Native, from the run's records: the case list the
 * CASE records plan, each case with what its CALL or SKIP record says it
 * gave. A case of a `finished` run without one is an AuthorError. A case of
 * a run a crash ended without one is `crashed` when its PENDING line is
 * the run's last, and `not run` otherwise. The Natives come in the order of
 * their first case. A CALL or SKIP of no planned case, or a second one of a
 * case, is an AuthorError.
 */
function casesByNative(run: ProbeRun): Map<string, CaseResult[]> {
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
      if (!planned.has(key) || given.has(key)) throw notRead(record);
      given.set(key, testCase.result);
    }
  }
  const natives = new Map<string, CaseResult[]>();
  for (const [key, testCase] of planned) {
    const cases = natives.get(testCase.native) ?? [];
    cases.push({
      label: testCase.label,
      group: testCase.group,
      ...(given.get(key) ?? unrecorded(run, key)),
    });
    natives.set(testCase.native, cases);
  }
  return natives;
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

/** The Build in the Typings' manifest, its `patch`. */
function readPatch(manifestFile: string): string {
  const { patch } = readJson(manifestFile) as { patch?: unknown };
  if (typeof patch !== "string" || patch === "") {
    throw new AuthorError(`${manifestFile} names no patch.`);
  }
  return patch;
}

/**
 * The `returns.nullable` of the Overlay entry of `native`, found as
 * `<source>/functions/<native>.json` under any source of the Overlay. A
 * Native without an entry, or whose entry has no boolean
 * `returns.nullable`, is an AuthorError.
 */
function readReturnsNullable(overlayFolder: string, native: string): boolean {
  const files = fs
    .readdirSync(overlayFolder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      path.join(overlayFolder, entry.name, "functions", `${native}.json`),
    )
    .filter((file) => fs.statSync(file, { throwIfNoEntry: false })?.isFile());
  const file = files.at(0);
  if (file === undefined) {
    throw new AuthorError(
      `${native} has no Overlay entry in ${overlayFolder}: the report compares each verdict with one.`,
    );
  }
  const { returns } = readJson(file) as { returns?: { nullable?: unknown } };
  if (typeof returns?.nullable !== "boolean") {
    throw new AuthorError(`${file} has no boolean returns.nullable.`);
  }
  return returns.nullable;
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
