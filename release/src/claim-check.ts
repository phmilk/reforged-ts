/**
 * The claim check (`claim / check`), the logic behind
 * `.github/workflows/claim-check.yml`: on a pull request, the issues of its
 * repository that it closes are claimed for its author, or fail the check
 * when another login holds them, and the author joins the Spec of each
 * Ticket among them (ADR 0023): assigned to a Spec of this repository, or
 * shown the command on the Ticket for a Spec of the other Board repository,
 * where the job's token cannot write. It also fails a pull request that
 * would close a Spec, or a Ticket with an open blocker it does not close
 * too (ADR 0025). On an assignment, a conflict draws a comment on the
 * issue; adding to a Spec a login that holds or delivered one of its
 * Tickets is none, nor is a login the maintainer adds. A Claim of an
 * unsplit Spec or of an issue with an open blocker draws a comment too,
 * and is never undone (ADR 0025). A Ticket the pull request closes with
 * criteria still unchecked, or a "check whether…" without its `Outcome:`
 * line, draws a comment on the pull request under `CRITERIA_MARKER` that
 * never weighs on the verdict (#792). The protocol is
 * `docs/agents/issue-tracker.md`, "Claim"; the texts are the spec's (#529),
 * the logins filled at run time, those of a Ticket's Spec follow ADR 0023,
 * and those of a Spec and of a blocker carry the rules of ADR 0025.
 * `planPullRequest` and `planIssue` are pure: the event and the fetched
 * state in; the verdict, the assignments, the comment upserts, the summary
 * lines and the exit code out. `main` reads the state through the GitHub
 * API with the token of the environment and applies the plan.
 *
 * Self-contained on purpose: Node built-ins only and erasable syntax only
 * (no enum, no namespace, no parameter property), so that Node 24 runs it
 * from a checkout with no install and no build, as the workflow does:
 * `node release/src/claim-check.ts <pull-request|issue>`. Of the other
 * release scripts it imports `issue-markdown.ts` alone, self-contained in
 * the same way and named by its `.ts` file, which Node runs and the build
 * rewrites (`rewriteRelativeImportExtensions`), so that a Ticket's criteria
 * and their gaps are read as `pnpm spec:check` reads them; `isRecord`, `errorMessage`,
 * the job summary and the "started directly" test are copied from the
 * others.
 */
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { criteriaOf, gapsOf } from "./issue-markdown.ts";

const USAGE = "Usage: node release/src/claim-check.ts <pull-request|issue>\n";

/** The hidden marker that opens the check's sticky comment. */
export const MARKER = "<!-- claim-check -->";

/**
 * The hidden marker of the check's comment on a Ticket whose Spec is of the
 * other Board repository; apart from `MARKER`, so that the issue branch's
 * comment on the same Ticket never overwrites it.
 */
export const SPEC_MARKER = "<!-- claim-check: spec -->";

/**
 * The hidden marker of the check's comment on a pull request that lists
 * the criteria its Tickets still lack; apart from `MARKER`, so that it is
 * settled on its own and never weighs on the verdict.
 */
export const CRITERIA_MARKER = "<!-- claim-check: criteria -->";

/**
 * The login the check writes as: `GITHUB_TOKEN` comments as GitHub Actions.
 * REST spells it with the `[bot]` suffix; the suffix-less spelling counts
 * only on a user of the `Bot` type.
 */
export const CHECK_LOGIN = "github-actions";

/** The head of texts 4, 5 and 6: a sticky comment holding it holds, or held, a conflict. */
const CONFLICT_HEAD = "**Claim conflict";

/** The head of text 2: a sticky comment holding it holds a failure. */
const FAILED_HEAD = "**Claim check failed.**";

/**
 * The most issues one run assigns the author to: a pull request that closes
 * more unclaimed issues than this claims none past it, so that one
 * description cannot claim a repository's backlog in one push.
 */
export const MAX_ASSIGNMENTS = 20;

/** `ref` as the comments name it from `repository`: `#n` there, `owner/name#n` elsewhere. */
const refName = (ref: IssueRef, repository: string): string =>
  ref.repository === repository
    ? `#${String(ref.number)}`
    : `${ref.repository}#${String(ref.number)}`;

/** `a`, `a and b`, `a, b and c`. */
const andList = (items: readonly string[]): string =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * The check's comment texts (#529, "The check's comment texts"), numbered as
 * there; the tests pin them word for word. `tooMany` is not the spec's: it
 * is the line of the assignment cap (`MAX_ASSIGNMENTS`); nor are
 * `specJoined`, `joinSpec` and `joinedSpec`, the lines of a Ticket's Spec
 * (ADR 0023), nor `specClosed`, `blocked`, `unsplitClaim` and
 * `blockedClaim`, the lines of a Spec and of a blocker (ADR 0025), nor
 * `prematureSettled`, which settles a comment that held premature Claims
 * only, as text 6 settles a conflict, nor `criteriaLeft`, `gapNames` and
 * `criteriaSettled`, the comment of a Ticket's criteria (#792).
 */
