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
        '{\n  "labelableId": "I_t30",\n  "labelIds": [\n    "LA_t_split"\n  ]\n}\n',
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
        `Done: Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n`,
    );
    expect(await readFile(join(dir, "summary.md"), "utf8")).toBe(
      "## Board labels\n\n1 Spec as it should be; 3 requests, 3 done.\n\n" +
        `- Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.\n` +
        `- Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.\n`,
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
