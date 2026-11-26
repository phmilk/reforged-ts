import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/board-labels.js";
import type { Gh } from "../src/cli/common.js";
import { readSpec } from "../src/spec-check.js";
import { verdictComment, VERDICT_MARKER } from "../src/spec-verdict.js";
import {
  graphQlApi,
  graphQlFetch,
  issue,
  ISSUE_STATUS_IDS,
  LABEL_IDS,
  LIBRARY,
  mutations,
  reading,
  STATE,
  TEMPLATE,
  type Answers,
  type Sent,
} from "./support/board.js";
import { tempDir, writeText } from "./support/workspace.js";

const gh: Gh = (args) => Promise.resolve(args[0] === "auth" ? "gh0\n" : "");

function run(
  args: string[],
  fetcher: typeof fetch,
  context: Partial<Context> = {},
) {
  let stdout = "";
  let stderr = "";
  const code = main(
    args,
    {
      stdout: (text) => {
        stdout += text;
      },
      stderr: (text) => {
        stderr += text;
      },
    },
    { env: { LABELS_TOKEN: "app" }, gh, fetcher, ...context },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

/** #10 unsplit and still ready-for-agent, #20 split and right, #30 of the Template unsplit with no label. */
const ISSUES = [
  issue(10, { labels: ["spec", "ready-for-agent"] }),
  issue(20, {
    labels: ["spec", "ready-for-agent"],
    subIssues: [{ repository: LIBRARY, number: 21, state: "OPEN" }],
  }),
  issue(30, { repository: TEMPLATE, labels: ["spec"] }),
  issue(1, { labels: ["ready-for-agent"] }),
];

const FOUND =
  "Token: LABELS_TOKEN.\n" +
  `3 open Specs of ${LIBRARY} and ${TEMPLATE}.\n` +
  "As they should be: 1 Spec.\n";

/** What the Issue status pass prints where no repository has Issue statuses: the fake's default. */
const NO_STATUSES =
  "Issue statuses: 4 open issues, 0 as their Status reads.\n" +
  `Warning: ${LIBRARY} has no Issue statuses: none is written there.\n` +
  `Warning: ${TEMPLATE} has no Issue statuses: none is written there.\n`;

describe("board:labels", () => {
  it("prints the plan and sends nothing on a dry run, with the token of LABELS_TOKEN", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(sent[0]?.authorization).toBe("Bearer app");
    expect(result.stdout).toBe(
      `${FOUND}Dry run, 3 requests, none sent:\n` +
        `\nAdd needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_split"\n  ]\n}\n' +
        `\nRemove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation RemoveLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_ready"\n  ]\n}\n' +
        `\nAdd needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_t30",\n  "labelIds": [\n    "LA_t_split"\n  ]\n}\n' +
        `${NO_STATUSES}Dry run, 0 requests, none sent:\n`,
    );
  });

  it("falls back to the gh login when LABELS_TOKEN is not set, and says so", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
      { env: {} },
    );

    expect(result.exitCode).toBe(0);
    expect(sent[0]?.authorization).toBe("Bearer gh0");
    expect(result.stdout).toContain(
      "Token: the gh login (LABELS_TOKEN is not set).\n",
    );
  });

  it("writes the differences, says what it did and writes the job summary", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const result = await run(
      [],
      graphQlFetch(reading(STATE, { issues: ISSUES }), sent),
      {
        env: {
          LABELS_TOKEN: "app",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([
      ["AddLabels", { labelableId: "I_10", labelIds: ["LA_split"] }],
      ["RemoveLabels", { labelableId: "I_10", labelIds: ["LA_ready"] }],
      ["AddLabels", { labelableId: "I_t30", labelIds: ["LA_t_split"] }],
    ]);
    expect(result.stdout).toBe(
      `${FOUND}3 requests:\n` +
        `\nAdd needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_split"\n  ]\n}\n' +
        `\nRemove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        "mutation RemoveLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_10",\n  "labelIds": [\n    "LA_ready"\n  ]\n}\n' +
        `\nAdd needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        "mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!)\n" +
        '{\n  "labelableId": "I_t30",\n  "labelIds": [\n    "LA_t_split"\n  ]\n}\n' +
        `Done: Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `Done: Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `Done: Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        `${NO_STATUSES}0 requests:\n`,
    );
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      "## Board labels\n\n1 Spec as it should be; 3 requests, 3 done.\n\n" +
        `- Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n` +
        "## Issue statuses\n\n4 open issues, 0 as their Status reads; 0 requests, 0 done; 2 warnings.\n\n" +
        `- Warning: ${LIBRARY} has no Issue statuses: none is written there.\n` +
        `- Warning: ${TEMPLATE} has no Issue statuses: none is written there.\n`,
    );
  });

  it("exits 1 naming a label missing from a repository, and sends nothing", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(
        reading(STATE, {
          issues: ISSUES,
          labelIds: { ...LABEL_IDS, [TEMPLATE]: {} },
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(mutations(sent)).toEqual([]);
    expect(result.stderr).toBe(
      `The label needs-split does not exist in ${TEMPLATE}: create it there (pnpm repo:settings creates the library's), then run board:labels again.\n`,
    );
  });

  it("exits 2 on an unknown argument, with the usage", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--max-deletes", "3"],
      graphQlFetch(reading(STATE), sent),
    );

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/^Usage: board:labels \[--dry-run\]\n/);
    expect(sent).toEqual([]);
  });
});