export const TEXTS = {
  /** 1. Assigned: an unclaimed issue, now the author's. */
  assigned: (issue: number, author: string): string =>
    `**Claim check.** Assigned #${String(issue)} to @${author}. Under the Claim protocol the Claim comes before the work: \`gh issue edit ${String(issue)} --add-assignee @me\`, as the first write. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** 2. Failed: an issue claimed by another login. */
  failed: (issue: number, assignee: string): string =>
    `${FAILED_HEAD} #${String(issue)} is claimed by @${assignee} (the assignee is the Claim: one login per issue), and this pull request would close it. Coordinate with them or, if the Claim is stale (3 days without a commit on their pull request and without a comment), take it over: comment on #${String(issue)} first, then \`gh issue edit ${String(issue)} --remove-assignee ${assignee} --add-assignee @me\`. Then re-run this check (Actions, "Re-run jobs") or push a commit. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** 3. Not assignable: GitHub will not assign the author. */
  notAssignable: (issue: number, author: string): string =>
    `**Claim check.** #${String(issue)} could not be assigned to @${author}: GitHub assigns only a login with push access or a comment on the issue. Comment on #${String(issue)} and re-run this check, or a maintainer assigns it.`,
  /** 4. Conflict: a second assignee not added by the first or by the owner. */
  secondAssignee: (issue: number, newcomer: string, first: string): string =>
    `${CONFLICT_HEAD}.** @${newcomer} was added to #${String(issue)}, which is claimed by @${first}: one login per issue, and a second assignee is added only by the first, for pairing. If the Claim is stale (3 days without a commit on its pull request and without a comment), take it over: comment, then \`gh issue edit ${String(issue)} --remove-assignee ${first}\`. Otherwise withdraw: \`gh issue edit ${String(issue)} --remove-assignee @me\`.`,
  /** 5. Conflict: an open pull request by a login outside the assignees. */
  openPullRequest: (
    issue: number,
    assignee: string,
    pullRequest: number,
    author: string,
  ): string =>
    `${CONFLICT_HEAD}.** @${assignee} claimed #${String(issue)}, but the open pull request #${String(pullRequest)} by @${author} closes it. One login per issue: coordinate, and leave one Claim and one pull request. A stale pull request (3 days without a commit and without a comment) may be taken over: comment on #${String(issue)} first.`,
  /** 6. The issue's conflict is gone. */
  resolved: `${CONFLICT_HEAD}** resolved.`,
  /** A comment that held premature Claims only, once none is left (ADR 0025). */
  prematureSettled: "**Premature Claim** settled.",
  /** 7. The pull request passes after a failure. */
  passed: "**Claim check** passed.",
  /** The author, missing from a Ticket's Spec, added to it. */
  specJoined: (spec: number, ticket: number, author: string): string =>
    `**Claim check.** Added @${author} to #${String(spec)}, the Spec of #${String(ticket)}: a Spec carries every login on its Tickets. Join it in the command that claims a Ticket: \`gh issue edit ${String(ticket)} ${String(spec)} --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** On the Ticket: the author, missing from its Spec in the other repository, joins it. */
  joinSpec: (
    spec: string,
    url: string,
    ticket: number,
    author: string,
  ): string =>
    `**Claim check.** @${author} is not among the assignees of ${spec}, the Spec of #${String(ticket)}, and the check cannot add them there: its token writes in this repository only. Join it: \`gh issue edit ${url} --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim", "A Spec's assignees".`,
  /** On the Ticket, once the author is on its Spec in the other repository: `joinSpec` settled. */
  joinedSpec: (spec: string, ticket: number, author: string): string =>
    `**Claim check.** @${author} is among the assignees of ${spec}, the Spec of #${String(ticket)}: nothing left to join.`,
  /** A pull request that would close a Spec (ADR 0025). */
  specClosed: (spec: number): string =>
    `${FAILED_HEAD} #${String(spec)} is a Spec, and this pull request would close it. A Spec is never closed by a pull request: name the Tickets this one delivers instead (\`Closes #<ticket>\`), and whoever merges the last of them closes the Spec after its coverage check. See \`docs/agents/issue-tracker.md\`, "Closing a Spec".`,
  /** A pull request that would close a Ticket ahead of its open blockers, named as `blockers` (ADR 0025). */
  blocked: (ticket: number, blockers: readonly string[]): string => {
    const them = blockers.length === 1 ? "it" : "them";
    return `${FAILED_HEAD} #${String(ticket)} is blocked by ${andList(blockers)}, still open, and this pull request would close it without ${them}. Deliver ${them} first, or in this pull request too (name ${them} among the issues it closes), then re-run this check. See \`docs/agents/issue-tracker.md\`, "Claim".`;
  },
  /** On an assignment: a Claim of a Spec with no Ticket (ADR 0025). */
  unsplitClaim: (spec: number): string =>
    `**Premature Claim.** #${String(spec)} is a Spec with no Ticket yet (\`needs-split\`), and it is assigned: an unsplit Spec is not worked, whole or in part. Split it first; each Ticket is then claimed with its Spec, \`gh issue edit <ticket> ${String(spec)} --add-assignee @me\`. Nothing was unassigned. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** On an assignment: a Claim of an issue with open blockers, named as `blockers` (ADR 0025). */
  blockedClaim: (issue: number, blockers: readonly string[]): string =>
    `**Premature Claim.** #${String(issue)} is claimed, but it is blocked by ${andList(blockers)}, still open: an issue is worked once its blockers are closed, or delivered with them in one pull request, as \`implement-spec\`'s is. Nothing was unassigned. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /**
   * A Ticket the pull request closes with criteria `pnpm spec:check` counts
   * as gaps, one line each in `gaps`: unchecked, or a "check whether…"
   * without its `Outcome:` line.
   */
  criteriaLeft: (ticket: number, gaps: readonly string[]): string =>
    `**Criteria left.** #${String(ticket)}, which this pull request closes, has what \`pnpm spec:check\` counts as gaps when its Spec closes:\n\n${gaps.join("\n")}\n\nCheck each box once the review confirms it holds, and write the outcome of each "check whether…" in an indented \`Outcome:\` line under it, in the body of #${String(ticket)}. This comment is updated on the pull request's next push or edit. See \`docs/agents/issue-tracker.md\`, "A Spec's coverage".`,
  /** How `criteriaLeft` names each gap of a criterion. */
  gapNames: { unchecked: "unchecked", "no-outcome": "no `Outcome:` line" },
  /** The criteria comment once no Ticket lacks any. */
  criteriaSettled: "**Criteria left:** none.",
  /** The cap: the issues past `MAX_ASSIGNMENTS` were not assigned. */
  tooMany: (issues: readonly number[]): string =>
    `**Claim check.** This pull request closes too many issues to claim them here: at most ${String(MAX_ASSIGNMENTS)} are assigned per run, and ${issues.map((issue) => `#${String(issue)}`).join(", ")} ${issues.length === 1 ? "was" : "were"} not. Claim each one yourself, as the first write: \`gh issue edit <n> --add-assignee @me\`.`,
} as const;

/** The Spec a Ticket is a sub-issue of, as the check read it. */
export interface ParentSpec {
  /** `owner/name`: this repository, or another Board repository. */
  repository: string;
  number: number;
  /** Its address on GitHub, for the command that joins it from elsewhere. */
  url: string;
  /** The logins assigned to it, in GitHub's order. */
  assignees: readonly string[];
  /**
   * Whether GitHub lets the pull request's author be assigned to it; asked
   * only of a Spec of this repository, the one the token writes in.
   */
  authorAssignable: boolean;
  /**
   * The check's comment on the Ticket that names the command joining this
   * Spec (`SPEC_MARKER`); read only for a Spec of another repository.
   */
  joinComment: StickyComment | null;
}

/** An issue a pull request closes, as the check read it. */
export interface ClosingIssue {
  /** `owner/name`; an issue of another repository is ignored. */
  repository: string;
  number: number;
  /** The logins assigned to it, in GitHub's order. */
  assignees: readonly string[];
  /**
   * Whether GitHub lets the pull request's author be assigned to it (push
   * access, or a comment on the issue), asked before any assignment.
   */
  authorAssignable: boolean;
  /** Its parent when that is a Spec (labelled `spec`): the issue is a Ticket. */
  spec: ParentSpec | null;
  /** Whether it is itself a Spec (labelled `spec`). */
  isSpec: boolean;
  /** The issues it is blocked by that are open, of any repository. */
  openBlockers: readonly IssueRef[];
  /** Its body, Markdown: a Ticket's criteria are read from it. */
  body: string;
}

/** An issue named by its repository (`owner/name`) and number. */
export interface IssueRef {
  repository: string;
  number: number;
}

/** A pull request that references an issue as closed by it, with its own state. */
export interface ClosingPullRequest {
  /** `owner/name`; a pull request of another repository is ignored. */
  repository: string;
  number: number;
  author: string;
  /** Whether the author is a bot: outside the protocol. */
  bot: boolean;
  /** `closedByPullRequestsReferences` returns merged ones too: only `OPEN` counts. */
  state: "OPEN" | "CLOSED" | "MERGED";
}

