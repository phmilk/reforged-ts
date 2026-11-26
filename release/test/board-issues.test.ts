import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  issueLookup,
  specLabelsOf,
  statusOf,
  type BoardIssue,
  type Status,
} from "../src/board.js";
import { markdownTable } from "../src/markdown-table.js";
import { repositoryRoot } from "../src/workspace.js";
import {
  issue,
  MAP,
  pullRequest,
  SPEC,
  sub,
  TEMPLATE,
} from "./support/board.js";

/** A case of `statusOf`: its name, the issue's fields, the Status, and the other issues it sees. */
type RuleCase = readonly [
  name: string,
  more: Partial<BoardIssue>,
  expected: Status,
  others?: readonly BoardIssue[],
];

/**
 * "The rules" of `docs/release.md`, row by row in its order and word for
 * word, each with the cases that pin it: a rule's cases and its text are
 * edited side by side, and the test below fails when the page and these
 * rows drift apart.
 */
const RULES: readonly {
  status: Status | "(parent rule)";
  rule: string;
  cases: readonly [RuleCase, ...RuleCase[]];
}[] = [
  {
    status: "Done",
    rule: "the issue is closed",
    cases: [
      [
        "Done: the issue is closed, whatever else holds",
        {
          state: "CLOSED",
          assignees: ["alice"],
          pullRequests: [pullRequest("OPEN")],
          labels: ["ready-for-agent"],
        },
        "Done",
      ],
    ],
  },
  {
    status: "In review",
    rule: "an open pull request that is not a draft closes it, read from the pull request's own state (a merged one still references the issue and does not count)",
    cases: [
      [
        "In review: an open pull request that is not a draft closes it, before the Claim and the blockers",
        {
          pullRequests: [pullRequest("OPEN")],
          assignees: ["alice"],
          blockedBy: 1,
        },
        "In review",
      ],
      [
        "not In review: a draft alone",
        {
          pullRequests: [pullRequest("OPEN", true)],
          labels: ["ready-for-human"],
        },
        "Ready",
      ],
      [
        "not In review: a merged pull request still comes back and does not count",
        { pullRequests: [pullRequest("MERGED"), pullRequest("CLOSED")] },
        "Backlog",
      ],
    ],
  },
  {
    status: "In progress",
    rule: "it has an assignee: the Claim. A draft pull request keeps it here",
    cases: [
      [
        "In progress: an assignee, the Claim, before the blockers and the labels",
        { assignees: ["alice"], blockedBy: 1, labels: ["ready-for-agent"] },
        "In progress",
      ],
      [
        "In progress: a draft keeps it",
        { assignees: ["alice"], pullRequests: [pullRequest("OPEN", true)] },
        "In progress",
      ],
    ],
  },
  {
    status: "(parent rule)",
    rule: "it has open sub-issues and none of the above applies: the highest value among its open sub-issues by Backlog < Blocked < Ready < In progress < In review, each sub-issue by these same rules, so a map takes its specs' highest and a spec its tickets'; a Template ticket of a library spec counts",
    cases: [
      [
        "(parent rule): its open sub-issue's value, before its own labels (the tests below hold the rest)",
        { labels: ["ready-for-agent"], subIssues: [sub(11)] },
        "Blocked",
        [issue(11, { blockedBy: 1 })],
      ],
    ],
  },
  {
    status: "Blocked",
    rule: "it has an open blocker (`issueDependenciesSummary.blockedBy`), whatever its labels",
    cases: [
      [
        "Blocked: an open blocker, whatever the labels",
        { blockedBy: 2, labels: ["ready-for-agent"] },
        "Blocked",
      ],
      [
        "Blocked: an open blocker on a frontier ticket",
        { blockedBy: 1, labels: ["ticket"], parent: MAP },
        "Blocked",
      ],
      [
        "Blocked: an open blocker, before needs-split",
        { blockedBy: 1, labels: ["spec", "needs-split"] },
        "Blocked",
      ],
    ],
  },
  {
    status: "Backlog",
    rule: '`needs-split`: an unsplit Spec, whatever its other labels. An open Spec\'s labels are read here and below as `specLabelsOf` derives them ("The labels" below), so an unsplit Spec still `ready-for-agent` is Backlog already',
    cases: [
      [
        "Backlog: needs-split, an unsplit Spec, before the triage labels",
        { labels: ["spec", "needs-split", "ready-for-human"] },
        "Backlog",
      ],
      [
        "Backlog: an unsplit Spec still ready-for-agent, read as the board derives its labels",
        { labels: ["spec", "ready-for-agent"] },
        "Backlog",
      ],
      [
        "Ready: a Spec split into closed Tickets still needs-split, read as the board derives its labels",
        {
          labels: ["spec", "needs-split"],
          subIssues: [{ ...sub(11), state: "CLOSED" }],
        },
        "Ready",
      ],
    ],
  },
  {
    status: "Ready",
    rule: "`ready-for-agent`, `ready-for-human`, or an open child of a `wayfinder:map` (a frontier ticket)",
    cases: [
      ["Ready: ready-for-agent", { labels: ["ready-for-agent"] }, "Ready"],
      [
        "Ready: ready-for-human",
        { labels: ["bug", "ready-for-human"] },
        "Ready",
      ],
      [
        "Ready: an open child of a wayfinder:map, a frontier ticket",
        { labels: ["ticket"], parent: MAP },
        "Ready",
      ],
    ],
  },
  {
    status: "Backlog",
    rule: "everything else: `needs-triage`, `needs-info`, no label, a parent with no open child",
    cases: [
      [
        "Backlog: a ticket of a spec, with no ready label",
        { labels: ["ticket"], parent: SPEC },
        "Backlog",
      ],
      ["Backlog: needs-triage", { labels: ["bug", "needs-triage"] }, "Backlog"],
      ["Backlog: needs-info", { labels: ["needs-info"] }, "Backlog"],
      ["Backlog: no label", {}, "Backlog"],
      [
        "Backlog: a parent with no open child",
        { subIssues: [{ ...sub(11), state: "CLOSED" }] },
        "Backlog",
      ],
    ],
  },
];

