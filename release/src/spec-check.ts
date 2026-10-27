/**
 * The coverage check, `pnpm spec:check <spec> [owner/name]`: whether a Spec
 * is fully delivered, on evidence, before it closes (ADR 0023). It has the
 * board's shape: `readSpec` reads the Spec's body and every sub-issue
 * (state and close reason, assignees, body) through the GitHub GraphQL
 * API, `coverageVerdict` computes the verdict from them as a pure function,
 * and `cli/spec-check.ts` prints it.
 *
 * What an item is, what the Coverage table holds and where the outcome of
 * a "check whether…" goes are stated once, in `docs/agents/issue-tracker.md`,
 * "A Spec's coverage"; this module reads by them. A quoted cell is found
 * in a text that contains it, once both are read without bold markers,
 * with straight quotes and single spaces. A row covers the one item its
 * quote identifies: a quote found in items of different texts covers none
 * of them (`itemGaps` has the rule), so "quoted short enough to find"
 * means short enough, and long enough to name one item.
 */
import { BOARD_REPOSITORIES, issueKey, type IssueRef } from "./board.js";
import { graphql } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import { isRecord } from "./unknown.js";

/** GitHub's `IssueStateReason`: why an issue closed, or that it was reopened. */
export type StateReason =
  "COMPLETED" | "NOT_PLANNED" | "DUPLICATE" | "REOPENED";

const STATE_REASONS: readonly string[] = [
  "COMPLETED",
  "NOT_PLANNED",
  "DUPLICATE",
  "REOPENED",
] satisfies StateReason[];

/** Whether `value` is one of GitHub's `IssueStateReason`. */
const isStateReason = (value: unknown): value is StateReason =>
  typeof value === "string" && STATE_REASONS.includes(value);

/** A sub-issue of the Spec, as GitHub returns it. */
export interface FetchedTicket extends IssueRef {
  state: "OPEN" | "CLOSED";
  /** Why it closed; `null` when GitHub gives no reason (an issue never closed). */
  stateReason: StateReason | null;
  /** The logins assigned to it, in GitHub's order. */
  assignees: readonly string[];
  /** Its body, Markdown. */
  body: string;
}

/** The Spec as GitHub returns it, with its sub-issues in GitHub's order. */
export interface FetchedSpec extends IssueRef {
  title: string;
  /** Its body, Markdown. */
  body: string;
  tickets: readonly FetchedTicket[];
}

/**
 * One thing still missing before the Spec may close: no Coverage table; an
 * item with no row; a row whose quote is found in no item, or in items of
 * different texts; a row that names no Ticket, or one that is not a
 * sub-issue of the Spec, or a criterion its Ticket does not hold; a Ticket
 * still open, with its assignees, or closed otherwise than as completed; a
 * criterion unchecked; a "check whether…" without its `Outcome:` line.
 */
export type Gap =
  | { kind: "no-table" }
  | { kind: "no-row"; item: string }
  | { kind: "no-item"; item: string }
  | {
      kind: "ambiguous-row";
      item: string;
      /** How many items of different texts its quote is found in. */
      items: number;
    }
  | { kind: "no-ticket"; item: string }
  | { kind: "not-sub-issue"; item: string; ticket: IssueRef }
  | {
      kind: "open";
      ticket: IssueRef;
      assignees: string[];
      /** How many of its criteria are unchecked, counted rather than named. */
      unchecked: number;
    }
  | {
      kind: "no-criterion";
      item: string;
      ticket: IssueRef;
      criterion: string;
    }
  | { kind: "not-completed"; ticket: IssueRef; reason: StateReason | null }
  | { kind: "unchecked"; ticket: IssueRef; criterion: string }
  | { kind: "no-outcome"; ticket: IssueRef; criterion: string };

/** The coverage check's verdict: delivered when it holds no gap. */
export interface Verdict {
  /** Every gap found, in the order of the items, the rows, then the Tickets. */
  gaps: Gap[];
  /** How many items the Spec has, by the coverage rule. */
  items: number;
  /** How many rows its Coverage table has. */
  rows: number;
  /** How many Tickets it has: its sub-issues in the Board repositories. */
  tickets: number;
}

// Reading Markdown.

/** The sections of a Spec whose list items are its items (the coverage rule). */
const ITEM_SECTIONS = [
  "implementation decisions",
  "testing decisions",
  "further notes",
];

