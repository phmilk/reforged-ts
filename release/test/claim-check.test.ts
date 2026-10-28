import { describe, expect, it } from "vitest";
import { BOARD_OWNER, BOARD_REPOSITORIES } from "../src/board.js";
import {
  COVERAGE_MARKER,
  CRITERIA_MARKER,
  MARKER,
  MAX_ASSIGNMENTS,
  planClosed,
  planIssue,
  planPullRequest,
  SPEC_LABEL,
  SPEC_MARKER,
  type ClosedInput,
  type ClosingIssue,
  type ClosingPullRequest,
  type IssueInput,
  type ParentSpec,
  type PullRequestInput,
} from "../src/claim-check.js";
import { LABELS } from "../src/repo-settings.js";
import type { FetchedSpec, FetchedTicket } from "../src/spec-check.js";
import { readWorkflow } from "./support/workflows.js";

const REPOSITORY = "owner/fork";

// The seven texts of #529, "The check's comment texts", word for word, with
// the fixtures' logins: alice the author, bob the other login, owner the
// repository's owner.
const TEXT_1 =
  '**Claim check.** Assigned #12 to @alice. Under the Claim protocol the Claim comes before the work: `gh issue edit 12 --add-assignee @me`, as the first write. See `docs/agents/issue-tracker.md`, "Claim".';
const TEXT_2 =
  '**Claim check failed.** #12 is claimed by @bob (the assignee is the Claim: one login per issue), and this pull request would close it. Coordinate with them or, if the Claim is stale (3 days without a commit on their pull request and without a comment), take it over: comment on #12 first, then `gh issue edit 12 --remove-assignee bob --add-assignee @me`. Then re-run this check (Actions, "Re-run jobs") or push a commit. See `docs/agents/issue-tracker.md`, "Claim".';
const TEXT_3 =
  "**Claim check.** #12 could not be assigned to @alice: GitHub assigns only a login with push access or a comment on the issue. Comment on #12 and re-run this check, or a maintainer assigns it.";
const TEXT_4 =
  "**Claim conflict.** @bob was added to #12, which is claimed by @alice: one login per issue, and a second assignee is added only by the first, for pairing. If the Claim is stale (3 days without a commit on its pull request and without a comment), take it over: comment, then `gh issue edit 12 --remove-assignee alice`. Otherwise withdraw: `gh issue edit 12 --remove-assignee @me`.";
const TEXT_5 =
  "**Claim conflict.** @alice claimed #12, but the open pull request #40 by @bob closes it. One login per issue: coordinate, and leave one Claim and one pull request. A stale pull request (3 days without a commit and without a comment) may be taken over: comment on #12 first.";
const TEXT_6 = "**Claim conflict** resolved.";
const TEXT_7 = "**Claim check** passed.";

// The texts on a Ticket's Spec: #10 is the Spec of #12.
const TEXT_SPEC_JOINED =
  '**Claim check.** Added @alice to #10, the Spec of #12: a Spec carries every login on its Tickets. Join it in the command that claims a Ticket: `gh issue edit 12 10 --add-assignee @me`. See `docs/agents/issue-tracker.md`, "Claim".';

/** The comment on Ticket #12 that names the command joining alice to owner/other#10. */
const JOIN_COMMAND = `${SPEC_MARKER}\n\n**Claim check.** @alice is not among the assignees of owner/other#10, the Spec of #12, and the check cannot add them there: its token writes in this repository only. Join it: \`gh issue edit https://github.com/owner/other/issues/10 --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim", "A Spec's assignees".`;

/** A sticky comment's body: the marker, then one text per issue. */
const body = (...texts: string[]) => [MARKER, ...texts].join("\n\n");

/** An issue of this repository, assignable to the author, outside a Spec. */
function issue(
  number: number,
  assignees: string[] = [],
  more: Partial<ClosingIssue> = {},
): ClosingIssue {
  return {
    repository: REPOSITORY,
    number,
    assignees,
    authorAssignable: true,
    spec: null,
    isSpec: false,
    openBlockers: [],
    body: "",
    ...more,
  };
}

/** The Spec #10 of this repository, the parent of a Ticket, assignable to the author. */
function spec(
  assignees: string[] = [],
  more: Partial<ParentSpec> = {},
): ParentSpec {
  return {
    repository: REPOSITORY,
    number: 10,
    url: `https://github.com/${REPOSITORY}/issues/10`,
    assignees,
    authorAssignable: true,
    joinComment: null,
    ...more,
  };
}

/** The pull request #34 by alice, closing `closing`. */
function pullRequest(
  closing: ClosingIssue[],
  comment: PullRequestInput["comment"] = null,
): PullRequestInput {
  return {
    repository: REPOSITORY,
    pullRequest: { number: 34, author: "alice" },
    closing,
    comment,
    criteriaComment: null,
  };
}

// The texts of ADR 0025's rules, word for word: a pull request closing Spec #12,
// one closing Ticket #12 with an open blocker.
const TEXT_SPEC_CLOSED =
  '**Claim check failed.** #12 is a Spec, and this pull request would close it. A Spec is never closed by a pull request: name the Tickets this one delivers instead (`Closes #<ticket>`), and whoever merges the last of them closes the Spec after its coverage check. See `docs/agents/issue-tracker.md`, "Closing a Spec".';
const TEXT_BLOCKED =
  '**Claim check failed.** #12 is blocked by #9 and owner/other#5, still open, and this pull request would close it without them. Deliver them first, or in this pull request too (name them among the issues it closes), then re-run this check. See `docs/agents/issue-tracker.md`, "Claim".';