describe("board:labels, the Issue status of every open issue (#958)", () => {
  const BOTH = { [LIBRARY]: ISSUE_STATUS_IDS, [TEMPLATE]: ISSUE_STATUS_IDS };

  /** #1 Ready and reading Backlog, #2 claimed and reading Todo, #3 Backlog with none, #4 claimed and right; no Spec. */
  const OPEN = [
    issue(1, { labels: ["ready-for-agent"] }),
    issue(2, { assignees: ["alice"] }),
    issue(3, { repository: TEMPLATE }),
    issue(4, { assignees: ["alice"] }),
  ];
  const READ = {
    [`${LIBRARY}#1`]: "Backlog",
    [`${LIBRARY}#2`]: "Todo",
    [`${LIBRARY}#4`]: "In progress",
  };

  const answers = (): Answers =>
    reading(STATE, { issues: OPEN, issueStatusIds: BOTH, issueStatuses: READ });

  const write = (
    key: string,
    issueId: string,
    value: string,
    statusId: string,
  ) =>
    `\nSet the Issue status of ${key} to ${value}.\n` +
    "mutation SetIssueStatus($issueId: ID!, $statusId: ID!)\n" +
    `{\n  "issueId": "${issueId}",\n  "statusId": "${statusId}"\n}\n`;

  it("lists the Issue status writes on a dry run and sends none", async () => {
    const sent: Sent[] = [];
    const result = await run(["--dry-run"], graphQlFetch(answers(), sent));

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(result.stdout).toBe(
      "Token: LABELS_TOKEN.\n" +
        `0 open Specs of ${LIBRARY} and ${TEMPLATE}.\n` +
        "As they should be: 0 Specs.\n" +
        "Dry run, 0 requests, none sent:\n" +
        "Issue statuses: 4 open issues, 1 as their Status reads.\n" +
        "Dry run, 3 requests, none sent:\n" +
        write(`${LIBRARY}#1`, "I_1", "Todo (was Backlog)", "IS_todo") +
        write(
          `${LIBRARY}#2`,
          "I_2",
          "In progress (was Todo)",
          "IS_in_progress",
        ) +
        write(`${TEMPLATE}#3`, "I_t3", "Backlog", "IS_backlog"),
    );
  });

  it("writes the differences with the App's token and says so in the job summary", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const result = await run([], graphQlFetch(answers(), sent), {
      env: {
        LABELS_TOKEN: "app",
        GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
      },
    });

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([
      ["SetIssueStatus", { issueId: "I_1", statusId: "IS_todo" }],
      ["SetIssueStatus", { issueId: "I_2", statusId: "IS_in_progress" }],
      ["SetIssueStatus", { issueId: "I_t3", statusId: "IS_backlog" }],
    ]);
    expect(
      sent
        .filter(({ kind }) => kind === "mutation")
        .map((one) => one.authorization),
    ).toEqual(["Bearer app", "Bearer app", "Bearer app"]);
    expect(await readFile(join(dir, "summary.md"), "utf8")).toContain(
      "## Issue statuses\n\n4 open issues, 1 as their Status reads; 3 requests, 3 done; 0 warnings.\n\n" +
        `- Set the Issue status of ${LIBRARY}#1 to Todo (was Backlog).\n` +
        `- Set the Issue status of ${LIBRARY}#2 to In progress (was Todo).\n` +
        `- Set the Issue status of ${TEMPLATE}#3 to Backlog.\n`,
    );
  });

  it("sends nothing when every Issue status agrees", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(
        reading(STATE, {
          issues: [OPEN[3]],
          issueStatusIds: BOTH,
          issueStatuses: READ,
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(result.stdout).toContain(
      "Issue statuses: 1 open issue, 1 as their Status reads.\n0 requests:\n",
    );
  });

  it("exits 0 when GitHub refuses an Issue status write: the others are sent, and the warning is in the output and the job summary", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const base = answers();
    const result = await run(
      [],
      graphQlFetch(
        (operation, variables) =>
          variables.issueId === "I_1"
            ? {
                errors: [{ message: "Resource not accessible by integration" }],
              }
            : base(operation, variables),
        sent,
      ),
      {
        env: {
          LABELS_TOKEN: "app",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(mutations(sent).map(([, variables]) => variables)).toEqual([
      { issueId: "I_1", statusId: "IS_todo" },
      { issueId: "I_2", statusId: "IS_in_progress" },
      { issueId: "I_t3", statusId: "IS_backlog" },
    ]);
    const warning = result.stdout
      .split("\n")
      .find((line) => line.startsWith("Warning: "));
    expect(warning).toContain("Resource not accessible by integration");
    expect(warning).toContain(
      `Not done: Set the Issue status of ${LIBRARY}#1 to Todo (was Backlog).`,
    );
    expect(result.stdout).toContain(
      `Done: Set the Issue status of ${TEMPLATE}#3 to Backlog.\n`,
    );
    const summary = await readFile(join(dir, "summary.md"), "utf8");
    expect(summary).toContain(
      "4 open issues, 1 as their Status reads; 3 requests, 2 done; 1 warning.\n",
    );
    expect(summary).toContain(`- ${String(warning)}\n`);
  });

  it("still exits 1 when GitHub refuses a label write, the Issue statuses written all the same", async () => {
    const sent: Sent[] = [];
    const base = reading(STATE, {
      issues: [issue(10, { labels: ["spec", "ready-for-agent"] })],
      issueStatusIds: BOTH,
    });
    const result = await run(
      [],
      graphQlFetch(
        (operation, variables) =>
          operation === "AddLabels"
            ? {
                errors: [{ message: "Resource not accessible by integration" }],
              }
            : base(operation, variables),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      `Not done: Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.`,
    );
    expect(mutations(sent)).toEqual([
      ["AddLabels", { labelableId: "I_10", labelIds: ["LA_split"] }],
      ["SetIssueStatus", { issueId: "I_10", statusId: "IS_backlog" }],
    ]);
  });

  it("says once per repository that it has no Issue statuses, and exits 0", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(reading(STATE, { issues: OPEN }), sent),
    );

    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(result.stdout).toContain(
      "Issue statuses: 4 open issues, 0 as their Status reads.\n" +
        `Warning: ${LIBRARY} has no Issue statuses: none is written there.\n` +
        `Warning: ${TEMPLATE} has no Issue statuses: none is written there.\n` +
        "0 requests:\n",
    );
  });

  it("exits 0 when GitHub refuses the read of the Issue statuses: none is written, the warning is in the output and the job summary, and the labels are written all the same", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const base = reading(STATE, {
      issues: [issue(10, { labels: ["spec", "ready-for-agent"] })],
      issueStatusIds: BOTH,
    });
    const result = await run(
      [],
      graphQlFetch(
        (operation, variables) =>
          operation === "OpenIssueStatuses"
            ? {
                errors: [
                  { message: "Field 'status' doesn't exist on type 'Issue'" },
                ],
              }
            : base(operation, variables),
        sent,
      ),
      {
        env: {
          LABELS_TOKEN: "app",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "AddLabels",
      "RemoveLabels",
    ]);
    const warning = result.stdout
      .split("\n")
      .find((line) => line.startsWith("Warning: "));
    expect(warning).toContain(
      "The Issue statuses could not be read, so none is written: ",
    );
    expect(warning).toContain("Field 'status' doesn't exist on type 'Issue'");
    expect(await readFile(join(dir, "summary.md"), "utf8")).toContain(
      `## Issue statuses\n\nNot read; 1 warning.\n\n- ${String(warning)}\n`,
    );
  });
});

describe("board:labels, the coverage check of a Spec whose Tickets are all closed (#796)", () => {
  /** #40, split, its two Tickets closed; #50 of the Template the same; #60 with a Ticket open. */
  const DELIVERED = [
    issue(40, {
      labels: ["spec", "ready-for-agent"],
      subIssues: [
        { repository: LIBRARY, number: 41, state: "CLOSED" },
        { repository: TEMPLATE, number: 42, state: "CLOSED" },
      ],
    }),
    issue(50, {
      repository: TEMPLATE,
      labels: ["spec", "ready-for-agent"],
      subIssues: [{ repository: TEMPLATE, number: 51, state: "CLOSED" }],
    }),
    issue(60, {
      labels: ["spec", "ready-for-agent"],
      subIssues: [{ repository: LIBRARY, number: 61, state: "OPEN" }],
    }),
  ];

  /** The Spec's body: one item, covered by `ticket`. */
  const specBody = (ticket: string) =>
    "## Implementation Decisions\n\n- It reads the body.\n\n" +
    "## Coverage table\n\n| Item | Ticket | Criterion |\n| --- | --- | --- |\n" +
    `| It reads the body. | ${ticket} | It reads the body. |\n`;

  /** A closed sub-issue of a Spec, as SpecCoverage answers it. */
  const subIssue = (repository: string, number: number) => ({
    number,
    state: "CLOSED",
    stateReason: "COMPLETED",
    body: "## Acceptance criteria\n\n- [x] It reads the body.\n",
    repository: { nameWithOwner: repository },
    assignees: { nodes: [] },
  });

  const SPECS: Record<string, unknown> = {
    [`${LIBRARY}#40`]: {
      title: "Delivered",
      body: specBody("#41"),
      labels: { nodes: [{ name: "spec" }] },
      subIssues: {
        totalCount: 2,
        nodes: [subIssue(LIBRARY, 41), subIssue(TEMPLATE, 42)],
      },
    },
    [`${TEMPLATE}#50`]: {
      title: "Delivered in the Template",
      // #52 is no sub-issue of #50: a gap.
      body: specBody("#52"),
      labels: { nodes: [{ name: "spec" }] },
      subIssues: { totalCount: 1, nodes: [subIssue(TEMPLATE, 51)] },
    },
  };

  /**
   * The answers of `reading`, plus each Spec of `specs` and its comments,
   * `comments` by `owner/name#n`; a Spec missing from `specs` answers an error.
   */
  function answers(
    comments: Record<string, unknown[]> = {},
    specs: Record<string, unknown> = SPECS,
  ): Answers {
    const base = reading(STATE, { issues: [...ISSUES, ...DELIVERED] });
    return (operation, variables) => {
      const key = `${String(variables.owner)}/${String(variables.name)}#${String(variables.number)}`;
      if (operation === "SpecCoverage") {
        return key in specs
          ? { data: { repository: { issue: specs[key] } } }
          : { errors: [{ message: `Could not resolve ${key}.` }] };
      }
      if (operation === "SpecComments") {
        return {
          data: {
            repository: {
              issue: {
                comments: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: comments[key] ?? [],
                },
              },
            },
          },
        };
      }
      return base(operation, variables);
    };
  }

  const APP = { __typename: "Bot", login: "reforged-ts-bot" };

  /** The Spec `key` of `SPECS`, as readSpec reads it. */
  async function readSpecOf(key: string) {
    const [repository = "", number = ""] = key.split("#");
    return readSpec(graphQlApi(answers()), repository, Number(number));
  }

  it("comments each verdict after the labels, on the Spec in its own repository, with the App's token", async () => {
    const sent: Sent[] = [];
    const result = await run([], graphQlFetch(answers(), sent));

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(mutations(sent).slice(3)).toEqual([
      [
        "AddComment",
        {
          subjectId: "I_40",
          body: expect.stringContaining(
            "**Coverage check: green.** Every Ticket of this Spec is closed, and `pnpm spec:check 40` finds no gap: 1 item, 1 row, 2 Tickets.",
          ) as unknown,
        },
      ],
      [
        "AddComment",
        {
          subjectId: "I_t50",
          body: expect.stringContaining(
            `**Coverage check: red.** Every Ticket of this Spec is closed, but \`pnpm spec:check 50 ${TEMPLATE}\` finds 1 gap`,
          ) as unknown,
        },
      ],
    ]);
    expect(result.stdout).toContain(
      "Coverage check: 2 open Specs with every Ticket closed, 0 comments already right.\n",
    );
    expect(result.stdout).toContain(
      `Done: Comment the coverage check on ${LIBRARY}#40: green.\n` +
        `Done: Comment the coverage check on ${TEMPLATE}#50: red, 1 gap.\n`,
    );
  });

  it("closes no issue: its only writes are labels and comments", async () => {
    const sent: Sent[] = [];
    await run([], graphQlFetch(answers(), sent));

    expect(new Set(mutations(sent).map(([operation]) => operation))).toEqual(
      new Set(["AddLabels", "RemoveLabels", "AddComment"]),
    );
    for (const { query } of sent) {
      expect(query).not.toMatch(/closeIssue|updateIssue\(|stateReason:/);
    }
  });

  it("edits its own comment when the verdict changed, leaves it when it did not, and passes over a marked comment by another login", async () => {
    const unchanged = verdictComment(await readSpecOf(`${TEMPLATE}#50`));
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(
        answers({
          [`${LIBRARY}#40`]: [
            {
              id: "IC_planted",
              body: `${VERDICT_MARKER}\n\nplanted`,
              author: { __typename: "User", login: "mallory" },
            },
            { id: "IC_40", body: `${VERDICT_MARKER}\n\nold`, author: APP },
          ],
          [`${TEMPLATE}#50`]: [{ id: "IC_50", body: unchanged, author: APP }],
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(0);
    expect(mutations(sent).slice(3)).toEqual([
      [
        "UpdateIssueComment",
        { id: "IC_40", body: expect.stringContaining("green") as unknown },
      ],
    ]);
    expect(result.stdout).toContain(
      "Coverage check: 2 open Specs with every Ticket closed, 1 comment already right.\n",
    );
  });

  it("reports a Spec it cannot read and still comments the others, then exits 1", async () => {
    const sent: Sent[] = [];
    const dir = await tempDir("board-labels");
    await writeText(dir, "summary.md", "");
    const failure = `The coverage check of ${LIBRARY}#40 could not run: SpecCoverage answered: Could not resolve ${LIBRARY}#40.`;
    const result = await run(
      [],
      graphQlFetch(
        answers({}, { [`${TEMPLATE}#50`]: SPECS[`${TEMPLATE}#50`] }),
        sent,
      ),
      {
        env: {
          LABELS_TOKEN: "app",
          GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        },
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(`${failure}\n`);
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "AddLabels",
      "RemoveLabels",
      "AddLabels",
      "AddComment",
    ]);
    expect(await readFile(join(dir, "summary.md"), "utf8")).toContain(
      "## Coverage check\n\n" +
        "2 open Specs with every Ticket closed, 0 comments already right; 1 request, 1 done; 1 failure.\n\n" +
        `- Comment the coverage check on ${TEMPLATE}#50: red, 1 gap.\n` +
        `- ${failure}\n`,
    );
  });

  it("still comments the verdicts when GitHub refuses a label request, then exits 1", async () => {
    const sent: Sent[] = [];
    const base = answers();
    const result = await run(
      [],
      graphQlFetch(
        (operation, variables) =>
          operation === "RemoveLabels"
            ? {
                errors: [{ message: "Resource not accessible by integration" }],
              }
            : base(operation, variables),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Resource not accessible by integration");
    expect(
      mutations(sent)
        .map(([operation]) => operation)
        .filter((operation) => operation === "AddComment"),
    ).toEqual(["AddComment", "AddComment"]);
  });

  it("still comments the verdicts when the labels fail, then exits 1", async () => {
    const sent: Sent[] = [];
    const base = answers();
    const result = await run(
      [],
      graphQlFetch(
        (operation, variables) =>
          operation === "Labels" && variables.name === "reforged-ts-template"
            ? {
                data: { repository: { needsSplit: null, readyForAgent: null } },
              }
            : base(operation, variables),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      `The label needs-split does not exist in ${TEMPLATE}: create it there (pnpm repo:settings creates the library's), then run board:labels again.\n`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "AddComment",
      "AddComment",
    ]);
  });

  it("prints the comments on a dry run and sends none", async () => {
    const sent: Sent[] = [];
    const result = await run(["--dry-run"], graphQlFetch(answers(), sent));

    expect(result.exitCode).toBe(0);
    expect(mutations(sent)).toEqual([]);
    expect(result.stdout).toContain(
      `Dry run, 2 requests, none sent:\n\nComment the coverage check on ${LIBRARY}#40: green.\nmutation AddComment(`,
    );
  });
});
