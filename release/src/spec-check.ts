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
 * "A Spec's coverage", with which items a row's quote covers and which
 * table of the section is the Coverage table; this module reads by them
 * and restates none. A Ticket's criteria and their gaps are read by
 * `issue-markdown.ts`, which the claim check shares. A quoted cell is
 * found in a text that contains it, once both are read without bold
 * markers, with straight quotes and single spaces. `renderVerdict` writes
 * the verdict as the CLI prints it, and the claim check comments it when a
 * Spec's last Ticket closes (#796).
 *
 * Self-contained on purpose, as the claim check is: Node built-ins only and
 * erasable syntax only, `issue-markdown.ts` imported by its `.ts` name, so
 * that the claim check imports it and Node runs both from a checkout with
 * no install and no build. `readSpec` takes the GraphQL call rather than
 * importing one; `BOARD_REPOSITORIES`, `issueKey`, `isRecord` and `plural`
 * are copied from the others, and a test holds the list equal to the
 * board's.
 */
import {
  criteriaOf,
  gapsOf,
  indentOf,
  isFence,
  LIST_ITEM,
  normalize,
  oneLine,
  sections,
  type CriterionGap,
} from "./issue-markdown.ts";

/** An issue named by its repository (`owner/name`) and number. */
export interface IssueRef {
  repository: string;
  number: number;
}

/**
 * The repositories the Claim board spans, as `owner/name`: a sub-issue of
 * another repository is no Ticket. A copy of `BOARD_REPOSITORIES` of
 * `board.ts`, since this script imports nothing; a test holds them equal.
 */
export const BOARD_REPOSITORIES: readonly string[] = [
  "phmilk/reforged-ts",
  "phmilk/reforged-ts-template",
];

/** `owner/name#number`. */
const issueKey = ({ repository, number }: IssueRef): string =>
  `${repository}#${String(number)}`;

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `count` with the noun that agrees with it: `1 item`, `2 items`. */
const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

/** A sub-issue of the Spec, as GitHub returns it. */
export interface FetchedTicket extends IssueRef {
  state: "OPEN" | "CLOSED";
  /** When it last closed, ISO 8601; `null` while open. */
  closedAt: string | null;
  /**
   * Why it closed, GitHub's `IssueStateReason` as written (`COMPLETED`,
   * `NOT_PLANNED`, `DUPLICATE`, `REOPENED` today), so that a value GitHub
   * adds later still shows; `null` when GitHub gives none.
   */
  stateReason: string | null;
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
 * sub-issue of the Spec, or a sub-issue outside the Board repositories, or
 * a criterion its Ticket does not hold; a Ticket
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
      /** A sub-issue of the Spec, in a repository outside the Claim board. */
      kind: "outside-board";
      item: string;
      ticket: IssueRef;
    }
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
  | { kind: "not-completed"; ticket: IssueRef; reason: string | null }
  | { kind: CriterionGap; ticket: IssueRef; criterion: string };

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

/** A list item that is only a bold label, `**The claim check:**`. */
const BOLD_LABEL = /^\*\*[^*]+\*\*$/;

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

/** `issue` stripped to its repository and number. */
const bareRef = ({ repository, number }: IssueRef): IssueRef => ({
  repository,
  number,
});

/** Whether a sub-issue lives in a Board repository, and so is a Ticket. */
const onBoard = (subIssue: FetchedTicket): boolean =>
  BOARD_REPOSITORIES.includes(subIssue.repository);

/** Whether `a` and `b` are the same issue. */
const sameIssue = (a: IssueRef, b: IssueRef): boolean =>
  a.repository.toLowerCase() === b.repository.toLowerCase() &&
  a.number === b.number;

/**
 * The gaps of the items: each item no row covers, then each row whose
 * quote is found in no item or in items of different texts. Which items a
 * quote covers is the issue tracker doc's ("The Coverage table", the Item
 * column); of items written twice, a row covers the first no earlier row
 * covered.
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

/**
 * The gaps of the rows: a Ticket they do not name, that is no sub-issue of
 * `subIssues`, that is a sub-issue outside the Board repositories, and so
 * no Ticket, or that lacks the criterion.
 */