describe("planPullRequest", () => {
  it("fails a pull request that would close a Spec, and assigns nothing", () => {
    expect(
      planPullRequest(pullRequest([issue(12, [], { isSpec: true })])),
    ).toEqual({
      verdict: "failed",
      assignments: [],
      comments: [{ number: 34, id: null, body: body(TEXT_SPEC_CLOSED) }],
      summary: [
        "- #12: a Spec; failed: a pull request names the Tickets it delivers, never their Spec.",
      ],
      exitCode: 1,
    });
  });

  it("fails a pull request that would close a Ticket with open blockers it does not close, naming each, and claims nothing", () => {
    const blocked = issue(12, [], {
      openBlockers: [
        { repository: REPOSITORY, number: 9 },
        { repository: "owner/other", number: 5 },
      ],
    });

    expect(planPullRequest(pullRequest([blocked]))).toEqual({
      verdict: "failed",
      assignments: [],
      comments: [{ number: 34, id: null, body: body(TEXT_BLOCKED) }],
      summary: [
        "- #12: blocked by #9 and owner/other#5, open and not closed by this pull request; failed.",
      ],
      exitCode: 1,
    });
  });

  it("passes a pull request that closes a Ticket together with its open blockers, in either repository", () => {
    const plan = planPullRequest(
      pullRequest([
        issue(12, [], {
          openBlockers: [
            { repository: REPOSITORY, number: 9 },
            { repository: "owner/other", number: 5 },
          ],
        }),
        issue(9),
        issue(5, [], { repository: "owner/other" }),
      ]),
    );

    expect(plan.verdict).toBe("passed");
    expect(plan.assignments).toEqual([
      { issue: 12, login: "alice" },
      { issue: 9, login: "alice" },
    ]);
  });

  it("names the one open blocker it does not close, once", () => {
    const plan = planPullRequest(
      pullRequest([
        issue(12, ["alice"], {
          openBlockers: [
            { repository: REPOSITORY, number: 9 },
            { repository: REPOSITORY, number: 11 },
          ],
        }),
        issue(11, ["alice"]),
      ]),
    );

    expect(plan.verdict).toBe("failed");
    expect(plan.comments).toEqual([
      {
        number: 34,
        id: null,
        body: body(
          '**Claim check failed.** #12 is blocked by #9, still open, and this pull request would close it without it. Deliver it first, or in this pull request too (name it among the issues it closes), then re-run this check. See `docs/agents/issue-tracker.md`, "Claim".',
        ),
      },
    ]);
  });

  it("assigns the author to an unclaimed issue and says so (text 1)", () => {
    expect(planPullRequest(pullRequest([issue(12)]))).toEqual({
      verdict: "passed",
      assignments: [{ issue: 12, login: "alice" }],
      comments: [{ number: 34, id: null, body: body(TEXT_1) }],
      summary: ["- #12: no assignee; assigned to the author @alice."],
      exitCode: 0,
    });
  });

  it("passes the author's own issue without a word", () => {
    expect(planPullRequest(pullRequest([issue(12, ["alice"])]))).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [],
      summary: ["- #12: claimed by @alice, the author; passed."],
      exitCode: 0,
    });
  });

  it("passes the author among the assignees (pairing)", () => {
    const plan = planPullRequest(pullRequest([issue(12, ["bob", "alice"])]));

    expect(plan).toMatchObject({
      verdict: "passed",
      assignments: [],
      comments: [],
      exitCode: 0,
    });
    expect(plan.summary).toEqual([
      "- #12: claimed by @bob, @alice, the author among them; passed.",
    ]);
  });

  it("fails on an issue claimed by another login (text 2)", () => {
    expect(planPullRequest(pullRequest([issue(12, ["bob"])]))).toEqual({
      verdict: "failed",
      assignments: [],
      comments: [{ number: 34, id: null, body: body(TEXT_2) }],
      summary: ["- #12: claimed by @bob, not by the author @alice; failed."],
      exitCode: 1,
    });
  });

  it("names the first assignee when a pair holds the issue", () => {
    const plan = planPullRequest(pullRequest([issue(12, ["bob", "carol"])]));

    expect(plan.comments[0]?.body).toBe(body(TEXT_2));
    expect(plan.summary).toEqual([
      "- #12: claimed by @bob, @carol, not by the author @alice; failed.",
    ]);
  });

  it("gives several issues one line each, and the worst verdict", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, ["bob"]), issue(13), issue(14, ["alice"])]),
    );

    expect(plan).toEqual({
      verdict: "failed",
      assignments: [{ issue: 13, login: "alice" }],
      comments: [
        {
          number: 34,
          id: null,
          body: body(TEXT_2, TEXT_1.replaceAll("12", "13")),
        },
      ],
      summary: [
        "- #12: claimed by @bob, not by the author @alice; failed.",
        "- #13: no assignee; assigned to the author @alice.",
        "- #14: claimed by @alice, the author; passed.",
      ],
      exitCode: 1,
    });
  });

  it("passes a pull request that closes no issue, with a summary line", () => {
    expect(planPullRequest(pullRequest([]))).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [],
      summary: ["- #34 closes no issue of this repository; passed."],
      exitCode: 0,
    });
  });

  it("ignores an issue of the other repository and names it in the summary", () => {
    const plan = planPullRequest(
      pullRequest([issue(5, [], { repository: "owner/other" })]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [],
      summary: [
        "- owner/other#5: an issue of another repository; ignored.",
        "- #34 closes no issue of this repository; passed.",
      ],
      exitCode: 0,
    });
  });

  it("passes an author GitHub cannot assign, with text 3", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, [], { authorAssignable: false })]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [{ number: 34, id: null, body: body(TEXT_3) }],
      summary: [
        "- #12: no assignee, and the author @alice cannot be assigned; passed, with a comment.",
      ],
      exitCode: 0,
    });
  });

  it("leaves a bot author to the workflow's if: the function checks any author", () => {
    const plan = planPullRequest({
      ...pullRequest([issue(12)]),
      pullRequest: { number: 34, author: "renovate[bot]" },
    });

    expect(plan.assignments).toEqual([{ issue: 12, login: "renovate[bot]" }]);
  });

  it("assigns at most 20 issues per run; the rest get a summary line each and one line in the comment", () => {
    const issues = Array.from({ length: 23 }, (_, i) => issue(100 + i));
    const plan = planPullRequest(pullRequest(issues));

    expect(MAX_ASSIGNMENTS).toBe(20);
    expect(plan.verdict).toBe("passed");
    expect(plan.exitCode).toBe(0);
    expect(plan.assignments).toEqual(
      issues
        .slice(0, 20)
        .map(({ number }) => ({ issue: number, login: "alice" })),
    );
    const texts = (plan.comments[0]?.body ?? "").split("\n\n");
    expect(texts).toHaveLength(1 + 20 + 1);
    expect(texts[1]).toBe(TEXT_1.replaceAll("12", "100"));
    expect(texts.at(-1)).toBe(
      "**Claim check.** This pull request closes too many issues to claim them here: at most 20 are assigned per run, and #120, #121, #122 were not. Claim each one yourself, as the first write: `gh issue edit <n> --add-assignee @me`.",
    );
    expect(plan.summary.slice(20)).toEqual(
      [120, 121, 122].map(
        (n) =>
          `- #${String(n)}: no assignee; not assigned: the pull request closes too many issues to claim them here (at most 20 per run).`,
      ),
    );
  });

  it("counts assignments only against the cap, and still fails on a claimed issue past it", () => {
    const unclaimed = Array.from({ length: 20 }, (_, i) => issue(100 + i));
    const plan = planPullRequest(
      pullRequest([
        issue(12, [], { authorAssignable: false }),
        ...unclaimed,
        issue(13, ["bob"]),
        issue(14),
      ]),
    );

    expect(plan.verdict).toBe("failed");
    expect(plan.exitCode).toBe(1);
    expect(plan.assignments).toHaveLength(20);
    expect(plan.assignments.map(({ issue: n }) => n)).not.toContain(14);
    expect(plan.comments[0]?.body).toContain(TEXT_3);
    expect(plan.comments[0]?.body).toContain(
      TEXT_2.replaceAll("#12", "#13").replace("edit 12", "edit 13"),
    );
    expect(plan.comments[0]?.body).toContain("and #14 was not.");
  });

  it("adds the author to the parent Spec of a Ticket it closes when they are missing, and says so", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, [], { spec: spec(["bob"]) })]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [
        { issue: 12, login: "alice" },
        { issue: 10, login: "alice" },
      ],
      comments: [
        { number: 34, id: null, body: body(TEXT_1, TEXT_SPEC_JOINED) },
      ],
      summary: [
        "- #12: no assignee; assigned to the author @alice.",
        "- #10, the Spec of #12: the author @alice is not among its assignees; assigned to them.",
      ],
      exitCode: 0,
    });
  });

  it("leaves the parent Spec alone when the author is on it, or holds none of the Tickets it closes", () => {
    const onSpec = planPullRequest(
      pullRequest([issue(12, ["alice"], { spec: spec(["bob", "alice"]) })]),
    );
    const notHeld = planPullRequest(
      pullRequest([issue(12, ["bob"], { spec: spec(["bob"]) })]),
    );

    expect(onSpec).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [],
      summary: [
        "- #12: claimed by @alice, the author; passed.",
        "- #10, the Spec of #12: the author @alice among its assignees.",
      ],
      exitCode: 0,
    });
    // The Ticket is another login's: the author joins nothing.
    expect(notHeld).toMatchObject({
      verdict: "failed",
      assignments: [],
      comments: [{ number: 34, id: null, body: body(TEXT_2) }],
    });
  });

  it("adds the author to a Spec once for two of its Tickets", () => {
    const plan = planPullRequest(
      pullRequest([
        issue(12, [], { spec: spec() }),
        issue(13, ["alice"], { spec: spec() }),
      ]),
    );

    expect(plan.assignments).toEqual([
      { issue: 12, login: "alice" },
      { issue: 10, login: "alice" },
    ]);
    expect(plan.comments[0]?.body).toBe(body(TEXT_1, TEXT_SPEC_JOINED));
    expect(plan.summary).toEqual([
      "- #12: no assignee; assigned to the author @alice.",
      "- #10, the Spec of #12: the author @alice is not among its assignees; assigned to them.",
      "- #13: claimed by @alice, the author; passed.",
    ]);
  });

  it("passes an author GitHub cannot assign to the Spec, with text 3 for the Spec", () => {
    const plan = planPullRequest(
      pullRequest([
        issue(12, ["alice"], { spec: spec([], { authorAssignable: false }) }),
      ]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [
        {
          number: 34,
          id: null,
          body: body(TEXT_3.replaceAll("#12", "#10")),
        },
      ],
      summary: [
        "- #12: claimed by @alice, the author; passed.",
        "- #10, the Spec of #12: the author @alice is not among its assignees, and cannot be assigned; passed, with a comment.",
      ],
      exitCode: 0,
    });
  });

  it("comments on the Ticket the command that joins a Spec of the other repository, which the check cannot write", () => {
    const other = spec(["bob"], {
      repository: "owner/other",
      url: "https://github.com/owner/other/issues/10",
    });
    const text = JOIN_COMMAND;
    const plan = planPullRequest(
      pullRequest([issue(12, ["alice"], { spec: other })]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [{ number: 12, id: null, body: text }],
      summary: [
        "- #12: claimed by @alice, the author; passed.",
        "- owner/other#10, the Spec of #12: the author @alice is not among its assignees, in another repository; the command that joins it commented on #12.",
      ],
      exitCode: 0,
    });
    // Once said, not again on the next push.
    expect(
      planPullRequest(
        pullRequest([
          issue(12, ["alice"], {
            spec: { ...other, joinComment: { id: 9, body: text } },
          }),
        ]),
      ).comments,
    ).toEqual([]);
  });

  it("rewrites the comment on the Ticket once the author is on the Spec of the other repository", () => {
    const other = spec(["bob", "alice"], {
      repository: "owner/other",
      url: "https://github.com/owner/other/issues/10",
    });
    const joined = `${SPEC_MARKER}\n\n**Claim check.** @alice is among the assignees of owner/other#10, the Spec of #12: nothing left to join.`;
    const plan = planPullRequest(
      pullRequest([
        issue(12, ["alice"], {
          spec: {
            ...other,
            joinComment: { id: 9, body: JOIN_COMMAND },
          },
        }),
      ]),
    );

    expect(plan).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [{ number: 12, id: 9, body: joined }],
      summary: [
        "- #12: claimed by @alice, the author; passed.",
        "- owner/other#10, the Spec of #12: the author @alice among its assignees.",
      ],
      exitCode: 0,
    });
    // Settled once; and no comment when there was none to settle.
    expect(
      planPullRequest(
        pullRequest([
          issue(12, ["alice"], {
            spec: { ...other, joinComment: { id: 9, body: joined } },
          }),
        ]),
      ).comments,
    ).toEqual([]);
    expect(
      planPullRequest(pullRequest([issue(12, ["alice"], { spec: other })]))
        .comments,
    ).toEqual([]);
  });

  it("leaves another author's pending command on the Ticket when the author is on the Spec of the other repository", () => {
    // bob's pull request left the command; alice's finds her on the Spec.
    const bobs = JOIN_COMMAND.replace("@alice", "@bob");
    const plan = planPullRequest(
      pullRequest([
        issue(12, ["alice", "bob"], {
          spec: spec(["alice"], {
            repository: "owner/other",
            url: "https://github.com/owner/other/issues/10",
            joinComment: { id: 9, body: bobs },
          }),
        }),
      ]),
    );

    expect(plan.comments).toEqual([]);
    expect(plan.summary).toContain(
      "- owner/other#10, the Spec of #12: the author @alice among its assignees.",
    );
  });

  it("handles the comment of each Ticket of one Spec of the other repository", () => {
    const other = {
      repository: "owner/other",
      url: "https://github.com/owner/other/issues/10",
    };
    const on13 = JOIN_COMMAND.replaceAll("#12", "#13");
    const missing = planPullRequest(
      pullRequest([
        issue(12, ["alice"], { spec: spec(["bob"], other) }),
        issue(13, ["alice"], { spec: spec(["bob"], other) }),
      ]),
    );
    const joined = planPullRequest(
      pullRequest([
        issue(12, ["alice"], {
          spec: spec(["alice"], {
            ...other,
            joinComment: { id: 8, body: JOIN_COMMAND },
          }),
        }),
        issue(13, ["alice"], {
          spec: spec(["alice"], {
            ...other,
            joinComment: { id: 9, body: on13 },
          }),
        }),
      ]),
    );

    expect(missing.comments).toEqual([
      { number: 12, id: null, body: JOIN_COMMAND },
      { number: 13, id: null, body: on13 },
    ]);
    expect(joined.comments).toEqual([
      {
        number: 12,
        id: 8,
        body: `${SPEC_MARKER}\n\n**Claim check.** @alice is among the assignees of owner/other#10, the Spec of #12: nothing left to join.`,
      },
      {
        number: 13,
        id: 9,
        body: `${SPEC_MARKER}\n\n**Claim check.** @alice is among the assignees of owner/other#10, the Spec of #13: nothing left to join.`,
      },
    ]);
  });

  it("does not count the Specs it joins against the cap of 20", () => {
    const tickets = Array.from({ length: 20 }, (_, i) =>
      issue(100 + i, [], {
        spec: spec([], { number: 200 + i, url: `u${String(i)}` }),
      }),
    );
    const plan = planPullRequest(pullRequest(tickets));

    expect(plan.assignments).toHaveLength(40);
    expect(plan.comments[0]?.body).not.toContain("too many issues");
  });

  it("rewrites a failure to text 7 once the pull request passes", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, ["alice"])], { id: 7, body: body(TEXT_2) }),
    );

    expect(plan.comments).toEqual([{ number: 34, id: 7, body: body(TEXT_7) }]);
    expect(plan.exitCode).toBe(0);
  });

  it("leaves a reminder (text 1, text 3) alone on a clean push: only a failure is replaced", () => {
    const passing = [issue(12, ["alice"])];

    for (const text of [TEXT_1, TEXT_3, TEXT_7]) {
      const plan = planPullRequest(
        pullRequest(passing, { id: 7, body: body(text) }),
      );
      expect(plan.comments, text).toEqual([]);
      expect(plan.exitCode).toBe(0);
    }
    // A failure next to a reminder is a failure: text 7 replaces both.
    expect(
      planPullRequest(
        pullRequest(passing, {
          id: 7,
          body: body(TEXT_1.replaceAll("12", "13"), TEXT_2),
        }),
      ).comments,
    ).toEqual([{ number: 34, id: 7, body: body(TEXT_7) }]);
  });

  it("edits the marked comment in place, never a second one", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, ["bob"])], { id: 7, body: body(TEXT_1) }),
    );

    expect(plan.comments).toEqual([{ number: 34, id: 7, body: body(TEXT_2) }]);
  });

  it("leaves a comment that already reads as it should", () => {
    const failing = pullRequest([issue(12, ["bob"])], {
      id: 7,
      body: body(TEXT_2).replaceAll("\n", "\r\n"),
    });
    const passed = pullRequest([issue(12, ["alice"])], {
      id: 7,
      body: body(TEXT_7),
    });

    expect(planPullRequest(failing).comments).toEqual([]);
    expect(planPullRequest(failing).exitCode).toBe(1);
    expect(planPullRequest(passed).comments).toEqual([]);
  });
});