/** The sticky comment the check already left on an issue or a pull request. */
export interface StickyComment {
  id: number;
  body: string;
}

/** The pull-request branch's input: the event and what was fetched. */
export interface PullRequestInput {
  /** The repository the event is of, `owner/name`. */
  repository: string;
  pullRequest: { number: number; author: string };
  /** The issues the pull request closes, of any repository. */
  closing: readonly ClosingIssue[];
  comment: StickyComment | null;
  /** The check's comment on the pull request under `CRITERIA_MARKER`. */
  criteriaComment: StickyComment | null;
}

/** The issue branch's input: the event and what was fetched. */
export interface IssueInput {
  repository: string;
  action: "assigned" | "unassigned";
  issue: number;
  /** The login the event added or removed; `null` when the payload names none. */
  assignee: string | null;
  /** The login that made the change. */
  sender: string;
  /** The repository's owner, who may reassign at any time. */
  owner: string;
  /** The issue's assignees, re-read after the event. */
  assignees: readonly string[];
  /**
   * On an issue labelled `spec`, the logins assigned to its Tickets, open or
   * closed: those that hold or delivered one; `null` on any other issue.
   */
  ticketAssignees: readonly string[] | null;
  /** Whether it is an open Spec with no sub-issue, an unsplit Spec. */
  unsplit: boolean;
  /** The issues it is blocked by that are open, of any repository. */
  openBlockers: readonly IssueRef[];
  pullRequests: readonly ClosingPullRequest[];
  comment: StickyComment | null;
}

export interface Assignment {
  issue: number;
  login: string;
}

/** The sticky comment to create or edit in place. */
export interface CommentUpsert {
  /** The issue or pull request it is on. */
  number: number;
  /** The comment to edit; `null` creates one. */
  id: number | null;
  body: string;
}

export type Verdict = "passed" | "failed" | "conflict" | "premature" | "clear";

/** What one run of the check decided. */
export interface Plan {
  /** The run's verdict: for a pull request, the worst of its issues'. */
  verdict: Verdict;
  assignments: Assignment[];
  /**
   * The sticky comment of the pull request or the issue, and on a pull
   * request, the comment on each Ticket whose Spec is of another repository.
   */
  comments: CommentUpsert[];
  /** One Markdown line per issue the run looked at, for the job summary. */
  summary: string[];
  exitCode: 0 | 1;
}

const names = (logins: readonly string[]): string =>
  logins.map((login) => `@${login}`).join(", ");

/** A login as GraphQL spells it: REST and the webhooks add `[bot]` to a bot's. */
const plain = (login: string): string =>
  login.endsWith("[bot]") ? login.slice(0, -"[bot]".length) : login;

/** Whether two comment bodies read the same (GitHub may store CRLF). */
const sameBody = (a: string, b: string): boolean =>
  a.replaceAll("\r\n", "\n").trim() === b.replaceAll("\r\n", "\n").trim();

/**
 * The sticky comment to write on `number`: `lines` under `marker`, one
 * per issue. With nothing to say, none is created, and an earlier comment
 * is rewritten to `settled` (a conflict gone, a premature Claim gone, a
 * pass after a failure) when
 * that is a text, else left as it is. Nothing when the comment already
 * reads so.
 */
function upsert(
  number: number,
  lines: readonly string[],
  existing: StickyComment | null,
  settled: string | null,
  marker: string = MARKER,
): CommentUpsert[] {
  const body =
    lines.length > 0
      ? [marker, ...lines].join("\n\n")
      : existing === null || settled === null
        ? null
        : `${marker}\n\n${settled}`;
  if (body === null || (existing !== null && sameBody(existing.body, body))) {
    return [];
  }
  return [{ number, id: existing?.id ?? null, body }];
}

/**
 * The criteria of a Ticket's `body` that `pnpm spec:check` counts as gaps,
 * one line each: unchecked, or a "check whether…" without its `Outcome:`
 * line (`docs/agents/issue-tracker.md`, "A Spec's coverage").
 */
function criteriaGaps(body: string): string[] {
  return criteriaOf(body).flatMap((criterion) => {
    const gaps = gapsOf(criterion).map((gap) => TEXTS.gapNames[gap]);
    return gaps.length === 0 ? [] : [`- ${gaps.join(", ")}: ${criterion.text}`];
  });
}

/**
 * The pull-request branch, per issue of the same repository the pull
 * request closes: no assignee, assign the author and say so (text 1), or
 * text 3 when GitHub will not assign them; the author among the assignees,
 * pass (pairing included); assignees that exclude the author, fail with
 * text 2. At most `MAX_ASSIGNMENTS` issues are assigned in one run: the
 * unclaimed ones past the cap stay so, with a summary line each and one
 * line in the comment. Before any of that, an issue that is a Spec fails
 * (a pull request names the Tickets it delivers, never their Spec), and so
 * does one with an open blocker, of any repository, that the pull request
 * does not close too, naming each (ADR 0025); neither is assigned. A
 * Ticket the author holds or is assigned joins them
 * to its Spec, once per Spec and outside the cap: one of this repository is
 * assigned to them with a line in the comment (text 3 when GitHub will not
 * assign them); one of another repository, which the token cannot write,
 * gets the command that joins it in a comment on the Ticket, under
 * `SPEC_MARKER`, on each Ticket, rewritten to `joinedSpec` once the author
 * is on the Spec when the command still pending is theirs. An issue of
 * another repository is ignored with a
 * summary line; a pull request that closes no issue passes with one. The
 * worst verdict wins: exit 1 when any issue fails. With nothing to say, an
 * earlier comment is left alone unless it holds a failure, which a pass
 * replaces with text 7.
 */