/** The heading of the Coverage table's section. */
const TABLE_SECTION = "coverage table";

/** Whether `line` opens or closes a fenced code block. */
const isFence = (line: string): boolean => /^\s*(?:```|~~~)/.test(line);

/** The lines of `text`. */
const linesOf = (text: string): string[] => text.split(/\r?\n/);

/** `parts` joined on one line, single spaces between words. */
const oneLine = (parts: readonly string[]): string =>
  parts.join(" ").replace(/\s+/g, " ").trim();

/** The sections of `body`, by their level-two heading in lower case; text before the first is under `""`. */
function sections(body: string): Map<string, string[]> {
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
const indentOf = (line: string): number =>
  (/^[ \t]*/.exec(line)?.[0] ?? "").replaceAll("\t", "    ").length;

/** A list item's first line: its indent, its marker and its text. */
const LIST_ITEM = /^([ \t]*)([-*+]|\d+[.)])([ \t]+)(.*)$/;

/** A list item that is only a bold label, `**The claim check:**`. */
const BOLD_LABEL = /^\*\*[^*]+\*\*$/;

/** Text as the check compares it: no bold markers, straight quotes, single spaces. */
function normalize(text: string): string {
  return text
    .replaceAll("**", "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The items of `lines` by the coverage rule: every list item and every
 * paragraph inside a list item, except a list item that is only a bold
 * label; each on one line.
 */
function itemsOf(lines: readonly string[]): string[] {
  const items: string[] = [];
  /** The content indents of the list items open around the current line. */
  const open: number[] = [];
  let current: string[] | null = null;
  let blank = false;
  let fence = false;
  const flush = () => {
    if (current !== null) {
      const text = oneLine(current);
      if (text !== "" && !BOLD_LABEL.test(text)) items.push(text);
    }
    current = null;
  };
  const closeAbove = (indent: number) => {
    while (open.length > 0 && (open.at(-1) ?? 0) > indent) open.pop();
  };
  for (const line of lines) {
    if (isFence(line)) {
      flush();
      fence = !fence;
      continue;
    }
    if (fence) continue;
    if (line.trim() === "") {
      flush();
      blank = true;
      continue;
    }
    const indent = indentOf(line);
    const marker = LIST_ITEM.exec(line);
    if (marker !== null) {
      flush();
      closeAbove(indent);
      open.push(indent + marker[2].length + marker[3].length);
      current = [marker[4]];
    } else if (!blank) {
      current?.push(line.trim());
    } else {
      closeAbove(indent);
      if (open.length > 0) current = [line.trim()];
    }
    blank = false;
  }
  flush();
  return items;
}

/** One row of the Coverage table, its cells as written. */
interface Row {
  item: string;
  ticket: string;
  criterion: string;
}

/** The cells of a table line, `\|` read as `|`. */
function cellsOf(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));
}

/** The rows of the first table in `lines`, by its header; `null` when it holds no table. */
function tableOf(lines: readonly string[]): Row[] | null {
  const isRow = (line: string) => line.trim().startsWith("|");
  const start = lines.findIndex(isRow);
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && !isRow(line));
  const table = lines.slice(start, end === -1 ? undefined : end);
  const [header, ...body] = table.map(cellsOf);
  const column = (name: string, fallback: number) => {
    const found = header.findIndex((cell) => cell.toLowerCase() === name);
    return found === -1 ? fallback : found;
  };
  const [item, ticket, criterion] = [
    column("item", 0),
    column("ticket", 1),
    column("criterion", 2),
  ];
  return body
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)))
    .map((cells) => ({
      item: cells[item] ?? "",
      ticket: cells[ticket] ?? "",
      criterion: cells[criterion] ?? "",
    }));
}

/** The section of a Ticket that holds its criteria. */
const CRITERIA_SECTION = "acceptance criteria";

/** A criterion's first line: its indent, its box and its text. */
const CHECKBOX = /^([ \t]*)[-*+][ \t]+\[([ xX])\][ \t]+(.*)$/;

/** The line that records the outcome of a "check whether…". */
const OUTCOME = /^\s*Outcome:/;

/** A criterion of a Ticket. */
interface Criterion {
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
function criteriaOf(body: string): Criterion[] {
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
const isCheckWhether = (criterion: Criterion): boolean =>
  /^check whether\b/i.test(normalize(criterion.text));

// The verdict.

/**
 * The issue a Ticket cell names: `#761` in the Spec's repository `home`,
 * `owner/name#121`, or an issue's address; `null` when it names none.
 */
function ticketNamedBy(cell: string, home: string): IssueRef | null {
  const address = /github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)/.exec(cell);
  const ref = address ?? /(?:([\w.-]+\/[\w.-]+))?#(\d+)/.exec(cell);
  if (ref === null) return null;
  return { repository: ref.at(1) ?? home, number: Number(ref[2]) };
}