/** The body of Ticket #12: one criterion delivered, three gaps of the coverage rule. */
const TICKET_BODY = `## What to build

- [ ] A box outside the criteria, never read.

## Acceptance criteria

- [x] The check passes.
- [ ] The doc names the comment.
- [ ] **Check whether** the token can write labels.
- [x] Check whether the App holds issues write.
  Outcome: it does.
- [x] Check whether the reconcile follows.
`;

/** What the check says of Ticket #12's body, word for word. */
const TEXT_CRITERIA =
  '**Criteria left.** #12, which this pull request closes, has what `pnpm spec:check` counts as gaps when its Spec closes:\n\n- unchecked: The doc names the comment.\n- unchecked, no `Outcome:` line: **Check whether** the token can write labels.\n- no `Outcome:` line: Check whether the reconcile follows.\n\nCheck each box once the review confirms it holds, and write the outcome of each "check whether…" in an indented `Outcome:` line under it, in the body of #12. This comment is updated on the pull request\'s next push or edit. See `docs/agents/issue-tracker.md`, "A Spec\'s coverage".';

/** The criteria comment once nothing is left. */
const TEXT_CRITERIA_SETTLED = "**Criteria left:** none.";

/** A criteria comment's body: its marker, then one text per Ticket. */
const criteriaBody = (...texts: string[]) =>
  [CRITERIA_MARKER, ...texts].join("\n\n");

