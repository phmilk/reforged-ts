/**
 * The Nullability sweep's report, `nullability-sweep.md` in the research
 * docs: a header, then one section per Slice, headed `## <probe>` with the
 * Probe's name in a code span. This module writes a Slice's section as
 * Markdown that Prettier leaves as it is, and puts it into the report in
 * place of the Slice's previous one, keeping every other section. Pure: the
 * report's text in, its new text out.
 */
import type { CaseResult, Comparison, Verdict } from "./verdict.js";

/** One Native of a Slice: its cases in the order they ran, and the conclusions. */
export interface NativeSection {
  native: string;
  cases: readonly CaseResult[];
  verdict: Verdict;
  /** The Overlay's `returns.nullable` for the Native. */
  overlayNullable: boolean;
  comparison: Comparison;
  /** The proposed `notes` text. */
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
  /** The Natives, in the order the Probe first called them. */
  natives: readonly NativeSection[];
}

/** What the report starts with when the command creates it. */
export const REPORT_HEADER = `# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by \`pnpm probe:nullability-report <probe>\` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases, compared with the Overlay's \`returns.nullable\`, and a proposed \`notes\` text. The command never writes the Overlay: every change to it goes through review.
`;

/** One column of a Native's table: its header and each case's cell, as Markdown. */
interface Column {
  header: string;
  cell: (testCase: CaseResult) => string;
}

/** The columns of a Native's table, left to right. */
const COLUMNS: readonly Column[] = [
  { header: "Case", cell: ({ label }) => text(label) },
  { header: "Group", cell: ({ group }) => `(${group})` },
  { header: "Outcome", cell: ({ outcome }) => outcome },
  { header: "Id", cell: ({ id }) => (id === undefined ? "" : text(id)) },
  {
    header: "Type",
    cell: ({ type }) => (type === undefined ? "" : code(type)),
  },
];

/**
 * Text in a table cell: each `\`, `|` and character Markdown could read as
 * formatting escaped, so a label shows as it is.
 */
function text(value: string): string {
  return value.replace(/[\\`*_[\]<>|#]/g, (character) => `\\${character}`);
}

/**
 * A value in a code span inside a table cell, with its `|` escaped as GFM
 * tables require; a backtick in the value lengthens the span's fences.
 */
function code(value: string): string {
  const longest = Math.max(
    0,
    ...(value.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longest + 1);
  const padded =
    value.startsWith("`") || value.endsWith("`") ? ` ${value} ` : value;
  return `${fence}${padded.replaceAll("|", "\\|")}${fence}`;
}

/**
 * A Markdown table as Prettier writes it: each column as wide as its
 * widest cell, at least 3, the cells padded with spaces, the delimiter row
 * of dashes.
 */
function table(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string[] {
  const widths = headers.map((header, column) =>
    Math.max(
      3,
      header.length,
      ...rows.map((row) => (row[column] ?? "").length),
    ),
  );
  const line = (cells: readonly string[]) =>
    `| ${cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(" | ")} |`;
  return [
    line(headers),
    line(widths.map((width) => "-".repeat(width))),
    ...rows.map(line),
  ];
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
    `- Verdict: ${native.verdict}`,
    `- Overlay \`returns.nullable\`: \`${String(native.overlayNullable)}\``,
    `- Comparison: ${native.comparison}`,
    `- Proposed \`notes\`: ${text(native.notes)}`,
  ];
}

/** The heading of the Slice of `probe`, which keys its section. */
function sectionHeading(probe: string): string {
  return `## \`${probe}\``;
}

/** A Slice's section: its heading, the run it reports, then each Native. */
export function formatSection(slice: SliceSection): string {
  const lines = [
    sectionHeading(slice.probe),
    "",
    `- Probe: \`${slice.probe}\``,
    `- Patch: ${slice.patch}`,
    `- Date: ${slice.date}`,
    `- Run: \`${slice.runId}\``,
    ...slice.natives.flatMap((native) => ["", ...nativeLines(native)]),
  ];
  return `${lines.join("\n")}\n`;
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