/** The repository and number of `issue`, and nothing else. */
const refOfIssue = ({ repository, number }: IssueRef): IssueRef => ({
  repository,
  number,
});

/** Whether `a` and `b` are the same issue. */
const sameIssue = (a: IssueRef, b: IssueRef): boolean =>
  a.repository.toLowerCase() === b.repository.toLowerCase() &&
  a.number === b.number;

/**
 * The gaps of the items: each item no row covers, then each row whose
 * quote identifies no item. A row covers the one item its Item cell is
 * found in. A quote found in items of different texts identifies none of
 * them and covers nothing, so a short, generic quote cannot cover what it
 * was not written for; a quote found in several items of the same text
 * (the same words in two sections) covers the first of them no earlier
 * row covered. A quote found in no item covers nothing.
 */
function itemGaps(items: readonly string[], rows: readonly Row[]): Gap[] {
  const texts = items.map(normalize);
  const covered = new Set<number>();
  const quoteGaps: Gap[] = [];
  for (const row of rows) {
    const quote = normalize(row.item);
    const found = texts.flatMap((text, index) =>
      quote !== "" && text.includes(quote) ? [index] : [],
    );
    if (found.length === 0) {
      quoteGaps.push({ kind: "no-item", item: row.item });
    } else if (new Set(found.map((index) => texts[index])).size > 1) {
      quoteGaps.push({
        kind: "ambiguous-row",
        item: row.item,
        items: found.length,
      });
    } else {
      const free = found.find((index) => !covered.has(index));
      if (free !== undefined) covered.add(free);
    }
  }
  return [
    ...items.flatMap((item, index): Gap[] =>
      covered.has(index) ? [] : [{ kind: "no-row", item }],
    ),
    ...quoteGaps,
  ];
}

/** The gaps of the rows: a Ticket they do not name, is no sub-issue or lacks the criterion. */
function rowGaps(
  rows: readonly Row[],
  home: string,
  tickets: readonly FetchedTicket[],
): Gap[] {
  return rows.flatMap((row): Gap[] => {
    const ref = ticketNamedBy(row.ticket, home);
    if (ref === null) return [{ kind: "no-ticket", item: row.item }];
    const ticket = tickets.find((candidate) => sameIssue(candidate, ref));
    if (ticket === undefined) {
      return [{ kind: "not-sub-issue", item: row.item, ticket: ref }];
    }
    const quote = normalize(row.criterion);
    return criteriaOf(ticket.body).some((criterion) =>
      normalize(criterion.text).includes(quote),
    )
      ? []
      : [
          {
            kind: "no-criterion",
            item: row.item,
            ticket: refOfIssue(ticket),
            criterion: row.criterion,
          },
        ];
  });
}

/**
 * The gaps of one Ticket: open (its unchecked criteria counted, since they
 * are written as it is delivered), or closed otherwise than as completed,
 * with each criterion unchecked and each "check whether…" without its
 * outcome.
 */
function ticketGaps(ticket: FetchedTicket): Gap[] {
  const ref = refOfIssue(ticket);
  const criteria = criteriaOf(ticket.body);
  if (ticket.state === "OPEN") {
    return [
      {
        kind: "open",
        ticket: ref,
        assignees: [...ticket.assignees],
        unchecked: criteria.filter((criterion) => !criterion.checked).length,
      },
    ];
  }
  const gaps: Gap[] =
    ticket.stateReason === "COMPLETED"
      ? []
      : [{ kind: "not-completed", ticket: ref, reason: ticket.stateReason }];
  for (const criterion of criteria) {
    if (!criterion.checked) {
      gaps.push({ kind: "unchecked", ticket: ref, criterion: criterion.text });
    }
    if (isCheckWhether(criterion) && !criterion.outcome) {
      gaps.push({ kind: "no-outcome", ticket: ref, criterion: criterion.text });
    }
  }
  return gaps;
}