export function planPullRequest(input: PullRequestInput): Plan {
  const { repository, pullRequest, closing, comment } = input;
  const { author } = pullRequest;
  const assignments: Assignment[] = [];
  const lines: string[] = [];
  const summary: string[] = [];
  const capped: number[] = [];
  /** The Specs already handled, `owner/name#n`: one assignment per Spec. */
  const specs = new Set<string>();
  /** The comments on Tickets whose Spec the check cannot write. */
  const ticketComments: CommentUpsert[] = [];
  /** The closed issues assigned so far: the cap counts these, not the Specs. */
  let claimed = 0;
  let failed = false;
  let seen = 0;
  /** Adds the author to the Spec of `ticket`, a Ticket the author now holds. */
  const addToSpec = (ticket: ClosingIssue, spec: ParentSpec): void => {
    const key = `${spec.repository}#${String(spec.number)}`;
    const elsewhere = spec.repository !== repository;
    // A Spec of another repository: each Ticket carries its own comment.
    if (!elsewhere && specs.has(key)) return;
    specs.add(key);
    const head = `- ${refName(spec, repository)}, the Spec of #${String(ticket.number)}: the author @${author}`;
    const command = TEXTS.joinSpec(key, spec.url, ticket.number, author);
    if (spec.assignees.includes(author)) {
      summary.push(`${head} among its assignees.`);
      // The author's own command, still pending on the Ticket, is settled;
      // another author's is left to them.
      if (
        elsewhere &&
        spec.joinComment !== null &&
        sameBody(
          spec.joinComment.body,
          `${SPEC_MARKER}

${command}`,
        )
      ) {
        ticketComments.push(
          ...upsert(
            ticket.number,
            [],
            spec.joinComment,
            TEXTS.joinedSpec(key, ticket.number, author),
            SPEC_MARKER,
          ),
        );
      }
    } else if (elsewhere) {
      // The token writes in this repository only: the author joins it.
      ticketComments.push(
        ...upsert(
          ticket.number,
          [command],
          spec.joinComment,
          null,
          SPEC_MARKER,
        ),
      );
      summary.push(
        `${head} is not among its assignees, in another repository; the command that joins it commented on #${String(ticket.number)}.`,
      );
    } else if (!spec.authorAssignable) {
      lines.push(TEXTS.notAssignable(spec.number, author));
      summary.push(
        `${head} is not among its assignees, and cannot be assigned; passed, with a comment.`,
      );
    } else {
      assignments.push({ issue: spec.number, login: author });
      lines.push(TEXTS.specJoined(spec.number, ticket.number, author));
      summary.push(`${head} is not among its assignees; assigned to them.`);
    }
  };
  const name = (ref: IssueRef): string => refName(ref, repository);
  const closes = new Set(closing.map(name));
  for (const issue of closing) {
    const n = String(issue.number);
    if (issue.repository !== repository) {
      summary.push(
        `- ${issue.repository}#${n}: an issue of another repository; ignored.`,
      );
      continue;
    }
    seen++;
    // The open blockers this pull request does not deliver with the issue.
    const unclosedBlockers = issue.openBlockers
      .map(name)
      .filter((ref) => !closes.has(ref));
    if (issue.isSpec) {
      failed = true;
      lines.push(TEXTS.specClosed(issue.number));
      summary.push(
        `- #${n}: a Spec; failed: a pull request names the Tickets it delivers, never their Spec.`,
      );
    } else if (unclosedBlockers.length > 0) {
      failed = true;
      lines.push(TEXTS.blocked(issue.number, unclosedBlockers));
      summary.push(
        `- #${n}: blocked by ${andList(unclosedBlockers)}, open and not closed by this pull request; failed.`,
      );
    } else if (issue.assignees.includes(author)) {
      summary.push(
        issue.assignees.length === 1
          ? `- #${n}: claimed by @${author}, the author; passed.`
          : `- #${n}: claimed by ${names(issue.assignees)}, the author among them; passed.`,
      );
      if (issue.spec !== null) addToSpec(issue, issue.spec);
    } else if (issue.assignees.length > 0) {
      failed = true;
      lines.push(TEXTS.failed(issue.number, issue.assignees[0]));
      summary.push(
        `- #${n}: claimed by ${names(issue.assignees)}, not by the author @${author}; failed.`,
      );
    } else if (!issue.authorAssignable) {
      lines.push(TEXTS.notAssignable(issue.number, author));
      summary.push(
        `- #${n}: no assignee, and the author @${author} cannot be assigned; passed, with a comment.`,
      );
    } else if (claimed < MAX_ASSIGNMENTS) {
      claimed++;
      assignments.push({ issue: issue.number, login: author });
      lines.push(TEXTS.assigned(issue.number, author));
      summary.push(`- #${n}: no assignee; assigned to the author @${author}.`);
      if (issue.spec !== null) addToSpec(issue, issue.spec);
    } else {
      capped.push(issue.number);
      summary.push(
        `- #${n}: no assignee; not assigned: the pull request closes too many issues to claim them here (at most ${String(MAX_ASSIGNMENTS)} per run).`,
      );
    }
  }
  if (capped.length > 0) lines.push(TEXTS.tooMany(capped));
  if (seen === 0) {
    summary.push(
      `- #${String(pullRequest.number)} closes no issue of this repository; passed.`,
    );
  }
  // Only a failure is replaced on a pass; a reminder (text 1, text 3) stays.
  const settled =
    comment?.body.includes(FAILED_HEAD) === true ? TEXTS.passed : null;
  const criteria: string[] = [];
  for (const issue of closing) {
    if (issue.repository !== repository || issue.spec === null) continue;
    const gaps = criteriaGaps(issue.body);
    if (gaps.length === 0) continue;
    criteria.push(TEXTS.criteriaLeft(issue.number, gaps));
    summary.push(
      `- #${String(issue.number)}: ${String(gaps.length)} ${gaps.length === 1 ? "criterion" : "criteria"} unchecked or without their outcome; commented.`,
    );
  }
  return {
    verdict: failed ? "failed" : "passed",
    assignments,
    comments: [
      ...upsert(pullRequest.number, lines, comment, settled),
      ...ticketComments,
      ...upsert(
        pullRequest.number,
        criteria,
        input.criteriaComment,
        TEXTS.criteriaSettled,
        CRITERIA_MARKER,
      ),
    ],
    summary,
    exitCode: failed ? 1 : 0,
  };
}

/**
 * The issue branch, on `assigned` and `unassigned`, recomputed on every
 * event. On `assigned` with two or more assignees (re-read, so that the
 * interface's add-then-remove draws nothing): the sender already an
 * assignee, pairing, nothing; the sender the repository owner, nothing; on
 * a Spec, a login that holds or delivered one of its Tickets, nothing;
 * otherwise, a Spec's login that holds or delivered none included, text 4.
 * An open pull request of the same repository by a login outside the
 * assignees draws text 5, read from its own state. A Claim made too
 * early draws a line too, whoever made it (ADR 0025): any assignee on an
 * unsplit Spec, or on an issue with an open blocker, named; its verdict is
 * `premature` when no conflict stands. With no
 * conflict left (at most one assignee, or on a Spec each one holding or
 * having delivered a Ticket, or added by the owner in this event, and no
 * such pull request), an earlier comment becomes text 6; a second assignee
 * the event did not add keeps it, since their conflict stands: the state
 * read names who added the event's login only. Comments only, never a
 * reversal: always exit 0.
 */
