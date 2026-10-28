/**
 * How the coverage check (`spec-check.ts`) and the claim check
 * (`claim-check.ts`) read an issue's body: its sections, its list items and
 * a Ticket's criteria, by the rule of `docs/agents/issue-tracker.md`, "A
 * Spec's coverage". Self-contained on purpose, as the claim check is: no
 * import and erasable syntax only, so that Node runs it from a checkout
 * with no install and no build.
 */

/** Whether `line` opens or closes a fenced code block. */
export const isFence = (line: string): boolean => /^\s*(?:```|~~~)/.test(line);

/** The lines of `text`. */
export const linesOf = (text: string): string[] => text.split(/\r?\n/);

/** `parts` joined on one line, single spaces between words. */
export const oneLine = (parts: readonly string[]): string =>
  parts.join(" ").replace(/\s+/g, " ").trim();

/** The sections of `body`, by their level-two heading in lower case; text before the first is under `""`. */
export function sections(body: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  let lines: string[] = [];
  found.set("", lines);
  let fence = false;
  for (const line of linesOf(body)) {
    if (isFence(line)) fence = !fence;
    const heading = fence ? null : /^##\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading === null) {
      lines.push(line);
      continue;
    }
    lines = [];
    found.set(heading[1].toLowerCase(), lines);
  }
  return found;
}

/** The width of the leading white space of `line`, a tab counting four. */
export const indentOf = (line: string): number =>
  (/^[ \t]*/.exec(line)?.[0] ?? "").replaceAll("\t", "    ").length;

/** A list item's first line: its indent, its marker and its text. */
export const LIST_ITEM = /^([ \t]*)([-*+]|\d+[.)])([ \t]+)(.*)$/;

/** Text as the check compares it: no bold markers, straight quotes, single spaces. */
export function normalize(text: string): string {
  return text
    .replaceAll("**", "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** The section of a Ticket that holds its criteria. */
const CRITERIA_SECTION = "acceptance criteria";

/** A criterion's first line: its indent, its box and its text. */
const CHECKBOX = /^([ \t]*)[-*+][ \t]+\[([ xX])\][ \t]+(.*)$/;

/** The line that records the outcome of a "check whether…". */
const OUTCOME = /^\s*Outcome:/;

/** A criterion of a Ticket. */
export interface Criterion {
  /** Its text, without its box and its `Outcome:` line, on one line. */
  text: string;
  checked: boolean;
  /** Whether an `Outcome:` line follows it in the same list item. */
  outcome: boolean;
}

/**
 * The criteria of a Ticket's `body`: the checklist items of its Acceptance
 * criteria, or of the whole body when it has no such section.
 */
export function criteriaOf(body: string): Criterion[] {
  const lines = sections(body).get(CRITERIA_SECTION) ?? linesOf(body);
  const found: {
    indent: number;
    checked: boolean;
    text: string[];
    outcome: boolean;
  }[] = [];
  let current: (typeof found)[number] | null = null;
  let blank = false;
  let inOutcome = false;
  let fence = false;
  for (const line of lines) {
    if (isFence(line)) fence = !fence;
    if (fence) continue;
    const box = CHECKBOX.exec(line);
    if (box !== null) {
      current = {
        indent: indentOf(line),
        checked: box[2] !== " ",
        text: [box[3]],
        outcome: false,
      };
      found.push(current);
      blank = false;
      inOutcome = false;
      continue;
    }
    if (line.trim() === "") {
      blank = true;
      continue;
    }
    if (
      current === null ||
      LIST_ITEM.test(line) ||
      (blank && indentOf(line) <= current.indent)
    ) {
      current = null;
      continue;
    }
    if (OUTCOME.test(line)) {
      current.outcome = true;
      inOutcome = true;
    } else if (!inOutcome) {
      current.text.push(line.trim());
    }
    blank = false;
  }
  return found.map(({ checked, text, outcome }) => ({
    text: oneLine(text),
    checked,
    outcome,
  }));
}

/**
 * Whether a criterion is a "check whether…": it opens with the words, bold
 * or not; one that only mentions a "check whether…" is not one.
 */
export const isCheckWhether = (criterion: Criterion): boolean =>
  /^check whether\b/i.test(normalize(criterion.text));