/** Ticket #12 of Spec #10, the author's, with `body`. */
const ticket = (body: string): ClosingIssue =>
  issue(12, ["alice"], { spec: spec(["alice"]), body });

describe("planPullRequest, a Ticket's criteria", () => {
  it("comments the criteria a closed Ticket still lacks, and passes", () => {
    expect(planPullRequest(pullRequest([ticket(TICKET_BODY)]))).toEqual({
      verdict: "passed",
      assignments: [],
      comments: [{ number: 34, id: null, body: criteriaBody(TEXT_CRITERIA) }],
      summary: [
        "- #12: claimed by @alice, the author; passed.",
        "- #10, the Spec of #12: the author @alice among its assignees.",
        "- #12: 3 criteria unchecked or without their outcome; commented.",
      ],
      exitCode: 0,
    });
  });

  it("settles its comment once every criterion is checked, with its outcome", () => {
    const delivered = TICKET_BODY.replaceAll("- [ ]", "- [x]")
      .replace("labels.\n", "labels.\n  Outcome: it can.\n")
      .replace("follows.\n", "follows.\n  Outcome: it does.\n");

    expect(
      planPullRequest({
        ...pullRequest([ticket(delivered)]),
        criteriaComment: { id: 8, body: criteriaBody(TEXT_CRITERIA) },
      }).comments,
    ).toEqual([
      { number: 34, id: 8, body: criteriaBody(TEXT_CRITERIA_SETTLED) },
    ]);
    expect(planPullRequest(pullRequest([ticket(delivered)])).comments).toEqual(
      [],
    );
  });

  it("reads only Tickets: an issue outside a Spec keeps its boxes to itself", () => {
    expect(
      planPullRequest(
        pullRequest([issue(12, ["alice"], { body: TICKET_BODY })]),
      ).comments,
    ).toEqual([]);
  });

  it("names the criteria of a Ticket another login holds, beside the failure", () => {
    const held = issue(12, ["bob"], { spec: spec(["bob"]), body: TICKET_BODY });

    expect(planPullRequest(pullRequest([held])).comments).toEqual([
      { number: 34, id: null, body: body(TEXT_2) },
      { number: 34, id: null, body: criteriaBody(TEXT_CRITERIA) },
    ]);
  });
});

/** The pull request `number` by `author` that references issue #12 as closed by it. */
function closingPullRequest(
  number: number,
  author: string,
  state: ClosingPullRequest["state"],
  more: Partial<ClosingPullRequest> = {},
): ClosingPullRequest {
  return { repository: REPOSITORY, number, author, bot: false, state, ...more };
}

/** The `assigned` event on #12: `sender` added `assignee`; `assignees` re-read. */
function assigned(
  assignee: string,
  sender: string,
  assignees: string[],
  more: Partial<IssueInput> = {},
): IssueInput {
  return {
    repository: REPOSITORY,
    action: "assigned",
    issue: 12,
    assignee,
    sender,
    owner: "owner",
    assignees,
    ticketAssignees: null,
    unsplit: false,
    openBlockers: [],
    pullRequests: [],
    comment: null,
    ...more,
  };
}

