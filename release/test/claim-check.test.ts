import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  MARKER,
  planIssue,
  planPullRequest,
  type ClosingIssue,
  type ClosingPullRequest,
  type IssueInput,
  type PullRequestInput,
} from "../src/claim-check.js";
import { repositoryRoot } from "../src/workspace.js";

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

/** A sticky comment's body: the marker, then one text per issue. */
const body = (...texts: string[]) => [MARKER, ...texts].join("\n\n");

/** An issue of this repository, assignable to the author. */
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
  };
}

describe("planPullRequest", () => {
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

  it("rewrites a failure to text 7 once the pull request passes", () => {
    const plan = planPullRequest(
      pullRequest([issue(12, ["alice"])], { id: 7, body: body(TEXT_2) }),
    );

    expect(plan.comments).toEqual([{ number: 34, id: 7, body: body(TEXT_7) }]);
    expect(plan.exitCode).toBe(0);
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
    pullRequests: [],
    comment: null,
    ...more,
  };
}

describe("planIssue", () => {
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

  it("edits the marked comment in place on a new conflict", () => {
    const plan = planIssue(
      assigned("bob", "bob", ["alice", "bob"], {
        comment: { id: 7, body: body(TEXT_6) },
      }),
    );

    expect(plan.comments).toEqual([{ number: 12, id: 7, body: body(TEXT_4) }]);
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

interface Step {
  uses?: string;
  with?: Partial<Record<string, unknown>>;
  run?: string;
}

interface Workflow {
  on: Partial<Record<string, unknown>>;
  jobs: Partial<Record<string, { uses?: string; steps?: Step[] }>>;
}

/** The parsed workflow `file` of this repository. */
async function workflow(file: string): Promise<Workflow> {
  const text = await readFile(
    join(repositoryRoot, ".github", "workflows", file),
    "utf8",
  );
  return parse(text) as Workflow;
}

describe("claim-check.yml", () => {
  it("runs trusted code only: master of the library, no event value inline", async () => {
    const { on, jobs } = await workflow("claim-check.yml");
    const steps = Object.values(jobs).flatMap((job) => job?.steps ?? []);

    expect(Object.keys(on)).toEqual(["workflow_call"]);
    expect(Object.keys(jobs)).toEqual(["check"]);
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
    }
    expect(
      steps.map((step) => step.run).filter((run) => run !== undefined),
    ).toEqual([
      "node release/src/claim-check.ts pull-request",
      "node release/src/claim-check.ts issue",
    ]);
  });
});

describe("claim.yml", () => {
  it("calls the reusable workflow as the job `claim`, on pull requests and assignments", async () => {
    const { on, jobs } = await workflow("claim.yml");

    expect(on).toEqual({
      pull_request_target: {
        types: ["opened", "reopened", "synchronize", "edited"],
      },
      issues: { types: ["assigned", "unassigned"] },
    });
    expect(Object.keys(jobs)).toEqual(["claim"]);
    expect(jobs.claim?.uses).toBe("./.github/workflows/claim-check.yml");
  });
});