/** The verdict on `spec`. */
export function coverageVerdict(spec: FetchedSpec): Verdict {
  const tickets = spec.tickets.filter((ticket) =>
    BOARD_REPOSITORIES.includes(ticket.repository),
  );
  const parts = sections(spec.body);
  const items = ITEM_SECTIONS.flatMap((name) => itemsOf(parts.get(name) ?? []));
  const rows = tableOf(parts.get(TABLE_SECTION) ?? []);
  const gaps: Gap[] = [
    ...(rows === null
      ? [{ kind: "no-table" } as const]
      : [...itemGaps(items, rows), ...rowGaps(rows, spec.repository, tickets)]),
    ...tickets.flatMap(ticketGaps),
  ];
  return {
    gaps,
    items: items.length,
    rows: rows?.length ?? 0,
    tickets: tickets.length,
  };
}

// Reading the Spec from GitHub.

/** The label of a Spec, as `to-spec` and `write-spec` set it. */
export const SPEC_LABEL = "spec";

/** An answer the check cannot read. */
export class SpecCheckError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SpecCheckError";
  }
}

/** More sub-issues than a Spec splits into: the query reads them in one page. */
const TICKET_PAGE = 100;

// An issue holds at most ten assignees: one page of ten reads them all.
const SPEC_COVERAGE = `query SpecCoverage($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      title
      body
      labels(first: 50) { nodes { name } }
      subIssues(first: ${String(TICKET_PAGE)}) {
        totalCount
        nodes {
          number state stateReason body
          repository { nameWithOwner }
          assignees(first: 10) { nodes { login } }
        }
      }
    }
  }
}`;

/** The `nodes` of a GraphQL connection, or none. */
function nodesOf(connection: unknown): unknown[] {
  return isRecord(connection) && Array.isArray(connection.nodes)
    ? (connection.nodes as unknown[])
    : [];
}

/** A Ticket from its sub-issue node, or an error naming the Spec `spec`. */
function ticketOf(node: unknown, spec: string): FetchedTicket {
  const repository =
    isRecord(node) && isRecord(node.repository)
      ? node.repository.nameWithOwner
      : undefined;
  if (
    !isRecord(node) ||
    typeof repository !== "string" ||
    typeof node.number !== "number" ||
    (node.state !== "OPEN" && node.state !== "CLOSED")
  ) {
    throw new SpecCheckError(
      `SpecCoverage answered a sub-issue of ${spec} without a number, a repository and a state.`,
    );
  }
  return {
    repository,
    number: node.number,
    state: node.state,
    stateReason: isStateReason(node.stateReason) ? node.stateReason : null,
    assignees: nodesOf(node.assignees).flatMap((user) =>
      isRecord(user) && typeof user.login === "string" ? [user.login] : [],
    ),
    body: typeof node.body === "string" ? node.body : "",
  };
}

/**
 * Spec `number` of `repository` (`owner/name`) with every sub-issue, in
 * either Board repository or any other, through `api`. An error when the
 * issue is missing, is not labelled `spec`, or has more sub-issues than
 * one page reads.
 */
export async function readSpec(
  api: GitHubApi,
  repository: string,
  number: number,
): Promise<FetchedSpec> {
  const [owner, name] = repository.split("/");
  const data = await graphql(api, SPEC_COVERAGE, { owner, name, number });
  const where = issueKey({ repository, number });
  const repo = data.repository;
  const issue = isRecord(repo) ? repo.issue : undefined;
  if (!isRecord(issue)) {
    throw new SpecCheckError(`SpecCoverage answered no issue ${where}.`);
  }
  const labelled = nodesOf(issue.labels).some(
    (label) => isRecord(label) && label.name === SPEC_LABEL,
  );
  if (!labelled) {
    throw new SpecCheckError(
      `${where} is not a Spec: it is not labelled ${SPEC_LABEL}.`,
    );
  }
  const nodes = nodesOf(issue.subIssues);
  const total = isRecord(issue.subIssues)
    ? issue.subIssues.totalCount
    : undefined;
  if (typeof total !== "number" || total > nodes.length) {
    throw new SpecCheckError(
      `${where} has ${String(total)} sub-issues, more than the ${String(nodes.length)} read.`,
    );
  }
  return {
    repository,
    number,
    title: typeof issue.title === "string" ? issue.title : "",
    body: typeof issue.body === "string" ? issue.body : "",
    tickets: nodes.map((node) => ticketOf(node, where)),
  };
}