// The premature Claims of ADR 0025, word for word: #12 an unsplit Spec, or
// an issue blocked by #9 and owner/other#5.
const TEXT_UNSPLIT_CLAIM =
  '**Premature Claim.** #12 is a Spec with no Ticket yet (`needs-split`), and it is assigned: an unsplit Spec is not worked, whole or in part. Split it first; each Ticket is then claimed with its Spec, `gh issue edit <ticket> 12 --add-assignee @me`. Nothing was unassigned. See `docs/agents/issue-tracker.md`, "Claim".';
const TEXT_BLOCKED_CLAIM =
  '**Premature Claim.** #12 is claimed, but it is blocked by #9 and owner/other#5, still open: an issue is worked once its blockers are closed, or delivered with them in one pull request, as `implement-spec`\'s is. Nothing was unassigned. See `docs/agents/issue-tracker.md`, "Claim".';
const TEXT_PREMATURE_SETTLED = "**Premature Claim** settled.";
const BLOCKERS = [
  { repository: REPOSITORY, number: 9 },
  { repository: "owner/other", number: 5 },
];

describe("planIssue", () => {
  it("comments on a Claim of an unsplit Spec, and unassigns nothing", () => {
    expect(
      planIssue(
        assigned("alice", "alice", ["alice"], {
          ticketAssignees: [],
          unsplit: true,
        }),
      ),
    ).toEqual({
      verdict: "premature",
      assignments: [],
      comments: [{ number: 12, id: null, body: body(TEXT_UNSPLIT_CLAIM) }],
      summary: ["- #12: a Spec with no Ticket, assigned to @alice; premature."],
      exitCode: 0,
    });
  });

  it("comments on a Claim of an issue with open blockers, naming each, and unassigns nothing", () => {
    expect(
      planIssue(
        assigned("alice", "alice", ["alice"], { openBlockers: BLOCKERS }),
      ),
    ).toEqual({
      verdict: "premature",
      assignments: [],
      comments: [{ number: 12, id: null, body: body(TEXT_BLOCKED_CLAIM) }],
      summary: [
        "- #12: claimed by @alice, blocked by #9 and owner/other#5; premature.",
      ],
      exitCode: 0,
    });
  });

  it("puts a premature Claim and a conflict in the one comment", () => {
    const plan = planIssue(
      assigned("bob", "bob", ["alice", "bob"], { openBlockers: BLOCKERS }),
    );

    expect(plan.verdict).toBe("conflict");
    expect(plan.comments).toEqual([
      { number: 12, id: null, body: body(TEXT_4, TEXT_BLOCKED_CLAIM) },
    ]);
  });

  it("draws nothing on an unassigned issue, blocked or an unsplit Spec, and settles an earlier comment that held premature Claims only", () => {
    const plan = planIssue({
      ...assigned("alice", "alice", [], {
        unsplit: true,
        openBlockers: BLOCKERS,
      }),
      action: "unassigned",
      comment: { id: 3, body: body(TEXT_BLOCKED_CLAIM) },
    });

    expect(plan.verdict).toBe("clear");
    expect(plan.comments).toEqual([
      { number: 12, id: 3, body: body(TEXT_PREMATURE_SETTLED) },
    ]);
  });

  it("settles a comment that held a conflict and a premature Claim to text 6", () => {
    const plan = planIssue({
      ...assigned("bob", "bob", ["alice"], { openBlockers: BLOCKERS }),
      action: "unassigned",
      openBlockers: [],
      comment: { id: 3, body: body(TEXT_4, TEXT_BLOCKED_CLAIM) },
    });

    expect(plan.comments).toEqual([{ number: 12, id: 3, body: body(TEXT_6) }]);
  });

  it("draws nothing on pairing: the first assignee added the second", () => {
    expect(planIssue(assigned("bob", "alice", ["alice", "bob"]))).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [],
      summary: [
        "- #12: @bob added by @alice, an assignee (pairing); no conflict.",
      ],
      exitCode: 0,
    });
  });

  it("draws nothing when the repository owner is the sender", () => {
    expect(planIssue(assigned("bob", "owner", ["alice", "bob"]))).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [],
      summary: [
        "- #12: @bob added by @owner, the repository owner; no conflict.",
      ],
      exitCode: 0,
    });
  });

  it("comments text 4 on a second assignee who added themselves", () => {
    expect(planIssue(assigned("bob", "bob", ["alice", "bob"]))).toEqual({
      verdict: "conflict",
      assignments: [],
      comments: [{ number: 12, id: null, body: body(TEXT_4) }],
      summary: [
        "- #12: @bob added by @bob to an issue claimed by @alice; conflict.",
      ],
      exitCode: 0,
    });
  });

  it("comments text 4 on a second assignee added by a third login", () => {
    const plan = planIssue(assigned("bob", "carol", ["alice", "bob"]));

    expect(plan.comments).toEqual([
      { number: 12, id: null, body: body(TEXT_4) },
    ]);
    expect(plan.summary).toEqual([
      "- #12: @bob added by @carol to an issue claimed by @alice; conflict.",
    ]);
  });

  it("draws nothing when the newcomer is gone from the re-read assignees", () => {
    const plan = planIssue(assigned("bob", "bob", ["alice"]));

    expect(plan).toMatchObject({ verdict: "clear", comments: [] });
    expect(plan.summary).toEqual(["- #12: claimed by @alice; no conflict."]);
  });

  it("draws nothing on a first assignment", () => {
    expect(planIssue(assigned("alice", "alice", ["alice"]))).toMatchObject({
      verdict: "clear",
      comments: [],
      summary: ["- #12: claimed by @alice; no conflict."],
    });
  });

  it("comments text 5 on an open pull request by a login outside the assignees", () => {
    const plan = planIssue(
      assigned("alice", "alice", ["alice"], {
        pullRequests: [closingPullRequest(40, "bob", "OPEN")],
      }),
    );

    expect(plan).toEqual({
      verdict: "conflict",
      assignments: [],
      comments: [{ number: 12, id: null, body: body(TEXT_5) }],
      summary: [
        "- #12: the open pull request #40 by @bob closes it, claimed by @alice; conflict.",
      ],
      exitCode: 0,
    });
  });

  it("does not count a merged or closed pull request as open", () => {
    const plan = planIssue(
      assigned("alice", "alice", ["alice"], {
        pullRequests: [
          closingPullRequest(40, "bob", "MERGED"),
          closingPullRequest(41, "bob", "CLOSED"),
        ],
      }),
    );

    expect(plan).toMatchObject({ verdict: "clear", comments: [] });
  });

  it("does not count the assignees' own, a bot's or another repository's pull request", () => {
    const plan = planIssue(
      assigned("carol", "alice", ["alice", "carol"], {
        pullRequests: [
          closingPullRequest(40, "alice", "OPEN"),
          closingPullRequest(41, "carol", "OPEN"),
          closingPullRequest(42, "renovate", "OPEN", { bot: true }),
          closingPullRequest(43, "bob", "OPEN", { repository: "owner/other" }),
        ],
      }),
    );

    expect(plan).toMatchObject({ verdict: "clear", comments: [] });
  });

  it("draws nothing on an issue nobody claims, whatever closes it", () => {
    const plan = planIssue(
      assigned("alice", "alice", [], {
        action: "unassigned",
        pullRequests: [closingPullRequest(40, "bob", "OPEN")],
      }),
    );

    expect(plan).toMatchObject({
      verdict: "clear",
      comments: [],
      summary: ["- #12: no assignee; no conflict."],
    });
  });

  it("puts both conflicts in the one comment", () => {
    const plan = planIssue(
      assigned("bob", "bob", ["alice", "bob"], {
        pullRequests: [closingPullRequest(40, "carol", "OPEN")],
      }),
    );

    expect(plan.comments).toEqual([
      {
        number: 12,
        id: null,
        body: body(TEXT_4, TEXT_5.replace("@bob", "@carol")),
      },
    ]);
  });

  it("rewrites the comment to text 6 once no conflict remains", () => {
    const plan = planIssue(
      assigned("bob", "bob", ["alice"], {
        action: "unassigned",
        comment: { id: 7, body: body(TEXT_4) },
      }),
    );

    expect(plan).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [{ number: 12, id: 7, body: body(TEXT_6) }],
      summary: ["- #12: claimed by @alice; no conflict."],
      exitCode: 0,
    });
  });

  it("keeps the conflict comment while a second assignee stays: a partner added by the first, or a third leaving", () => {
    const comment = { id: 7, body: body(TEXT_4) };
    const partnerAdded = planIssue(
      assigned("carol", "alice", ["alice", "bob", "carol"], { comment }),
    );
    const thirdLeft = planIssue(
      assigned("carol", "carol", ["alice", "bob"], {
        action: "unassigned",
        comment,
      }),
    );

    expect(partnerAdded).toMatchObject({ verdict: "clear", comments: [] });
    expect(partnerAdded.summary).toEqual([
      "- #12: @carol added by @alice, an assignee (pairing); no conflict.",
    ]);
    expect(thirdLeft).toMatchObject({ verdict: "clear", comments: [] });
    // Back to one assignee: the conflict is gone.
    expect(
      planIssue(
        assigned("bob", "bob", ["alice"], { action: "unassigned", comment }),
      ).comments,
    ).toEqual([{ number: 12, id: 7, body: body(TEXT_6) }]);
  });

  it("edits the marked comment in place on a new conflict", () => {
    const plan = planIssue(
      assigned("bob", "bob", ["alice", "bob"], {
        comment: { id: 7, body: body(TEXT_6) },
      }),
    );

    expect(plan.comments).toEqual([{ number: 12, id: 7, body: body(TEXT_4) }]);
  });

  it("draws nothing on a login added to a Spec who holds or delivered one of its Tickets", () => {
    // bob holds an open Ticket of #12, alice delivered a closed one.
    const plan = planIssue(
      assigned("bob", "bob", ["alice", "bob"], {
        ticketAssignees: ["alice", "bob"],
      }),
    );

    expect(plan).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [],
      summary: [
        "- #12, a Spec: @bob, who holds or delivered one of its Tickets, added by @bob; no conflict.",
      ],
      exitCode: 0,
    });
  });

  it("comments text 4 on a login added to a Spec who holds or delivered none of its Tickets, unless the owner added them", () => {
    const heldTickets = { ticketAssignees: ["alice", "carol"] };

    expect(
      planIssue(assigned("bob", "bob", ["alice", "bob"], heldTickets)),
    ).toEqual({
      verdict: "conflict",
      assignments: [],
      comments: [{ number: 12, id: null, body: body(TEXT_4) }],
      summary: [
        "- #12: @bob added by @bob to an issue claimed by @alice; conflict.",
      ],
      exitCode: 0,
    });
    // A Spec with no Ticket yet holds nobody either.
    expect(
      planIssue(
        assigned("bob", "bob", ["alice", "bob"], { ticketAssignees: [] }),
      ).verdict,
    ).toBe("conflict");
    expect(
      planIssue(assigned("bob", "owner", ["alice", "bob"], heldTickets)),
    ).toMatchObject({ verdict: "clear", comments: [] });
  });

  it("rewrites a Spec's conflict comment to text 6 once each of its assignees holds or delivered a Ticket", () => {
    const comment = { id: 7, body: body(TEXT_4) };
    // bob, the conflict of the comment, has since claimed a Ticket.
    const plan = planIssue(
      assigned("carol", "carol", ["alice", "bob", "carol"], {
        ticketAssignees: ["alice", "bob", "carol"],
        comment,
      }),
    );

    expect(plan.comments).toEqual([{ number: 12, id: 7, body: body(TEXT_6) }]);
    // One assignee still holds no Ticket: the comment stays.
    expect(
      planIssue(
        assigned("carol", "carol", ["alice", "bob", "carol"], {
          ticketAssignees: ["alice", "carol"],
          comment,
        }),
      ).comments,
    ).toEqual([]);
  });

  it("rewrites a Spec's conflict comment to text 6 when the owner adds a login that holds no Ticket", () => {
    const comment = { id: 7, body: body(TEXT_4) };

    expect(
      planIssue(
        assigned("carol", "owner", ["alice", "carol"], {
          ticketAssignees: ["alice"],
          comment,
        }),
      ).comments,
    ).toEqual([{ number: 12, id: 7, body: body(TEXT_6) }]);
    // Added by another login, the conflict stands.
    expect(
      planIssue(
        assigned("carol", "carol", ["alice", "carol"], {
          ticketAssignees: ["alice"],
          comment,
        }),
      ).comments,
    ).toEqual([
      { number: 12, id: 7, body: body(TEXT_4.replaceAll("@bob", "@carol")) },
    ]);
  });

  it("leaves a comment that already reads as it should", () => {
    const resolved = assigned("alice", "alice", ["alice"], {
      comment: { id: 7, body: body(TEXT_6) },
    });
    const conflict = assigned("bob", "bob", ["alice", "bob"], {
      comment: { id: 7, body: body(TEXT_4) },
    });

    expect(planIssue(resolved).comments).toEqual([]);
    expect(planIssue(conflict).comments).toEqual([]);
  });
});