export function planIssue(input: IssueInput): Plan {
  const { repository, action, issue, assignee, sender, owner } = input;
  const { assignees, ticketAssignees, pullRequests, comment } = input;
  const { unsplit, openBlockers } = input;
  const n = String(issue);
  const lines: string[] = [];
  const summary: string[] = [];

  if (
    action === "assigned" &&
    assignee !== null &&
    assignees.length >= 2 &&
    assignees.includes(assignee)
  ) {
    const others = assignees.filter((login) => login !== assignee);
    if (ticketAssignees?.includes(assignee) === true) {
      summary.push(
        `- #${n}, a Spec: @${assignee}, who holds or delivered one of its Tickets, added by @${sender}; no conflict.`,
      );
    } else if (sender === owner) {
      summary.push(
        `- #${n}: @${assignee} added by @${sender}, the repository owner; no conflict.`,
      );
    } else if (others.includes(sender)) {
      summary.push(
        `- #${n}: @${assignee} added by @${sender}, an assignee (pairing); no conflict.`,
      );
    } else {
      lines.push(TEXTS.secondAssignee(issue, assignee, others[0]));
      summary.push(
        `- #${n}: @${assignee} added by @${sender} to an issue claimed by @${others[0]}; conflict.`,
      );
    }
  }

  if (assignees.length > 0) {
    const held = assignees.map(plain);
    for (const pullRequest of pullRequests) {
      if (
        pullRequest.repository !== repository ||
        pullRequest.state !== "OPEN" ||
        pullRequest.bot ||
        held.includes(plain(pullRequest.author))
      ) {
        continue;
      }
      lines.push(
        TEXTS.openPullRequest(
          issue,
          assignees[0],
          pullRequest.number,
          pullRequest.author,
        ),
      );
      summary.push(
        `- #${n}: the open pull request #${String(pullRequest.number)} by @${pullRequest.author} closes it, claimed by @${assignees[0]}; conflict.`,
      );
    }
  }

  // A Claim made too early, whoever made it (ADR 0025): said, never undone.
  const premature: string[] = [];
  if (assignees.length > 0) {
    if (unsplit) {
      premature.push(TEXTS.unsplitClaim(issue));
      summary.push(
        `- #${n}: a Spec with no Ticket, assigned to ${names(assignees)}; premature.`,
      );
    }
    if (openBlockers.length > 0) {
      const blockers = openBlockers.map((ref) => refName(ref, repository));
      premature.push(TEXTS.blockedClaim(issue, blockers));
      summary.push(
        `- #${n}: claimed by ${names(assignees)}, blocked by ${andList(blockers)}; premature.`,
      );
    }
  }

  if (summary.length === 0) {
    summary.push(
      assignees.length === 0
        ? `- #${n}: no assignee; no conflict.`
        : `- #${n}: claimed by ${names(assignees)}; no conflict.`,
    );
  }
  // A Spec's assignees are no conflict once each holds or delivered a
  // Ticket, or was added by the owner in this event.
  const noConflict =
    assignees.length <= 1 ||
    (ticketAssignees !== null &&
      assignees.every(
        (login) =>
          ticketAssignees.includes(login) ||
          (action === "assigned" && login === assignee && sender === owner),
      ));
  // An earlier comment that held a conflict settles as one; one that held
  // only premature Claims, as those.
  const settleText = !noConflict
    ? null
    : comment?.body.includes(CONFLICT_HEAD) === true
      ? TEXTS.resolved
      : TEXTS.prematureSettled;
  return {
    verdict:
      lines.length > 0
        ? "conflict"
        : premature.length > 0
          ? "premature"
          : "clear",
    assignments: [],
    comments: upsert(issue, [...lines, ...premature], comment, settleText),
    summary,
    exitCode: 0,
  };
}

// The GitHub API: reading the state and applying the plan.

/** Configuration the script cannot use, or an answer it cannot read. */
export class ClaimCheckError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ClaimCheckError";
  }
}

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a parsed JSON value is a list. */
function isList(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** The `nodes` of a GraphQL connection, or none. */
function nodesOf(connection: unknown): unknown[] {
  return isRecord(connection) && isList(connection.nodes)
    ? connection.nodes
    : [];
}

/** The `login` of each user object of `users`, in order. */
function loginsOf(users: unknown): string[] {
  return isList(users)
    ? users.flatMap((user) =>
        isRecord(user) && typeof user.login === "string" ? [user.login] : [],
      )
    : [];
}

/**
 * The message of a caught error, or the thrown value as text, followed by
 * the chain of its causes: Node's `fetch` throws a bare "fetch failed" and
 * keeps the reason (`ECONNREFUSED`, a certificate error, ...) in `cause`.
 */
function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const causes: string[] = [];
  let cause: unknown = error.cause;
  while (cause !== undefined && causes.length < 5) {
    if (cause instanceof Error) {
      const code =
        "code" in cause && typeof cause.code === "string" ? cause.code : "";
      causes.push(
        code !== "" && !cause.message.includes(code)
          ? `${code}: ${cause.message}`
          : cause.message,
      );
      cause = cause.cause;
    } else {
      causes.push(typeof cause === "string" ? cause : JSON.stringify(cause));
      break;
    }
  }
  return causes.length === 0
    ? error.message
    : `${error.message} (${causes.join("; ")})`;
}

/** A GitHub API answer: its status and its parsed JSON body (`null` when empty). */
interface ApiResponse {
  status: number;
  body: unknown;
}

/** One call to the GitHub API as the token's holder: a REST path, or `/graphql`. */
type Api = (request: {
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
}) => Promise<ApiResponse>;

/** The GitHub API at `base` as the holder of `token`, over `fetcher`. */
function gitHubApi(base: string, token: string, fetcher: typeof fetch): Api {
  return async ({ method, path, body }) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "reforged-ts-claim-check",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text !== "") {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    return { status: response.status, body: parsed };
  };
}

/** GitHub's own message of an error answer, else its status. */
function apiMessage({ status, body }: ApiResponse): string {
  return isRecord(body) && typeof body.message === "string"
    ? `${String(status)} ${body.message}`
    : String(status);
}

/** The body of a REST call that must answer one of `accepted`. */
async function rest(
  api: Api,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body: unknown,
  accepted: readonly number[],
): Promise<ApiResponse> {
  const response = await api({ method, path, body });
  if (!accepted.includes(response.status)) {
    throw new ClaimCheckError(
      `${method} ${path} answered ${apiMessage(response)}.`,
    );
  }
  return response;
}

/** The `data` of a GraphQL query; GitHub answers errors with a 200 too. */
async function graphql(
  api: Api,
  query: string,
  variables: Readonly<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const response = await api({
    method: "POST",
    path: "/graphql",
    body: { query, variables },
  });
  const { body } = response;
  if (response.status !== 200 || !isRecord(body)) {
    throw new ClaimCheckError(
      `POST /graphql answered ${apiMessage(response)}.`,
    );
  }
  if (isList(body.errors) && body.errors.length > 0) {
    const messages = body.errors.map((error) =>
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error),
    );
    throw new ClaimCheckError(`POST /graphql answered: ${messages.join("; ")}`);
  }
  if (!isRecord(body.data)) {
    throw new ClaimCheckError("POST /graphql answered no data.");
  }
  return body.data;
}