function rowGaps(
  rows: readonly Row[],
  home: string,
  subIssues: readonly FetchedTicket[],
): Gap[] {
  const tickets = subIssues.filter(onBoard);
  const outside = subIssues.filter((ticket) => !onBoard(ticket));
  return rows.flatMap((row): Gap[] => {
    const ref = ticketNamedBy(row.ticket, home);
    if (ref === null) return [{ kind: "no-ticket", item: row.item }];
    const ticket = tickets.find((candidate) => sameIssue(candidate, ref));
    if (ticket === undefined) {
      return [
        {
          kind: outside.some((candidate) => sameIssue(candidate, ref))
            ? "outside-board"
            : "not-sub-issue",
          item: row.item,
          ticket: ref,
        },
      ];
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
            ticket: bareRef(ticket),
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
  const ref = bareRef(ticket);
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
    for (const kind of gapsOf(criterion)) {
      gaps.push({ kind, ticket: ref, criterion: criterion.text });
    }
  }
  return gaps;
}

/** The verdict on `spec`. */
export function coverageVerdict(spec: FetchedSpec): Verdict {
  const tickets = spec.tickets.filter(onBoard);
  const parts = sections(spec.body);
  const items = ITEM_SECTIONS.flatMap((name) => itemsOf(parts.get(name) ?? []));
  const rows = tableOf(parts.get(TABLE_SECTION) ?? []);
  const gaps: Gap[] = [
    ...(rows === null
      ? [{ kind: "no-table" } as const]
      : [
          ...itemGaps(items, rows),
          ...rowGaps(rows, spec.repository, spec.tickets),
        ]),
    ...tickets.flatMap(ticketGaps),
  ];
  return {
    gaps,
    items: items.length,
    rows: rows?.length ?? 0,
    tickets: tickets.length,
  };
}

// The verdict as text.

/** `ref` as printed for a Spec of repository `home`: `#n` there, else in full. */
const displayRef = (home: string, ref: IssueRef): string =>
  ref.repository === home ? `#${String(ref.number)}` : issueKey(ref);

/** One gap as a line of the verdict, its Tickets named from repository `home`. */
export function describeGap(home: string, gap: Gap): string {
  switch (gap.kind) {
    case "no-table":
      return "No Coverage table: the Spec's body has no ## Coverage table section with a table.";
    case "no-row":
      return `No row for the item "${gap.item}".`;
    case "no-item":
      return `The row of "${gap.item}" quotes no item of the Spec.`;
    case "ambiguous-row":
      return `The row of "${gap.item}" quotes words found in ${plural(gap.items, "item", "items")} of different texts, so it covers none: quote enough to name one.`;
    case "no-ticket":
      return `The row of "${gap.item}" names no Ticket.`;
    case "not-sub-issue":
      return `The row of "${gap.item}" names ${displayRef(home, gap.ticket)}, which is not a sub-issue of the Spec.`;
    case "outside-board":
      return `The row of "${gap.item}" names ${displayRef(home, gap.ticket)}, a sub-issue of the Spec outside the Board repositories (${BOARD_REPOSITORIES.join(", ")}), so no Ticket.`;
    case "no-criterion":
      return `The row of "${gap.item}" quotes the criterion "${gap.criterion}", which ${displayRef(home, gap.ticket)} does not hold.`;
    case "open":
      return `${displayRef(home, gap.ticket)} is open, held by ${
        gap.assignees.length === 0
          ? "nobody"
          : gap.assignees.map((login) => `@${login}`).join(", ")
      }, ${
        gap.unchecked === 0
          ? "with every criterion checked"
          : `with ${plural(gap.unchecked, "criterion", "criteria")} unchecked`
      }.`;
    case "not-completed":
      return `${displayRef(home, gap.ticket)} closed ${gap.reason === null ? "with no reason given" : `as ${gap.reason}`}, not as completed.`;
    case "unchecked":
      return `${displayRef(home, gap.ticket)} leaves a criterion unchecked: "${gap.criterion}".`;
    case "no-outcome":
      return `${displayRef(home, gap.ticket)} has a "check whether…" without its Outcome: line: "${gap.criterion}".`;
  }
}

/** What the verdict counts, `3 items, 3 rows, 2 Tickets`. */
export const verdictCounts = (verdict: Verdict): string =>
  `${plural(verdict.items, "item", "items")}, ${plural(verdict.rows, "row", "rows")}, ` +
  plural(verdict.tickets, "Ticket", "Tickets");

/** The verdict on `spec`, as `pnpm spec:check` prints it. */
export function renderVerdict(spec: FetchedSpec, verdict: Verdict): string {
  const head =
    `Spec #${String(spec.number)} of ${spec.repository}, "${spec.title}": ` +
    `${verdictCounts(verdict)}.\n`;
  if (verdict.gaps.length === 0) {
    return (
      head +
      "Delivered: every item has a row, every Ticket closed as completed, " +
      'every criterion is checked and every "check whether…" carries its Outcome. ' +
      "The Spec may close.\n"
    );
  }
  return (
    head +
    `Not delivered, ${plural(verdict.gaps.length, "gap", "gaps")}:\n` +
    verdict.gaps
      .map((gap) => `- ${describeGap(spec.repository, gap)}\n`)
      .join("")
  );
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

/**
 * A GraphQL call: `query` with `variables` in, the answer's `data` out; it
 * throws on an error answer.
 */
export type GraphQl = (
  query: string,
  variables: Readonly<Record<string, unknown>>,
) => Promise<Record<string, unknown>>;

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
          number state stateReason closedAt body
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
    stateReason: typeof node.stateReason === "string" ? node.stateReason : null,
    closedAt: typeof node.closedAt === "string" ? node.closedAt : null,
    assignees: nodesOf(node.assignees).flatMap((user) =>
      isRecord(user) && typeof user.login === "string" ? [user.login] : [],
    ),
    body: typeof node.body === "string" ? node.body : "",
  };
}

/**
 * Spec `number` of `repository` (`owner/name`) with every sub-issue, in
 * either Board repository or any other, through `query`, a GraphQL call
 * that answers the `data` or throws. An error when the issue is missing,
 * is not labelled `spec`, or has more sub-issues than one page reads.
 */
export async function readSpec(
  query: GraphQl,
  repository: string,
  number: number,
): Promise<FetchedSpec> {
  const [owner, name] = repository.split("/");
  const data = await query(SPEC_COVERAGE, { owner, name, number });
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
