/**
 * The Nullability sweep's report, `nullability-sweep.md` in the research
 * docs: a header, then one section per Slice, headed `## <probe>` with the
 * Probe's name in a code span. This module writes a Slice's section as
 * Markdown, formatted by Prettier itself, so the report passes the
 * workspace's Prettier check, and puts it into the report in place of the
 * Slice's previous one, keeping every other section. Pure: the report's
 * text in, its new text out.
 */
import { format } from "prettier";
import type {
  CaseResult,
  Comparison,
  Family,
  ParamCaseResult,
  ParamVerdict,
  Verdict,
} from "./verdict.js";

/** One Native of a Slice: its cases in the order they ran, and the conclusions. */
export interface NativeSection {
  native: string;
  cases: readonly CaseResult[];
  /** The Nullability family its Overlay entry names. */
  family: Family;
  verdict: Verdict;
  /** The Overlay's `returns.nullable` for the Native. */
  overlayNullable: boolean;
  comparison: Comparison;
  /** The proposed `notes` text, or "review" when there is none. */
  notes: string;
}

/**
 * One parameter of a Native that returns nothing, measured by call cases:
 * its cases in the order they ran, and the conclusions.
 */
export interface ParamSection {
  native: string;
  /** The parameter, as the Overlay's `params[].name` names it: `filter`. */
  param: string;
  cases: readonly ParamCaseResult[];
  verdict: ParamVerdict;
  /** The Overlay's `params[].nullable` for the parameter. */
  overlayNullable: boolean;
  comparison: Comparison;
  /**
   * How the counts with `nil` differ from the always-true ones of the same
   * group, for the pull request; undefined when they are the same or there
   * is nothing to compare.
   */
  countDifference: string | undefined;
  /**
   * The proposed sentence of the Native's `notes`, naming the parameter,
   * since the Overlay has no `params[].notes`; or "review" when there is
   * none.
   */
  notes: string;
}

/** One Slice's section of the report. */
export interface SliceSection {
  probe: string;
  /** The Build of the Typings the Probe was built against. */
  patch: string;
  /** The day the report was written, `YYYY-MM-DD`. */
  date: string;
  /** The runId of the Probe run read. */
  runId: string;
  /** The Natives of return cases, in the order the Probe first called them. */
  natives: readonly NativeSection[];
  /**
   * The parameters of call cases, in the order the Probe first called
   * them: one per Native and parameter.
   */
  params: readonly ParamSection[];
}

/** What the report starts with when the command creates it. */
export const REPORT_HEADER = `# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by \`pnpm probe:nullability-report <probe>\` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases and its Nullability family, compared with the Overlay's \`returns.nullable\`, and a proposed \`notes\` text; a Native is a \`mismatch\` when the Overlay types it non-null and its verdict is neither \`non-null (evidence)\` nor \`non-null (evidence, handle id 0)\`, \`unsafe\` and \`review\` included. An \`unsafe\` Native, one with a case that crashed the game, is proposed nullable. Each parameter measured by call cases gets a verdict from them, compared with the Overlay's \`params[].nullable\`, and a proposed sentence of its Native's \`notes\`, since the Overlay has no \`params[].notes\`. The command never writes the Overlay: every change to it goes through review.
`;

/**
 * One column of a table of cases, a Native's or a parameter's: its header
 * and each case's cell, as Markdown.
 */
interface Column<Case extends CaseResult> {
  header: string;
  cell: (testCase: Case) => string;
}

/** The Message column: an error's message as a code span, a crash's as text. */
const MESSAGE: Column<CaseResult> = {
  header: "Message",
  // An error's message is the Native's own text, shown as it is in a
  // code span; a crash's is the report's words.
  cell: ({ outcome, message }) => {
    if (message === undefined) return "";
    return outcome === "error" ? code(message) : text(message);
  },
};

/** The columns of a Native's table, left to right. */
const COLUMNS: readonly Column<CaseResult>[] = [
  { header: "Case", cell: ({ label }) => text(label) },
  { header: "Group", cell: ({ group }) => `(${group})` },
  { header: "Outcome", cell: ({ outcome }) => outcome },
  { header: "Id", cell: ({ id }) => (id === undefined ? "" : text(id)) },
  {
    header: "Type",
    cell: ({ type }) => (type === undefined ? "" : code(type)),
  },
  MESSAGE,
];

/** The columns of a parameter's table, left to right. */
const PARAM_COLUMNS: readonly Column<ParamCaseResult>[] = [
  { header: "Case", cell: ({ label }) => text(label) },
  { header: "Group", cell: ({ group }) => `(${group})` },
  { header: "Argument", cell: ({ argument }) => argument },
  { header: "Outcome", cell: ({ outcome }) => outcome },
  {
    header: "Count",
    cell: ({ count }) => (count === undefined ? "" : text(count)),
  },
  MESSAGE,
];

