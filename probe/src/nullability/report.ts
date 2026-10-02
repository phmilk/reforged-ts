/**
 * `probe:nullability-report`'s entry point: reads a Slice's Probe run
 * through the runner's reader (../read.ts), gives each Native a verdict from
 * the CALL records of the case runner (probes/nullability/case-runner.ts),
 * compares it with the Native's Overlay entry, read as JSON with no build
 * of the Typings, and writes the Slice's section of the sweep report. It
 * reads the Overlay and the Typings' manifest and writes the report file
 * only: never the Overlay.
 */
import fs from "node:fs";
import path from "node:path";
import { AuthorError } from "../errors.js";
import {
  field,
  formatLine,
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
 * of its previous one, from the Probe's last run: a `finished` run, any
 * other an AuthorError. Each Native, in the order the Probe first called
 * it, gets a table of its cases, a verdict, its Overlay `returns.nullable`
 * and the comparison of the two, and a proposed `notes` text. A Native
 * without an Overlay entry, or a record the report does not read, is an
 * AuthorError, and the report is then left as it was.
 */
export function writeNullabilityReport(
  probe: string,
  context: NullabilityReportContext,
): NullabilityReport {
  const run = readProbeRun(probe, context);
  const runId = acceptedRunId(run);
  const patch = readPatch(context.manifestFile);
  const natives = [...casesByNative(run.records)].map(
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
 * The runId of a run the report accepts, a `finished` one; any other is an
 * AuthorError.
 */
function acceptedRunId(run: ProbeRun): string {
  if (run.state !== "finished" || run.runId === undefined) {
    throw new AuthorError(
      `Probe ${run.probe}'s last run is ${run.state}: the report reads a finished run only. Run \`pnpm probe:read ${run.probe}\` to see it.`,
    );
  }
  return run.runId;
}

/** A case of one Native, read from its record. */
interface NativeCase {
  native: string;
  result: CaseResult;
}

/** Reads one record of the case runner's kind into its case. */
type RecordReader = (record: ResultLine) => NativeCase;

/** The readers of the records a Slice's Probe run holds, by kind. */
const RECORD_READERS: Readonly<Partial<Record<string, RecordReader>>> = {
  CALL: readCall,
};

/** The outcomes a CALL record may hold. */
const OUTCOMES: readonly Outcome[] = ["handle", "nil"];

/** The groups a case may be in. */
const GROUPS: readonly CaseGroup[] = ["a", "b"];

/**
 * The case of a record `CALL native=<native> case=<label> group=<group>
 * outcome=<outcome>`, with `id` and `type` on a `handle`. A record without
 * these fields, or with a value the case runner never writes, is an
 * AuthorError.
 */
function readCall(record: ResultLine): NativeCase {
  const native = field(record, "native");
  const label = field(record, "case");
  const group = field(record, "group") as CaseGroup | undefined;
  const outcome = field(record, "outcome") as Outcome | undefined;
  if (
    native === undefined ||
    label === undefined ||
    group === undefined ||
    !GROUPS.includes(group) ||
    outcome === undefined ||
    !OUTCOMES.includes(outcome)
  ) {
    throw notRead(record);
  }
  const id = field(record, "id");
  const type = field(record, "type");
  return {
    native,
    result: {
      label,
      group,
      outcome,
      ...(id !== undefined && { id }),
      ...(type !== undefined && { type }),
    },
  };
}

function notRead(record: ResultLine): AuthorError {
  return new AuthorError(
    `The record ${formatLine(record)} is not one the nullability report reads.`,
  );
}

/** The cases of each Native, the Natives in the order of their first case. */
function casesByNative(
  records: readonly ResultLine[],
): Map<string, CaseResult[]> {
  const natives = new Map<string, CaseResult[]>();
  for (const record of records) {
    const read = RECORD_READERS[record.kind];
    if (read === undefined) throw notRead(record);
    const { native, result } = read(record);
    const cases = natives.get(native) ?? [];
    cases.push(result);
    natives.set(native, cases);
  }
  return natives;
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