/** The value at `keys` under `value`, descending through objects; `undefined` off the path. */
function at(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

const PAGE_SIZE = 100;

/** More pages than any issue's comments fill. */
const MAX_PAGES = 10;

/**
 * Whether a comment's `user` is the check itself, `CHECK_LOGIN`: a marked
 * comment by anyone else is not the check's, whatever it says.
 */
function byCheck(user: unknown): boolean {
  if (!isRecord(user) || typeof user.login !== "string") return false;
  return (
    user.login === `${CHECK_LOGIN}[bot]` ||
    (user.login === CHECK_LOGIN && user.type === "Bot")
  );
}

/**
 * The check's sticky comment on issue or pull request `number`: the first
 * comment by the check whose body opens with `marker`. A marked comment
 * by another login is passed over, so that nobody can plant the check's
 * comment.
 */
async function findComment(
  api: Api,
  repository: string,
  number: number,
  marker: string = MARKER,
): Promise<StickyComment | null> {
  const found = await findComments(api, repository, number, [marker]);
  return found.get(marker) ?? null;
}

/**
 * The check's sticky comments on `number`, keyed by marker; a marker of
 * `markers` with no comment is absent. Read in one walk of the comments,
 * which stops once each marker is found.
 */
async function findComments(
  api: Api,
  repository: string,
  number: number,
  markers: readonly string[],
): Promise<Map<string, StickyComment>> {
  const found = new Map<string, StickyComment>();
  const path = `/repos/${repository}/issues/${String(number)}/comments`;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { body } = await rest(
      api,
      "GET",
      `${path}?per_page=${String(PAGE_SIZE)}&page=${String(page)}`,
      undefined,
      [200],
    );
    if (!isList(body)) {
      throw new ClaimCheckError(`GET ${path} answered no list.`);
    }
    for (const item of body) {
      if (
        !isRecord(item) ||
        typeof item.id !== "number" ||
        typeof item.body !== "string" ||
        !byCheck(item.user)
      ) {
        continue;
      }
      const { id, body: text } = item;
      const marker = markers.find(
        (candidate) => !found.has(candidate) && text.startsWith(candidate),
      );
      if (marker !== undefined) found.set(marker, { id, body: text });
    }
    if (found.size === markers.length || body.length < PAGE_SIZE) {
      return found;
    }
  }
  throw new ClaimCheckError(
    `GET ${path} answered more than ${String(MAX_PAGES)} pages.`,
  );
}

/**
 * Whether GitHub lets `login` be assigned to issue `number`: push access,
 * or a comment on that issue (204), else not (404). The add-assignees
 * endpoint would silently drop the login instead of saying so.
 */
async function assignable(
  api: Api,
  repository: string,
  number: number,
  login: string,
): Promise<boolean> {
  const { status } = await rest(
    api,
    "GET",
    `/repos/${repository}/issues/${String(number)}/assignees/${encodeURIComponent(login)}`,
    undefined,
    [204, 404],
  );
  return status === 204;
}

/**
 * The closing references read in one page. GitHub links at most ten issues
 * to a pull request by hand; keywords in the description are unbounded, so
 * the count is read too, and a pull request past the page stops the check.
 */
const CLOSING_PAGE = 50;

/** More blockers than an issue has: they are read in one page, with their count. */
const BLOCKER_PAGE = 50;

/** An issue's blockers, open or closed, of any repository, with their count. */
const BLOCKED_BY = `blockedBy(first: ${String(BLOCKER_PAGE)}) {
            totalCount
            nodes { number state repository { nameWithOwner } }
          }`;

// An issue holds at most ten assignees: that connection is read whole. The
// parent is read with its labels, to tell a Spec from a wayfinder map, and
// each issue with its own labels and blockers (ADR 0025).
const CLOSING_ISSUES = `query($owner: String!, $name: String!, $number: Int!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      closingIssuesReferences(first: $first) {
        totalCount
        nodes {
          number
          body
          repository { nameWithOwner }
          assignees(first: 20) { nodes { login } }
          labels(first: 50) { nodes { name } }
          ${BLOCKED_BY}
          parent {
            number
            url
            repository { nameWithOwner }
            labels(first: 50) { nodes { name } }
            assignees(first: 20) { nodes { login } }
          }
        }
      }
    }
  }
}`;

const CLOSED_BY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      closedByPullRequestsReferences(first: 50, includeClosedPrs: false) {
        nodes {
          number
          state
          repository { nameWithOwner }
          author { __typename login }
        }
      }
      ${BLOCKED_BY}
    }
  }
}`;

/**
 * The open issues among the blockers of the issue `node`, named `name` in
 * the error; none when the answer holds no `blockedBy`. Stops on an issue
 * with more blockers than one page reads: the check never passes on a
 * blocker it has not read.
 */
function openBlockersOf(node: unknown, name: string): IssueRef[] {
  const connection = at(node, "blockedBy");
  if (connection === undefined || connection === null) return [];
  const nodes = nodesOf(connection);
  const totalCount = at(connection, "totalCount");
  if (typeof totalCount !== "number") {
    throw new ClaimCheckError(`blockedBy answered no totalCount for ${name}.`);
  }
  if (totalCount > nodes.length) {
    throw new ClaimCheckError(
      `${name} is blocked by ${String(totalCount)} issues, more than the ${String(nodes.length)} the check read: it cannot pass on a blocker it has not read.`,
    );
  }
  return nodes.flatMap((blocker) => {
    const repository = at(blocker, "repository", "nameWithOwner");
    const number = at(blocker, "number");
    if (typeof repository !== "string" || typeof number !== "number") {
      throw new ClaimCheckError(
        `blockedBy answered a blocker of ${name} without a number and a repository.`,
      );
    }
    return at(blocker, "state") === "OPEN" ? [{ repository, number }] : [];
  });
}

/** The `owner` and `name` of a repository named `owner/name`. */
function ownerAndName(repository: string): { owner: string; name: string } {
  const slash = repository.indexOf("/");
  return {
    owner: repository.slice(0, slash),
    name: repository.slice(slash + 1),
  };
}

/**
 * The issues the pull request closes, with whether `author` may be assigned
 * to each one of this repository. Stops when the pull request closes more
 * issues than one page holds: an issue the check did not read could be
 * claimed by another login, and the check never passes on one unread.
 */
async function readClosingIssues(
  api: Api,
  repository: string,
  pullRequest: { number: number; author: string },
): Promise<ClosingIssue[]> {
  const data = await graphql(api, CLOSING_ISSUES, {
    ...ownerAndName(repository),
    number: pullRequest.number,
    first: CLOSING_PAGE,
  });
  const connection = at(
    data,
    "repository",
    "pullRequest",
    "closingIssuesReferences",
  );
  const totalCount = at(connection, "totalCount");
  const nodes = nodesOf(connection);
  if (typeof totalCount !== "number") {
    throw new ClaimCheckError(
      "closingIssuesReferences answered no totalCount.",
    );
  }
  if (totalCount > nodes.length) {
    throw new ClaimCheckError(
      `#${String(pullRequest.number)} closes ${String(totalCount)} issues, more than the ${String(nodes.length)} the check read: it cannot pass on an issue it has not read. Name at most ${String(CLOSING_PAGE)} issues in the description, or split the pull request, then re-run the check.`,
    );
  }
  const issues: ClosingIssue[] = [];
  for (const node of nodes) {
    const nameWithOwner = at(node, "repository", "nameWithOwner");
    const number = at(node, "number");
    if (typeof nameWithOwner !== "string" || typeof number !== "number") {
      throw new ClaimCheckError(
        "closingIssuesReferences answered an issue without a number and a repository.",
      );
    }
    const ours = nameWithOwner === repository;
    const openBlockers = openBlockersOf(
      node,
      refName({ repository: nameWithOwner, number }, repository),
    );
    const authorAssignable =
      ours && (await assignable(api, repository, number, pullRequest.author));
    const body = at(node, "body");
    issues.push({
      repository: nameWithOwner,
      number,
      assignees: loginsOf(nodesOf(at(node, "assignees"))),
      authorAssignable,
      isSpec: nodesOf(at(node, "labels")).some(isSpecLabel),
      openBlockers,
      body: typeof body === "string" ? body : "",
      spec: ours
        ? await readParentSpec(
            api,
            repository,
            number,
            at(node, "parent"),
            pullRequest.author,
          )
        : null,
    });
  }
  return issues;
}