/**
 * A value on one line: each line break as a space, since a table cell or a
 * list item cannot hold one.
 */
function oneLine(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ");
}

/**
 * Text in a table cell or a list item, on one line: each `\`, `|` and
 * character Markdown could read as formatting escaped, so a label shows as
 * it is.
 */
function text(value: string): string {
  return oneLine(value).replace(
    /[\\`*_[\]<>|#]/g,
    (character) => `\\${character}`,
  );
}

/**
 * A value in a code span inside a table cell, on one line, with its `|`
 * escaped as GFM tables require; a backtick in the value lengthens the
 * span's fences.
 */
function code(value: string): string {
  const line = oneLine(value);
  const longest = Math.max(
    0,
    ...(line.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longest + 1);
  const padded =
    line.startsWith("`") || line.endsWith("`") ? ` ${line} ` : line;
  return `${fence}${padded.replaceAll("|", "\\|")}${fence}`;
}

/**
 * A Markdown table, unaligned: Prettier pads each column to its widest
 * cell as it measures it, wide characters counted twice.
 */
function table(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string[] {
  const line = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)];
}

/** The lines of one Native's part of a section: its heading, its table and its conclusions. */
function nativeLines(native: NativeSection): string[] {
  return [
    `### \`${native.native}\``,
    "",
    ...table(
      COLUMNS.map(({ header }) => header),
      native.cases.map((testCase) => COLUMNS.map(({ cell }) => cell(testCase))),
    ),
    "",
    `- Family: \`${native.family}\``,
    `- Verdict: ${native.verdict}`,
    `- Overlay \`returns.nullable\`: \`${String(native.overlayNullable)}\``,
    `- Comparison: ${native.comparison}`,
    `- Proposed \`notes\`: ${text(native.notes)}`,
  ];
}

/**
 * The lines of one parameter's part of a section: its heading, its table
 * and its conclusions, with the count difference when there is one.
 */
function paramLines(param: ParamSection): string[] {
  return [
    `### \`${param.native}\` parameter \`${param.param}\``,
    "",
    ...table(
      PARAM_COLUMNS.map(({ header }) => header),
      param.cases.map((testCase) =>
        PARAM_COLUMNS.map(({ cell }) => cell(testCase)),
      ),
    ),
    "",
    `- Verdict: ${param.verdict}`,
    `- Overlay \`params[].nullable\`: \`${String(param.overlayNullable)}\``,
    `- Comparison: ${param.comparison}`,
    ...(param.countDifference === undefined
      ? []
      : [`- Count difference: ${text(param.countDifference)}`]),
    `- Proposed sentence of the Native's \`notes\`: ${text(param.notes)}`,
  ];
}

/** The heading of the Slice of `probe`, which keys its section. */
function sectionHeading(probe: string): string {
  return `## \`${probe}\``;
}

/**
 * A Slice's section: its heading, the run it reports, then each Native of
 * return cases, then each parameter of call cases,
 * formatted by Prettier with its defaults, the workspace's, so it passes
 * the Prettier check as it is.
 */
export async function formatSection(slice: SliceSection): Promise<string> {
  const lines = [
    sectionHeading(slice.probe),
    "",
    `- Probe: \`${slice.probe}\``,
    `- Patch: ${slice.patch}`,
    `- Date: ${slice.date}`,
    `- Run: \`${slice.runId}\``,
    ...slice.natives.flatMap((native) => ["", ...nativeLines(native)]),
    ...slice.params.flatMap((param) => ["", ...paramLines(param)]),
  ];
  return format(`${lines.join("\n")}\n`, { parser: "markdown" });
}

/**
 * The report with `section`, the section of `probe`, in place of that
 * Slice's previous section, or after the last section when it has none.
 * Every other section, and the header before the first, are kept as they
 * are. A report that does not exist yet (`undefined`) starts with
 * `REPORT_HEADER`. A section runs from its `##` heading to the next one.
 */
export function replaceSection(
  report: string | undefined,
  probe: string,
  section: string,
): string {
  const lines = (report ?? REPORT_HEADER).replace(/\n+$/, "").split("\n");
  const heading = sectionHeading(probe);
  const start = lines.indexOf(heading);
  const sectionLines = section.replace(/\n+$/, "").split("\n");
  if (start === -1) {
    return `${[...lines, "", ...sectionLines].join("\n")}\n`;
  }
  const next = lines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );
  const before = lines.slice(0, start);
  const after = next === -1 ? [] : ["", ...lines.slice(next)];
  return `${[...before, ...sectionLines, ...after].join("\n")}\n`;
}