// The closed mode (#796): Ticket #12 of the library closes; #10 is its Spec,
// #11 its other Ticket.
const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";

/** A Ticket of the Spec, closed as completed with its one criterion checked. */
function subTicket(
  number: number,
  closedAt: string | null,
  more: Partial<FetchedTicket> = {},
): FetchedTicket {
  return {
    repository: LIBRARY,
    number,
    state: closedAt === null ? "OPEN" : "CLOSED",
    stateReason: closedAt === null ? null : "COMPLETED",
    closedAt,
    assignees: ["alice"],
    body: "## Acceptance criteria\n\n- [x] It reads the body.\n",
    ...more,
  };
}

/** Spec #10 of the library, one item covered by #12, over `tickets`. */
function coverage(tickets: FetchedTicket[]): FetchedSpec {
  return {
    repository: LIBRARY,
    number: 10,
    title: "The Spec",
    body:
      "## Implementation Decisions\n\n- It reads the body.\n\n" +
      "## Coverage table\n\n| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
      "| It reads the body. | #12 | It reads the body. |\n",
    tickets,
  };
}

/** Ticket #12 of the library closed, its Spec #10 open, read as `tickets`. */
function closed(
  tickets: FetchedTicket[],
  more: Partial<ClosedInput> = {},
): ClosedInput {
  return {
    repository: LIBRARY,
    ticket: 12,
    spec: {
      repository: LIBRARY,
      number: 10,
      url: `https://github.com/${LIBRARY}/issues/10`,
      open: true,
    },
    coverage: coverage(tickets),
    comment: null,
    ...more,
  };
}