/**
 * The Spec of Ticket `ticket` from its `parent` node, or `null` when it
 * has no parent or its parent is not labelled `spec` (a wayfinder map).
 * What the plan may need is read whatever it decides: of a Spec of this
 * repository, whether `author` may be assigned to it; of one of another
 * repository, which the token cannot write, the check's comment on the
 * Ticket that names the command joining it.
 */
async function readParentSpec(
  api: Api,
  repository: string,
  ticket: number,
  parent: unknown,
  author: string,
): Promise<ParentSpec | null> {
  if (!isRecord(parent) || !nodesOf(parent.labels).some(isSpecLabel)) {
    return null;
  }
  const nameWithOwner = at(parent, "repository", "nameWithOwner");
  const { number, url } = parent;
  if (
    typeof nameWithOwner !== "string" ||
    typeof number !== "number" ||
    typeof url !== "string"
  ) {
    throw new ClaimCheckError(
      "closingIssuesReferences answered a parent Spec without a number, an address and a repository.",
    );
  }
  const ours = nameWithOwner === repository;
  return {
    repository: nameWithOwner,
    number,
    url,
    assignees: loginsOf(nodesOf(parent.assignees)),
    authorAssignable:
      ours && (await assignable(api, repository, number, author)),
    joinComment: ours
      ? null
      : await findComment(api, repository, ticket, SPEC_MARKER),
  };
}

/**
 * The pull requests that reference issue `number` as closed by them, and
 * its open blockers, read in one query.
 */
async function readClosingPullRequestsAndBlockers(
  api: Api,
  repository: string,
  number: number,
): Promise<{
  pullRequests: ClosingPullRequest[];
  openBlockers: IssueRef[];
}> {
  const data = await graphql(api, CLOSED_BY, {
    ...ownerAndName(repository),
    number,
  });
  const pullRequests: ClosingPullRequest[] = [];
  for (const node of nodesOf(
    at(data, "repository", "issue", "closedByPullRequestsReferences"),
  )) {
    const nameWithOwner = at(node, "repository", "nameWithOwner");
    const pullRequest = at(node, "number");
    const state = at(node, "state");
    if (
      typeof nameWithOwner !== "string" ||
      typeof pullRequest !== "number" ||
      (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED")
    ) {
      throw new ClaimCheckError(
        "closedByPullRequestsReferences answered a pull request without a number, a state and a repository.",
      );
    }
    const login = at(node, "author", "login");
    pullRequests.push({
      repository: nameWithOwner,
      number: pullRequest,
      // A deleted account has no author.
      author: typeof login === "string" ? login : "ghost",
      bot: at(node, "author", "__typename") === "Bot",
      state,
    });
  }
  return {
    pullRequests,
    openBlockers: openBlockersOf(
      at(data, "repository", "issue"),
      `#${String(number)}`,
    ),
  };
}

/**
 * The assignees of issue `number`, read now rather than from the event,
 * whether it is a Spec (labelled `spec`) and whether it is open.
 */
async function readIssueState(
  api: Api,
  repository: string,
  number: number,
): Promise<{ assignees: string[]; isSpec: boolean; open: boolean }> {
  const path = `/repos/${repository}/issues/${String(number)}`;
  const { body } = await rest(api, "GET", path, undefined, [200]);
  if (!isRecord(body) || !isList(body.assignees)) {
    throw new ClaimCheckError(`GET ${path} answered no assignees.`);
  }
  return {
    assignees: loginsOf(body.assignees),
    isSpec: isList(body.labels) && body.labels.some(isSpecLabel),
    open: body.state === "open",
  };
}

/**
 * The label of a Spec, as `to-spec` and `write-spec` set it. A copy of the
 * one `repo-settings.ts` declares, since this script imports nothing; a
 * test checks that its labels include this one.
 */
export const SPEC_LABEL = "spec";

/** Whether a label object, REST's or GraphQL's, is the Spec label. */
function isSpecLabel(label: unknown): boolean {
  return isRecord(label) && label.name === SPEC_LABEL;
}

// A Spec splits into far fewer Tickets than a page, each with at most ten
// assignees.
const TICKETS = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      subIssues(first: 100) {
        nodes {
          assignees(first: 20) { nodes { login } }
        }
      }
    }
  }
}`;

/**
 * The logins assigned to the Tickets of Spec `number`, open or closed, in
 * either Board repository: those that hold or delivered one; and how many
 * Tickets it has, none for an unsplit Spec.
 */
async function readTickets(
  api: Api,
  repository: string,
  number: number,
): Promise<{ assignees: string[]; count: number }> {
  const data = await graphql(api, TICKETS, {
    ...ownerAndName(repository),
    number,
  });
  const tickets = nodesOf(at(data, "repository", "issue", "subIssues"));
  return {
    assignees: [
      ...new Set(
        tickets.flatMap((ticket) => loginsOf(nodesOf(at(ticket, "assignees")))),
      ),
    ],
    count: tickets.length,
  };
}

/** Sends the plan's assignments, then its comment, saying what it did. */
async function apply(
  api: Api,
  repository: string,
  plan: Plan,
  output: Output,
): Promise<void> {
  for (const { issue, login } of plan.assignments) {
    await rest(
      api,
      "POST",
      `/repos/${repository}/issues/${String(issue)}/assignees`,
      { assignees: [login] },
      [201],
    );
    output.stdout(`Assigned #${String(issue)} to @${login}.\n`);
  }
  for (const { number, id, body } of plan.comments) {
    if (id === null) {
      await rest(
        api,
        "POST",
        `/repos/${repository}/issues/${String(number)}/comments`,
        { body },
        [201],
      );
      output.stdout(`Commented on #${String(number)}.\n`);
    } else {
      await rest(
        api,
        "PATCH",
        `/repos/${repository}/issues/comments/${String(id)}`,
        { body },
        [200],
      );
      output.stdout(`Edited the comment on #${String(number)}.\n`);
    }
  }
}

// The CLI.

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
}

/** The environment variable GitHub Actions names the job summary file in. */
const SUMMARY_VARIABLE = "GITHUB_STEP_SUMMARY";

/**
 * Appends `markdown` to the job summary when the environment `env` names
 * one (a step of GitHub Actions); does nothing elsewhere.
 */
async function appendSummary(
  env: Readonly<Record<string, string | undefined>>,
  markdown: string,
): Promise<void> {
  const file = env[SUMMARY_VARIABLE];
  if (file !== undefined && file !== "") await appendFile(file, markdown);
}

