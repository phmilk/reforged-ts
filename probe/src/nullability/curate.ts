/**
 * `probe:nullability-curate`'s entry point: applies the verdicts of a
 * Slice's last Probe run, the ones its section of the sweep report gives
 * (`readSlice` of ./report.ts), to the Overlay, for the curation pull
 * request of the Slice's group (probe/README.md). It narrows a return only
 * on evidence and never widens one, writes the proposed `notes` where an
 * entry holds none, and refuses a Slice with a `mismatch`, which a curation
 * pull request fixes by hand. It writes local files only: the Overlay
 * changes through review.
 */
import fs from "node:fs";
import { AuthorError } from "../errors.js";
import {
  readEntry,
  readSlice,
  type SliceContext,
  type SliceVerdicts,
} from "./report.js";
import { backsNonNull, FAMILIES } from "./verdict.js";

/** What `proposedNotes` and `proposedParamNotes` give when they have no text. */
const REVIEW = "review";

/** What the command did to the `notes` of one Native's entry. */
export type CuratedNotes =
  /** The entry held none: the proposal is written. */
  | { kind: "written"; text: string }
  /** The entry holds the proposal already. */
  | { kind: "unchanged" }
  /**
   * The entry holds other `notes`, from their first Build or written by
   * hand, which are kept: the proposal is for the review.
   */
  | { kind: "kept"; proposed: string }
  /** The proposal is "review": no checked text to write. */
  | { kind: "review" };

/** What the command did to one Native's Overlay entry. */
export interface CuratedEntry {
  native: string;
  /** The entry's file. */
  file: string;
  /** The Native's verdict; a parameter's for a Native of call cases. */
  verdict: string;
  /** Whether its `returns.nullable` went from `true` to `false`. */
  narrowed: boolean;
  notes: CuratedNotes;
}

/** What the command read, and what it did to each entry. */
export interface Curation {
  slice: SliceVerdicts;
  /** One per Native, in the order of the Slice's section. */
  entries: CuratedEntry[];
}

/**
 * Applies the verdicts of the Slice `probe` to the Overlay. A Native's
 * `returns.nullable` goes to `false` only for a `non-null (evidence)` or
 * `non-null (evidence, handle id 0)` verdict in a family that may be
 * non-null; nothing ever goes to `true`. Its proposed `notes`, the Native's
 * text, or the sentences of its parameters for a Native of call cases, are
 * written to an entry that holds no `notes`, after its `params`; an entry
 * that holds some keeps them. A proposal of "review", or a Native with a
 * parameter of "review", writes no `notes`. A Slice with a `mismatch`, a
 * Native's or a parameter's, is an AuthorError naming each on a line of
 * its own, and nothing is written; so is anything `readSlice` refuses.
 * Only the entries that change are written, as two-space JSON.
 */
export function curateOverlay(probe: string, context: SliceContext): Curation {
  const slice = readSlice(probe, context);
  refuseMismatches(slice);
  const proposals = new Map<
    string,
    { verdict: string; narrow: boolean; notes: string }
  >();
  for (const {
    native,
    verdict,
    family,
    overlayNullable,
    notes,
  } of slice.natives) {
    proposals.set(native, {
      verdict,
      narrow:
        overlayNullable &&
        backsNonNull(verdict) &&
        FAMILIES[family].mayBeNonNull,
      notes,
    });
  }
  for (const { native, param, verdict, notes } of slice.params) {
    const previous = proposals.get(native);
    proposals.set(native, {
      verdict: `${previous === undefined ? "" : `${previous.verdict}, `}parameter ${param} ${verdict}`,
      narrow: false,
      notes:
        previous === undefined
          ? notes
          : [previous.notes, notes].includes(REVIEW)
            ? REVIEW
            : `${previous.notes} ${notes}`,
    });
  }
  const changes = [...proposals].map(([native, proposal]) => {
    const { file, entry } = readEntry(context.overlayFolder, native);
    const fields = entry as Record<string, unknown>;
    const notes = curatedNotes(fields.notes, proposal.notes);
    const curated: CuratedEntry = {
      native,
      file,
      verdict: proposal.verdict,
      narrowed: proposal.narrow,
      notes,
    };
    return { curated, fields };
  });
  for (const { curated, fields } of changes) {
    const notes =
      curated.notes.kind === "written" ? curated.notes.text : undefined;
    if (!curated.narrowed && notes === undefined) continue;
    const text = `${JSON.stringify(withChanges(fields, curated.narrowed, notes), null, 2)}\n`;
    fs.writeFileSync(curated.file, text);
  }
  return { slice, entries: changes.map(({ curated }) => curated) };
}

/**
 * What becomes of an entry's `notes`, `existing` as its JSON holds them,
 * given the proposal (`CuratedNotes`).
 */
function curatedNotes(existing: unknown, proposed: string): CuratedNotes {
  if (proposed === REVIEW) return { kind: "review" };
  if (existing === undefined) return { kind: "written", text: proposed };
  return existing === proposed
    ? { kind: "unchanged" }
    : { kind: "kept", proposed };
}

/**
 * The entry's fields in their order, with `returns.nullable` `false` when
 * `narrow`, and `notes` after `params` when given: where a hand-written
 * entry holds them.
 */
function withChanges(
  fields: Readonly<Record<string, unknown>>,
  narrow: boolean,
  notes: string | undefined,
): Record<string, unknown> {
  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    changed[key] =
      key === "returns" && narrow
        ? { ...(value as Record<string, unknown>), nullable: false }
        : value;
    if (key === "params" && notes !== undefined) changed.notes = notes;
  }
  if (notes !== undefined && !Object.hasOwn(changed, "notes")) {
    changed.notes = notes;
  }
  return changed;
}

/**
 * Refuses a Slice whose section has a `mismatch`: an AuthorError naming
 * each Native and parameter of one, with its verdict and the Overlay's
 * value, on a line of its own.
 */
function refuseMismatches(slice: SliceVerdicts): void {
  const lines = [
    ...slice.natives
      .filter(({ comparison }) => comparison === "mismatch")
      .map(
        ({ native, verdict, overlayNullable }) =>
          `${native}: ${verdict}, Overlay returns.nullable ${String(overlayNullable)}`,
      ),
    ...slice.params
      .filter(({ comparison }) => comparison === "mismatch")
      .map(
        ({ native, param, verdict, overlayNullable }) =>
          `${native} parameter ${param}: ${verdict}, Overlay params[].nullable ${String(overlayNullable)}`,
      ),
  ];
  if (lines.length > 0) {
    throw new AuthorError(
      [
        `Probe ${slice.probe}'s run ${slice.runId} gives a mismatch, which a bug issue per Native tracks and its group's curation pull request fixes by hand (probe/README.md); nothing was written:`,
        ...lines,
      ].join("\n"),
    );
  }
}