const EARLIER = "2026-10-28T15:40:00Z";
const LATER = "2026-10-28T15:49:00Z";

describe("planClosed", () => {
  it("comments the green verdict on the Spec, with the command that closes it, once its last Ticket closes", () => {
    expect(
      planClosed(closed([subTicket(11, EARLIER), subTicket(12, LATER)])),
    ).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [
        {
          number: 10,
          id: null,
          body: `${COVERAGE_MARKER}\n\n**Spec check.** Every Ticket of #10 is closed, and its coverage check, \`pnpm spec:check 10\`, is green: 1 item, 1 row, 2 Tickets. Close the Spec, which this check never does: \`gh issue close 10 --comment "The coverage check is green: 1 item, 1 row, 2 Tickets."\`. Whoever merged its last Ticket, an assignee of the Spec or the maintainer may. See \`docs/agents/issue-tracker.md\`, "Closing a Spec".`,
        },
      ],
      summary: [
        "- #12, the last Ticket of #10 to close: the coverage check is green; commented on #10.",
      ],
      exitCode: 0,
    });
  });

  it("comments the red verdict on the Spec, one line per gap as spec:check prints it, and closes nothing", () => {
    const plan = planClosed(
      closed([
        subTicket(11, EARLIER, { stateReason: "NOT_PLANNED" }),
        subTicket(12, LATER, {
          body: "## Acceptance criteria\n\n- [ ] It reads the body.\n",
        }),
      ]),
    );

    expect(plan.comments).toEqual([
      {
        number: 10,
        id: null,
        body:
          `${COVERAGE_MARKER}\n\n**Spec check.** Every Ticket of #10 is closed, but its coverage check, \`pnpm spec:check 10\`, is red: 1 item, 1 row, 2 Tickets, and 2 gaps:\n\n` +
          "- #11 closed as NOT_PLANNED, not as completed.\n" +
          '- #12 leaves a criterion unchecked: "It reads the body.".\n\n' +
          'Leave the Spec open. Whoever fills a gap runs the check again, and the Spec closes on a green check. See `docs/agents/issue-tracker.md`, "Closing a Spec".',
      },
    ]);
    expect(plan.summary).toEqual([
      "- #12, the last Ticket of #10 to close: the coverage check is red, 2 gaps; commented on #10.",
    ]);
    expect(plan.exitCode).toBe(0);
  });

  it("says nothing while a Ticket of the Spec is open, in either Board repository", () => {
    expect(
      planClosed(
        closed([
          subTicket(11, null),
          subTicket(12, LATER),
          subTicket(5, null, { repository: TEMPLATE }),
        ]),
      ),
    ).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [],
      summary: [
        `- #12, a Ticket of #10: #11 and ${TEMPLATE}#5 still open; nothing to check yet.`,
      ],
      exitCode: 0,
    });
  });

  it("leaves the comment to the run of the Ticket that closed last, by time, then by repository and number", () => {
    const later = planClosed(
      closed([subTicket(11, "2026-10-28T15:50:00Z"), subTicket(12, LATER)]),
    );
    // Closed by one merge, in the same second: the higher key comments.
    const tie = planClosed(
      closed([subTicket(11, LATER), subTicket(12, LATER)]),
    );
    const tieLost = planClosed({
      ...closed([subTicket(11, LATER), subTicket(12, LATER)]),
      ticket: 11,
    });

    expect(later.comments).toEqual([]);
    expect(later.summary).toEqual([
      "- #12, a Ticket of #10: #11 closed after it, and its run comments the coverage check.",
    ]);
    expect(tie.comments).toHaveLength(1);
    expect(tieLost.comments).toEqual([]);
  });

  it("comments on the Ticket a Spec of the other Board repository, which its token cannot write, named by its address", () => {
    const plan = planClosed(
      closed(
        [
          subTicket(11, EARLIER),
          subTicket(12, LATER, { repository: TEMPLATE }),
        ],
        { repository: TEMPLATE },
      ),
    );

    // The Coverage table names #12 of the library, a sub-issue it is not.
    expect(plan.comments).toHaveLength(1);
    expect(plan.comments[0]?.number).toBe(12);
    expect(plan.comments[0]?.body).toContain(
      `**Spec check.** Every Ticket of ${LIBRARY}#10 is closed, but its coverage check, \`pnpm spec:check 10\`, is red: 1 item, 1 row, 2 Tickets, and 1 gap:\n\n- The row of "It reads the body." names #12, which is not a sub-issue of the Spec.\n\n`,
    );
    expect(plan.summary).toEqual([
      `- #12, the last Ticket of ${LIBRARY}#10 to close: the coverage check is red, 1 gap; commented on #12.`,
    ]);
  });

  it("names the Template in the check, the Spec's address in the close command, on a Spec of the Template seen from the library", () => {
    const spec = {
      repository: TEMPLATE,
      number: 10,
      url: `https://github.com/${TEMPLATE}/issues/10`,
      open: true,
    };
    const plan = planClosed(
      closed([subTicket(11, EARLIER), subTicket(12, LATER)], {
        spec,
        coverage: {
          ...coverage([subTicket(11, EARLIER), subTicket(12, LATER)]),
          repository: TEMPLATE,
          body: coverage([]).body.replace("| #12 |", `| ${LIBRARY}#12 |`),
        },
      }),
    );

    expect(plan.comments[0]?.body).toContain(
      `its coverage check, \`pnpm spec:check 10 ${TEMPLATE}\`, is green: 1 item, 1 row, 2 Tickets. Close the Spec, which this check never does: \`gh issue close https://github.com/${TEMPLATE}/issues/10 --comment "The coverage check is green: 1 item, 1 row, 2 Tickets."\`.`,
    );
  });

  it("edits its earlier comment to the new verdict, and leaves one that already says it", () => {
    const tickets = [subTicket(11, EARLIER), subTicket(12, LATER)];
    const first = planClosed(closed(tickets)).comments[0]?.body ?? "";
    const stale = planClosed(
      closed(tickets, {
        comment: { id: 7, body: `${COVERAGE_MARKER}\n\nold` },
      }),
    );
    const same = planClosed(
      closed(tickets, {
        comment: { id: 7, body: first.replaceAll("\n", "\r\n") },
      }),
    );

    expect(stale.comments).toEqual([{ number: 10, id: 7, body: first }]);
    expect(same.comments).toEqual([]);
    expect(same.summary).toEqual([
      "- #12, the last Ticket of #10 to close: the coverage check is green; the comment on #10 already says so.",
    ]);
  });

  it("says nothing on an issue with no Spec, or whose Spec is closed", () => {
    expect(planClosed(closed([], { spec: null, coverage: null }))).toEqual({
      verdict: "clear",
      assignments: [],
      comments: [],
      summary: ["- #12: no Spec; nothing to check."],
      exitCode: 0,
    });
    expect(
      planClosed(
        closed([], {
          spec: {
            repository: LIBRARY,
            number: 10,
            url: `https://github.com/${LIBRARY}/issues/10`,
            open: false,
          },
          coverage: null,
        }),
      ).summary,
    ).toEqual([
      "- #12, a Ticket of #10: the Spec is closed; nothing to check.",
    ]);
  });
});

