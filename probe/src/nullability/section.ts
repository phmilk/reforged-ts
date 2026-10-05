/**
 * The Nullability sweep's report, `nullability-sweep.md` in the research
 * docs: a header, then one section per Slice, headed `## <probe>` with the
 * Probe's name in a code span. This module writes a Slice's section as
 * Markdown, formatted by Prettier itself, so the report passes the
 * workspace's Prettier check, and puts it into the report in place of the
 * Slice's previous one, keeping every other section, and reads back what
 * a previous section says to tell what changed from it. Pure: the
 * report's text in, its new text out.
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
  /**
   * The Build of the game client the run was run on, as `probe:run`
   * recorded it; undefined when the run recorded none.
   */
  client?: string;
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

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by \`pnpm probe:nullability-report <probe>\` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases and its Nullability family, compared with the Overlay's \`returns.nullable\`, and a proposed \`notes\` text; a Native is a \`mismatch\` when the Overlay types it non-null and its verdict is neither \`non-null (evidence)\` nor \`non-null (evidence, handle id 0 or -1)\`, \`unsafe\`, \`review\` and \`nullable (placeholder)\` included. An \`unsafe\` Native, one with a case that crashed the game, is proposed nullable, and so is a \`nullable (placeholder)\` one, a constructor or a registration that returned a Placeholder handle (id 0 or -1) in place of nothing. Each parameter measured by call cases gets a verdict from them, compared with the Overlay's \`params[].nullable\`, and a proposed sentence of its Native's \`notes\`, since the Overlay has no \`params[].notes\`. A converter backed non-null gets condensed \`notes\`, the measured fact instead of its case list. The command never writes the Overlay: \`pnpm probe:nullability-curate <probe>\` applies a Slice's verdicts to it, and every change goes through review.
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
    `- Client: ${slice.client ?? "not recorded"}`,
    `- Date: ${slice.date}`,
    `- Run: \`${slice.runId}\``,
    ...slice.natives.flatMap((native) => ["", ...nativeLines(native)]),
    ...slice.params.flatMap((param) => ["", ...paramLines(param)]),
  ];
  return format(`${lines.join("\n")}\n`, { parser: "markdown" });
}

/** What a section says of one Native or parameter: its verdict and its cases' outcomes. */
interface PreviousPart {
  verdict: string;
  /** Each case's outcome, by its label as the table shows it. */
  outcomes: Map<string, string>;
}

/**
 * A Slice's section as the report holds it, read back to tell what a run
 * changed: the Patch it was written under, and its Natives and parameters,
 * by their heading's name (`CreateTimer`, `EnumItemsInRect parameter
 * filter`), in order.
 */
export interface PreviousSection {
  patch: string;
  natives: Map<string, PreviousPart>;
  params: Map<string, PreviousPart>;
}

/** The text of a table cell or a list item, its escapes undone (`text`). */
function unescape(cell: string): string {
  return cell.replace(/\\(.)/g, "$1");
}

/** The cells of a table row, split on the pipes no backslash escapes, trimmed. */
function cells(row: string): string[] {
  return row
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

/**
 * The section of `probe` in `report`, read back; undefined when the
 * report, or its section, does not exist, or the section names no Patch.
 * A part's table gives each case's outcome under its `Outcome` column; its
 * `- Verdict:` line, its verdict.
 */
export function readSection(
  report: string | undefined,
  probe: string,
): PreviousSection | undefined {
  const lines = (report ?? "").split("\n");
  const start = lines.indexOf(sectionHeading(probe));
  if (start === -1) return undefined;
  const next = lines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );
  const section = lines.slice(start + 1, next === -1 ? undefined : next);
  const patch = section
    .find((line) => line.startsWith("- Patch: "))
    ?.slice("- Patch: ".length);
  if (patch === undefined) return undefined;
  const read: PreviousSection = {
    patch,
    natives: new Map(),
    params: new Map(),
  };
  let part: PreviousPart | undefined;
  let outcomeColumn = -1;
  for (const line of section) {
    const nativeHeading = /^### `([^`]+)`$/.exec(line);
    const paramHeading = /^### `([^`]+)` parameter `([^`]+)`$/.exec(line);
    const heading = nativeHeading ?? paramHeading;
    if (heading !== null) {
      part = { verdict: "", outcomes: new Map() };
      const [, native, param] = heading;
      if (nativeHeading !== null) read.natives.set(native, part);
      else read.params.set(paramName(native, param), part);
      outcomeColumn = -1;
    } else if (part !== undefined && line.startsWith("|")) {
      const row = cells(line);
      if (outcomeColumn === -1) outcomeColumn = row.indexOf("Outcome");
      else if (!/^-+$/.test(row[0] ?? "")) {
        part.outcomes.set(unescape(row[0] ?? ""), row[outcomeColumn] ?? "");
      }
    } else if (part !== undefined && line.startsWith("- Verdict: ")) {
      part.verdict = line.slice("- Verdict: ".length);
    }
  }
  return read;
}

/** A parameter's name in the changes: `EnumItemsInRect parameter filter`. */
function paramName(native: string, param: string): string {
  return `${native} parameter ${param}`;
}

/**
 * What changed from `previous`, the section the report held, to `slice`,
 * one line each, for the pull request that adopts the Build: for each
 * Native, then each parameter, in the order of `slice`, a verdict that
 * differs (a new `unsafe` flagged), then each case whose outcome differs,
 * each case added, each case gone; then each Native and parameter gone. A
 * handle's id or type is not a change. Empty when nothing changed.
 */
export function sectionChanges(
  previous: PreviousSection,
  slice: SliceSection,
): string[] {
  const current = [
    ...slice.natives.map(
      (native) =>
        [
          native.native,
          native.verdict,
          native.cases,
          previous.natives,
        ] as const,
    ),
    ...slice.params.map(
      (param) =>
        [
          paramName(param.native, param.param),
          param.verdict,
          param.cases,
          previous.params,
        ] as const,
    ),
  ];
  const changes: string[] = [];
  for (const [name, verdict, cases, parts] of current) {
    const part = parts.get(name);
    if (part === undefined) {
      changes.push(`${name}: added, ${verdict}`);
      continue;
    }
    if (part.verdict !== verdict) {
      changes.push(
        `${name}: verdict ${part.verdict} -> ${verdict}${verdict === "unsafe" ? ", a new unsafe" : ""}`,
      );
    }
    const labels = new Set<string>();
    for (const { label, outcome } of cases) {
      const shown = oneLine(label);
      labels.add(shown);
      const before = part.outcomes.get(shown);
      if (before === undefined) {
        changes.push(`${name} case ${shown}: added, ${outcome}`);
      } else if (before !== outcome) {
        changes.push(`${name} case ${shown}: ${before} -> ${outcome}`);
      }
    }
    for (const label of part.outcomes.keys()) {
      if (!labels.has(label)) changes.push(`${name} case ${label}: gone`);
    }
  }
  const names = new Set(current.map(([name]) => name));
  for (const name of [...previous.natives.keys(), ...previous.params.keys()]) {
    if (!names.has(name)) changes.push(`${name}: gone`);
  }
  return changes;
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