/** The table under "**The rules.**" in `docs/release.md`, one LF-ended line per row, as `markdownTable` writes one. */
function rulesTable(): string {
  const lines = readFileSync(
    join(repositoryRoot, "docs", "release.md"),
    "utf8",
  ).split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith("**The rules.**"));
  expect(start, "docs/release.md has a paragraph **The rules.**").not.toBe(-1);
  const rest = lines.slice(start + 1);
  const first = rest.findIndex((line) => line.startsWith("|"));
  const end = rest.findIndex((line, at) => at > first && !line.startsWith("|"));
  return rest
    .slice(first, end === -1 ? undefined : end)
    .map((line) => `${line}\n`)
    .join("");
}

describe("statusOf", () => {
  it("is described by the rules table of docs/release.md, row for row and word for word", () => {
    expect(rulesTable()).toBe(
      markdownTable(
        ["Status", "Rule"],
        RULES.map(({ status, rule }) => [status, rule]),
      ),
    );
  });

  it.each(
    RULES.flatMap(({ cases }, row) =>
      cases.map(
        ([name, more, expected, others = []]) =>
          [`row ${String(row + 1)}: ${name}`, more, expected, others] as const,
      ),
    ),
  )("%s", (_name, more, expected, others) => {
    expect(statusOf(issue(1, more), issueLookup(others))).toBe(expected);
  });

  it("gives a parent the highest value among its open sub-issues, Backlog < Blocked < Ready < In progress < In review", () => {
    const spec = issue(10, {
      labels: ["spec"],
      subIssues: [sub(11), sub(12), sub(13), sub(14), sub(15)],
    });
    const backlog = issue(11, { labels: ["ticket"] });
    const blocked = issue(12, { blockedBy: 1 });
    const ready = issue(13, { labels: ["ready-for-agent"] });
    const inProgress = issue(14, { assignees: ["alice"] });
    const inReview = issue(15, { pullRequests: [pullRequest("OPEN")] });
    const of = (...tickets: BoardIssue[]) =>
      statusOf(spec, issueLookup(tickets));

    expect(of(backlog)).toBe("Backlog");
    expect(of(backlog, blocked)).toBe("Blocked");
    expect(of(blocked, ready, backlog)).toBe("Ready");
    expect(of(ready, inProgress)).toBe("In progress");
    expect(of(inProgress, inReview, backlog)).toBe("In review");
  });

  it("lets a parent's own assignee or pull request win over its children", () => {
    const children = [issue(15, { pullRequests: [pullRequest("OPEN")] })];
    const claimed = issue(10, { assignees: ["alice"], subIssues: [sub(15)] });
    const reviewed = issue(10, {
      pullRequests: [pullRequest("OPEN")],
      subIssues: [sub(11)],
    });

    expect(statusOf(claimed, issueLookup(children))).toBe("In progress");
    expect(statusOf(reviewed, issueLookup([issue(11)]))).toBe("In review");
  });

  it("applies the parent rule before the parent's own blockers and labels", () => {
    const spec = issue(10, {
      labels: ["ready-for-agent"],
      blockedBy: 1,
      subIssues: [sub(11)],
    });

    expect(statusOf(spec, issueLookup([issue(11)]))).toBe("Backlog");
  });

  it("is recursive: a map takes its specs' highest, each spec its tickets'", () => {
    const map = issue(518, {
      labels: ["wayfinder:map"],
      subIssues: [sub(529), sub(530)],
    });
    const specA = issue(529, { labels: ["spec"], subIssues: [sub(531)] });
    const specB = issue(530, { labels: ["spec"], subIssues: [sub(532)] });
    const ticketA = issue(531, { labels: ["ticket"], blockedBy: 1 });
    const ticketB = issue(532, { labels: ["ticket"], assignees: ["alice"] });
    const lookup = issueLookup([map, specA, specB, ticketA, ticketB]);

    expect(statusOf(specA, lookup)).toBe("Blocked");
    expect(statusOf(specB, lookup)).toBe("In progress");
    expect(statusOf(map, lookup)).toBe("In progress");
  });

  it("finds a child by repository and number: a Template ticket of a library spec", () => {
    const spec = issue(529, {
      labels: ["spec"],
      subIssues: [sub(71, TEMPLATE)],
    });
    const templateTicket = issue(71, {
      repository: TEMPLATE,
      assignees: ["alice"],
    });
    const libraryIssue = issue(71, { labels: ["ready-for-agent"] });

    expect(statusOf(spec, issueLookup([templateTicket, libraryIssue]))).toBe(
      "In progress",
    );
    // Its own labels instead, as the board derives them: a split Spec is
    // ready-for-agent (ADR 0025).
    expect(statusOf(spec, issueLookup([libraryIssue]))).toBe("Ready");
  });

  it("leaves out a closed sub-issue and one the lookup does not know", () => {
    const spec = issue(10, {
      labels: ["spec"],
      subIssues: [sub(11), { ...sub(12), state: "CLOSED" }, sub(13)],
    });
    const known = issue(11, { labels: ["ticket"] });
    const closed = issue(12, { state: "CLOSED", assignees: ["alice"] });

    expect(statusOf(spec, issueLookup([known, closed]))).toBe("Backlog");
  });

  it("ends on a cyclic hierarchy", () => {
    const a = issue(1, { subIssues: [sub(2)] });
    const b = issue(2, { subIssues: [sub(1)], blockedBy: 1 });

    expect(statusOf(a, issueLookup([a, b]))).toBe("Blocked");
  });
});