/** The parsed workflow `file` of this repository. */
const workflow = async (file: string) => (await readWorkflow(file)).workflow;

describe("SPEC_LABEL", () => {
  it("is the Spec label repo:settings declares", () => {
    expect(LABELS.map(({ name }) => name)).toContain(SPEC_LABEL);
  });
});

describe("claim-check.yml", () => {
  it("runs trusted code only: master of the library, no event value inline, the job's own token", async () => {
    const { on, jobs } = await workflow("claim-check.yml");
    const steps = Object.values(jobs).flatMap((job) => job?.steps ?? []);

    expect(Object.keys(on)).toEqual(["workflow_call"]);
    expect(Object.keys(jobs)).toEqual(["check", "dispatch", "board-dispatch"]);
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      if (step.uses?.startsWith("actions/checkout@")) {
        expect(step.with, "a checkout").toMatchObject({
          repository: "phmilk/reforged-ts",
          ref: "master",
        });
      }
      expect(JSON.stringify(step.with ?? {}), "a step's inputs").not.toContain(
        "github.event",
      );
      expect(step.run ?? "", "a run step").not.toContain("${{");
      for (const value of Object.values(step.env ?? {})) {
        expect(value, "a token").not.toContain("secrets.GITHUB_TOKEN");
      }
    }
    expect(
      steps.map((step) => step.run).filter((run) => run !== undefined),
    ).toEqual([
      "node release/src/claim-check.ts pull-request",
      "node release/src/claim-check.ts issue",
      "node release/src/claim-check.ts closed",
      "gh workflow run board.yml --repo phmilk/reforged-ts",
    ]);
    expect(jobs.check?.steps?.map((step) => step.env ?? {})).toContainEqual({
      GITHUB_TOKEN: "${{ github.token }}",
    });
  });

  it("runs the issue mode on an assignment, the closed mode on a close", async () => {
    const { jobs } = await workflow("claim-check.yml");
    const ifOf = (mode: string) =>
      jobs.check?.steps?.find(
        (step) => step.run === `node release/src/claim-check.ts ${mode}`,
      )?.if;

    expect(ifOf("issue")).toBe(
      "github.event_name == 'issues' && github.event.action != 'closed'",
    );
    expect(ifOf("closed")).toBe(
      "github.event_name == 'issues' && github.event.action == 'closed'",
    );
  });

  it("dispatches board.yml from its own job after an assignment in the library, the one job with actions: write", async () => {
    const { jobs } = await workflow("claim-check.yml");
    const pullRequest = jobs.check?.steps?.find(
      (step) => step.run === "node release/src/claim-check.ts pull-request",
    );
    const dispatch = jobs.dispatch;

    expect(pullRequest?.id).toBe("pull-request");
    expect(jobs.check?.outputs).toEqual({
      assigned: "${{ steps.pull-request.outputs.assigned }}",
    });
    expect(jobs.check?.permissions).toEqual({
      contents: "read",
      issues: "write",
      "pull-requests": "write",
    });
    expect(dispatch?.needs).toBe("check");
    // Not cancelled, not a plain success: the run that assigned one issue
    // and failed on another dispatches too.
    expect(dispatch?.if).toBe(
      "${{ !cancelled() && github.repository == 'phmilk/reforged-ts' && needs.check.outputs.assigned != '' }}",
    );
    expect(dispatch?.permissions).toEqual({ actions: "write" });
    expect(dispatch?.["timeout-minutes"]).toBe(2);
    expect(dispatch?.steps).toHaveLength(1);
    expect(dispatch?.steps?.[0]).toMatchObject({
      env: { GH_TOKEN: "${{ github.token }}" },
      run: "gh workflow run board.yml --repo phmilk/reforged-ts",
    });
  });

  it("calls board-dispatch.yml after an assignment in another Board repository, with contents: read alone and the App's key passed on by name", async () => {
    const { on, jobs } = await workflow("claim-check.yml");
    const boardDispatch = jobs["board-dispatch"];
    // board-dispatch.yml fails a repository off its list, red: the job names
    // the Board repositories, so that a fork of the library, whose claim
    // check runs too, skips it.
    const others = BOARD_REPOSITORIES.filter(
      (repository) => repository !== `${BOARD_OWNER}/reforged-ts`,
    );

    expect(others.length).toBeGreaterThan(0);
    expect(boardDispatch?.needs).toBe("check");
    expect(boardDispatch?.if).toBe(
      `\${{ !cancelled() && contains(fromJSON('${JSON.stringify(others)}'), github.repository) && needs.check.outputs.assigned != '' }}`,
    );
    // Named in full: master of the library, whatever repository calls.
    expect(boardDispatch?.uses).toBe(
      "phmilk/reforged-ts/.github/workflows/board-dispatch.yml@master",
    );
    expect(boardDispatch?.permissions).toEqual({ contents: "read" });
    expect(boardDispatch?.steps).toBeUndefined();
    // The Template's caller passes the key to this workflow, which passes
    // it on by name; not required, since the library's caller passes none.
    expect(on).toEqual({
      workflow_call: {
        secrets: {
          APP_PRIVATE_KEY: {
            description: expect.any(String) as unknown,
            required: false,
          },
        },
      },
    });
    expect(boardDispatch?.secrets).toEqual({
      APP_PRIVATE_KEY: "${{ secrets.APP_PRIVATE_KEY }}",
    });
  });
});

describe("claim.yml", () => {
  it("calls the reusable workflow as the job `claim`, on pull requests and assignments, granting what it needs", async () => {
    const { on, jobs } = await workflow("claim.yml");

    expect(on).toEqual({
      pull_request_target: {
        types: ["opened", "reopened", "synchronize", "edited"],
      },
      issues: { types: ["assigned", "unassigned", "closed"] },
    });
    expect(Object.keys(jobs)).toEqual(["claim"]);
    expect(jobs.claim?.uses).toBe("./.github/workflows/claim-check.yml");
    expect(jobs.claim?.permissions).toEqual({
      contents: "read",
      issues: "write",
      "pull-requests": "write",
      actions: "write",
    });
    // The library is no caller of board-dispatch.yml: no key to pass.
    expect(jobs.claim?.secrets).toBeUndefined();
  });
});