/** The environment variable GitHub Actions names the step's outputs file in. */
const OUTPUT_VARIABLE = "GITHUB_OUTPUT";

/** The step output that lists the issues the run assigned, comma-separated. */
export const ASSIGNED_OUTPUT = "assigned";

/**
 * Sets the step output `name` to `value` when the environment `env` names
 * the outputs file (a step of GitHub Actions); does nothing elsewhere.
 */
async function setOutput(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  value: string,
): Promise<void> {
  const file = env[OUTPUT_VARIABLE];
  if (file !== undefined && file !== "") {
    await appendFile(file, `${name}=${value}\n`);
  }
}

/** What the environment of the job gives the script. */
interface Settings {
  token: string;
  /** `owner/name`, the caller's repository. */
  repository: string;
  owner: string;
  /** The API root, `GITHUB_API_URL`; GraphQL is `/graphql` under it. */
  base: string;
  eventPath: string;
}

/** The variable's value when set and not empty. */
function variable(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const value = env[name];
  return value === undefined || value === "" ? undefined : value;
}

function settingsOf(
  env: Readonly<Record<string, string | undefined>>,
): Settings {
  const token = variable(env, "GITHUB_TOKEN");
  if (token === undefined) {
    throw new ClaimCheckError("GITHUB_TOKEN is not set.");
  }
  const repository = variable(env, "GITHUB_REPOSITORY");
  if (repository === undefined || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new ClaimCheckError(
      "GITHUB_REPOSITORY does not name a repository as owner/name.",
    );
  }
  const eventPath = variable(env, "GITHUB_EVENT_PATH");
  if (eventPath === undefined) {
    throw new ClaimCheckError("GITHUB_EVENT_PATH is not set.");
  }
  return {
    token,
    repository,
    owner: variable(env, "GITHUB_REPOSITORY_OWNER") ?? repository.split("/")[0],
    base: (variable(env, "GITHUB_API_URL") ?? "https://api.github.com").replace(
      /\/+$/,
      "",
    ),
    eventPath,
  };
}

/** The pull request of a `pull_request_target` event: its number and its author. */
function pullRequestOf(event: unknown): { number: number; author: string } {
  const number = at(event, "pull_request", "number");
  const author = at(event, "pull_request", "user", "login");
  if (typeof number !== "number" || typeof author !== "string") {
    throw new ClaimCheckError(
      "The event holds no pull request with a number and an author: the pull-request mode runs on pull_request_target.",
    );
  }
  return { number, author };
}

/** The issue, the login added or removed and the sender of an `issues` event. */
function issueEventOf(event: unknown): {
  action: "assigned" | "unassigned";
  issue: number;
  assignee: string | null;
  sender: string;
} {
  const action = at(event, "action");
  const issue = at(event, "issue", "number");
  const sender = at(event, "sender", "login");
  const assignee = at(event, "assignee", "login");
  if (
    (action !== "assigned" && action !== "unassigned") ||
    typeof issue !== "number" ||
    typeof sender !== "string"
  ) {
    throw new ClaimCheckError(
      "The event is not an assignment with an issue and a sender: the issue mode runs on issues (assigned, unassigned).",
    );
  }
  return {
    action,
    issue,
    assignee: typeof assignee === "string" ? assignee : null,
    sender,
  };
}

/** The pull-request branch's plan, the state read through `api`. */
async function checkPullRequest(
  api: Api,
  settings: Settings,
  event: unknown,
): Promise<Plan> {
  const pullRequest = pullRequestOf(event);
  const { repository } = settings;
  const closing = await readClosingIssues(api, repository, pullRequest);
  const comments = await findComments(api, repository, pullRequest.number, [
    MARKER,
    CRITERIA_MARKER,
  ]);
  return planPullRequest({
    repository,
    pullRequest,
    closing,
    comment: comments.get(MARKER) ?? null,
    criteriaComment: comments.get(CRITERIA_MARKER) ?? null,
  });
}

/** The issue branch's plan, the state read through `api`. */
async function checkIssue(
  api: Api,
  settings: Settings,
  event: unknown,
): Promise<Plan> {
  const { action, issue, assignee, sender } = issueEventOf(event);
  const { repository, owner } = settings;
  const { assignees, isSpec, open } = await readIssueState(
    api,
    repository,
    issue,
  );
  const tickets = isSpec ? await readTickets(api, repository, issue) : null;
  const { pullRequests, openBlockers } =
    await readClosingPullRequestsAndBlockers(api, repository, issue);
  return planIssue({
    repository,
    action,
    issue,
    assignee,
    sender,
    owner,
    assignees,
    ticketAssignees: tickets?.assignees ?? null,
    unsplit: open && tickets?.count === 0,
    // A closed issue is no Claim to warn about.
    openBlockers: open ? openBlockers : [],
    pullRequests,
    comment: await findComment(api, repository, issue),
  });
}

/**
 * Runs the mode `args[0]` names (`pull-request` or `issue`) on the event
 * of `GITHUB_EVENT_PATH`, in `GITHUB_REPOSITORY`, with `GITHUB_TOKEN`,
 * through the API at `GITHUB_API_URL`; writes a line per issue, or the
 * error that stopped it, to the job summary when `GITHUB_STEP_SUMMARY`
 * names one, and the issues it assigned to the step output `assigned` when
 * `GITHUB_OUTPUT` names the file. Exit codes: 0 passed, 1 an issue claimed
 * by another login (pull-request mode) or an error, 2 usage.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { env: process.env, fetcher: fetch },
): Promise<number> {
  const mode = args.at(0);
  if (args.length !== 1 || (mode !== "pull-request" && mode !== "issue")) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const settings = settingsOf(context.env);
    const event: unknown = JSON.parse(
      await readFile(settings.eventPath, "utf8"),
    );
    const api = gitHubApi(settings.base, settings.token, context.fetcher);
    const plan =
      mode === "pull-request"
        ? await checkPullRequest(api, settings, event)
        : await checkIssue(api, settings, event);
    for (const line of plan.summary) output.stdout(`${line}\n`);
    await apply(api, settings.repository, plan, output);
    // An assignment made with GITHUB_TOKEN raises no issues event: the
    // workflow reads this output to tell the board.
    if (plan.assignments.length > 0) {
      await setOutput(
        context.env,
        ASSIGNED_OUTPUT,
        plan.assignments.map(({ issue }) => String(issue)).join(","),
      );
    }
    await appendSummary(
      context.env,
      `## Claim check\n\n${plan.summary.join("\n")}\n`,
    );
    if (plan.verdict === "failed") {
      output.stdout(
        "::error title=Claim check failed::An issue this pull request closes is claimed by another login, is a Spec, or has an open blocker the pull request does not close; the comment on the pull request names the way out.\n",
      );
    }
    return plan.exitCode;
  } catch (error) {
    const message = errorMessage(error);
    output.stderr(`${message}\n`);
    // The summary is what a person reads first: the error goes there too.
    await appendSummary(context.env, `## Claim check\n\n- ${message}\n`);
    return 1;
  }
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