describe("specLabelsOf", () => {
  it.each([
    [
      "an unsplit Spec: needs-split in, ready-for-agent out",
      { labels: ["enhancement", "spec", "ready-for-agent"] },
      { add: ["needs-split"], remove: ["ready-for-agent"] },
    ],
    [
      "an unsplit Spec with no triage label: needs-split in",
      { labels: ["spec"] },
      { add: ["needs-split"], remove: [] },
    ],
    [
      "a split Spec still needs-split: needs-split out, ready-for-agent in",
      { labels: ["spec", "needs-split"], subIssues: [sub(11)] },
      { add: ["ready-for-agent"], remove: ["needs-split"] },
    ],
    [
      "a Spec split into closed Tickets only is split",
      {
        labels: ["spec", "needs-split"],
        subIssues: [{ ...sub(11), state: "CLOSED" }],
      },
      { add: ["ready-for-agent"], remove: ["needs-split"] },
    ],
    [
      "a split Spec with a Ticket in the Template",
      { labels: ["spec", "needs-split"], subIssues: [sub(117, TEMPLATE)] },
      { add: ["ready-for-agent"], remove: ["needs-split"] },
    ],
    [
      "a ready-for-human unsplit Spec keeps it and gets needs-split",
      { labels: ["spec", "ready-for-human"] },
      { add: ["needs-split"], remove: [] },
    ],
    [
      "a ready-for-human split Spec keeps it and loses needs-split",
      {
        labels: ["spec", "ready-for-human", "needs-split"],
        subIssues: [sub(11)],
      },
      { add: [], remove: ["needs-split"] },
    ],
    [
      "a split Spec in triage keeps its triage label, ready-for-agent not added",
      { labels: ["spec", "needs-info", "needs-split"], subIssues: [sub(11)] },
      { add: [], remove: ["needs-split"] },
    ],
    [
      "an unsplit Spec already right: nothing",
      { labels: ["spec", "needs-split"] },
      { add: [], remove: [] },
    ],
    [
      "a split Spec already right: nothing",
      { labels: ["spec", "ready-for-agent"], subIssues: [sub(11)] },
      { add: [], remove: [] },
    ],
    [
      "a closed Spec is left alone",
      { state: "CLOSED", labels: ["spec", "ready-for-agent"] },
      null,
    ],
    [
      "an issue that is not a Spec is left alone",
      { labels: ["ready-for-agent"] },
      null,
    ],
  ] as const)("%s", (_row, more, expected) => {
    expect(specLabelsOf(issue(10, more))).toEqual(expected);
  });
});
