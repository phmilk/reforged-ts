import { describe, expect, it } from "vitest";
import {
  BOARD_MUTATIONS,
  BoardError,
  issueKey,
  issueLookup,
  applyBoardLabels,
  applyIssueStatuses,
  ISSUE_STATUS_OF,
  planBoardLabels,
  planIssueStatuses,
  readIssueStatuses,
  readLabelState,
  readReconcileState,
  STATUS_OPTIONS,
  statusOf,
  type BoardIssue,
  type LabelState,
  type IssueStatusState,
  type Status,
} from "../src/board.js";
import {
  graphQlApi,
  issue,
  ISSUE_STATUS_IDS,
  LABEL_IDS,
  LIBRARY,
  mutations,
  OTHER,
  pullRequest,
  reading,
  STATE,
  sub,
  TEMPLATE,
  type Sent,
} from "./support/board.js";

const labelWrite = (
  operation: "AddLabels" | "RemoveLabels",
  labelableId: string,
  labelIds: string[],
) => ({
  query:
    operation === "AddLabels"
      ? BOARD_MUTATIONS.addLabels
      : BOARD_MUTATIONS.removeLabels,
  variables: { labelableId, labelIds },
});

describe("planBoardLabels", () => {
  it("swaps the pair on each Spec that differs, in the labels of its own repository, and sends nothing for the rest", () => {
    const unsplit = issue(10, { labels: ["spec", "ready-for-agent"] });
    const split = issue(20, {
      labels: ["spec", "needs-split"],
      subIssues: [sub(21)],
    });
    const templateUnsplit = issue(30, {
      repository: TEMPLATE,
      labels: ["spec", "ready-for-human"],
    });
    const right = issue(40, { labels: ["spec", "needs-split"] });
    const state: LabelState = {
      issues: [
        unsplit,
        issue(1, { labels: ["ready-for-agent"] }),
        split,
        templateUnsplit,
        right,
      ],
      labelIds: LABEL_IDS,
    };

    expect(planBoardLabels(state)).toEqual({
      requests: [
        {
          ...labelWrite("AddLabels", unsplit.id, ["LA_split"]),
          summary: `Add needs-split to ${LIBRARY}#10: a Spec with no sub-issue.`,
        },
        {
          ...labelWrite("RemoveLabels", unsplit.id, ["LA_ready"]),
          summary: `Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.`,
        },
        {
          ...labelWrite("AddLabels", split.id, ["LA_ready"]),
          summary: `Add ready-for-agent to ${LIBRARY}#20: a Spec with sub-issues.`,
        },
        {
          ...labelWrite("RemoveLabels", split.id, ["LA_split"]),
          summary: `Remove needs-split from ${LIBRARY}#20: a Spec with sub-issues.`,
        },
        {
          ...labelWrite("AddLabels", templateUnsplit.id, ["LA_t_split"]),
          summary: `Add needs-split to ${TEMPLATE}#30: a Spec with no sub-issue.`,
        },
      ],
      specs: 4,
      kept: 1,
    });
  });

  it("leaves an issue of another repository alone", () => {
    const state: LabelState = {
      issues: [issue(10, { repository: OTHER, labels: ["spec"] })],
      labelIds: LABEL_IDS,
    };

    expect(planBoardLabels(state)).toEqual({
      requests: [],
      specs: 0,
      kept: 0,
    });
  });

  it("stops when a label it must write is missing from the repository, naming it", () => {
    const state: LabelState = {
      issues: [issue(30, { repository: TEMPLATE, labels: ["spec"] })],
      labelIds: {
        ...LABEL_IDS,
        [TEMPLATE]: { "ready-for-agent": "LA_t_ready" },
      },
    };

    expect(() => planBoardLabels(state)).toThrow(
      new BoardError(
        `The label needs-split does not exist in ${TEMPLATE}: create it there (pnpm repo:settings creates the library's), then run board:labels again.`,
      ),
    );
  });
});

/** Both Board repositories with GitHub's seven Issue statuses. */
const BOTH_HAVE_STATUSES = {
  [LIBRARY]: ISSUE_STATUS_IDS,
  [TEMPLATE]: ISSUE_STATUS_IDS,
};

/**
 * The Issue statuses as read: each open issue of `seen` with none, but
 * those of `named`, by issue key, and the seven values in both
 * repositories unless told otherwise.
 */
const issueStatuses = (
  seen: readonly BoardIssue[],
  named: Readonly<Record<string, string>> = {},
  ids: IssueStatusState["ids"] = BOTH_HAVE_STATUSES,
): IssueStatusState => ({
  ids,
  current: {
    ...Object.fromEntries(
      seen
        .filter(({ state }) => state === "OPEN")
        .map((one) => [issueKey(one), null]),
    ),
    ...named,
  },
});

const issueStatusWrite = (issueId: string, name: string) => ({
  query: BOARD_MUTATIONS.setIssueStatus,
  variables: { issueId, statusId: ISSUE_STATUS_IDS[name] },
});

describe("planIssueStatuses", () => {
  it.each([
    ["Backlog", {}, "Backlog"],
    ["Blocked", { blockedBy: 1, labels: ["ready-for-agent"] }, "Todo"],
    ["Ready", { labels: ["ready-for-agent"] }, "Todo"],
    ["In progress", { assignees: ["alice"] }, "In progress"],
    ["In review", { pullRequests: [pullRequest("OPEN")] }, "In review"],
  ] satisfies [Status, Partial<BoardIssue>, string][])(
    "gives an open issue whose Status is %s the Issue status its Status maps to",
    (status, more, expected) => {
      const open = issue(1, more);
      expect(statusOf(open, issueLookup([open]))).toBe(status);

      expect(planIssueStatuses([open], issueStatuses([open]))).toEqual({
        requests: [
          {
            ...issueStatusWrite("I_1", expected),
            summary: `Set the Issue status of ${LIBRARY}#1 to ${expected}.`,
          },
        ],
        issues: 1,
        kept: 0,
        warnings: [],
      });
    },
  );

  it("maps every Status an open issue takes, and none to a value that closes an issue", () => {
    expect(Object.keys(ISSUE_STATUS_OF).sort()).toEqual(
      STATUS_OPTIONS.map(({ name }) => name)
        .filter((name) => name !== "Done")
        .sort(),
    );
    for (const value of Object.values(ISSUE_STATUS_OF)) {
      expect(["Done", "Not planned", "Duplicate"]).not.toContain(value);
    }
  });

  it("sends nothing for an issue whose Issue status already agrees, whatever its case, and says what the other one read", () => {
    const open = [
      issue(1, { labels: ["ready-for-agent"] }),
      issue(2, { assignees: ["alice"] }),
      issue(3, { assignees: ["alice"] }),
    ];
    const read = issueStatuses(open, {
      [`${LIBRARY}#1`]: "Todo",
      [`${LIBRARY}#2`]: "In Progress",
      [`${LIBRARY}#3`]: "Todo",
    });

    expect(planIssueStatuses(open, read)).toEqual({
      requests: [
        {
          ...issueStatusWrite("I_3", "In progress"),
          summary: `Set the Issue status of ${LIBRARY}#3 to In progress (was Todo).`,
        },
      ],
      issues: 3,
      kept: 2,
      warnings: [],
    });
  });

  it("writes nothing on a closed issue, a bot's or one of another repository", () => {
    const issues = [
      issue(1, { state: "CLOSED" }),
      issue(2, { bot: true }),
      issue(3, { repository: OTHER }),
    ];

    expect(
      planIssueStatuses(
        issues,
        issueStatuses(issues, { [`${LIBRARY}#1`]: "Todo" }),
      ),
    ).toEqual({
      requests: [],
      issues: 0,
      kept: 0,
      warnings: [],
    });
  });

  it("writes nothing on an issue the Issue statuses' read did not see open: closed in between, an open value would reopen it", () => {
    const stillOpen = issue(1, { labels: ["ready-for-agent"] });
    const closedSince = issue(2, { assignees: ["alice"] });

    expect(
      planIssueStatuses([stillOpen, closedSince], issueStatuses([stillOpen])),
    ).toEqual({
      requests: [
        {
          ...issueStatusWrite("I_1", "Todo"),
          summary: `Set the Issue status of ${LIBRARY}#1 to Todo.`,
        },
      ],
      issues: 1,
      kept: 0,
      warnings: [],
    });
  });

  it("writes on an open issue that has no item on the board yet, in the Template too, by the Status the reconcile derives", () => {
    // A Template ticket, blocked, of a library spec: the spec takes its value.
    const spec = issue(10, {
      labels: ["spec", "ready-for-agent"],
      subIssues: [sub(31, TEMPLATE)],
    });
    const ticket = issue(31, {
      repository: TEMPLATE,
      labels: ["ticket", "ready-for-agent"],
      blockedBy: 1,
    });

    expect(
      planIssueStatuses(
        [spec, ticket],
        issueStatuses([spec, ticket], { [`${TEMPLATE}#31`]: "Backlog" }),
      ).requests,
    ).toEqual([
      {
        ...issueStatusWrite("I_10", "Todo"),
        summary: `Set the Issue status of ${LIBRARY}#10 to Todo.`,
      },
      {
        ...issueStatusWrite("I_t31", "Todo"),
        summary: `Set the Issue status of ${TEMPLATE}#31 to Todo (was Backlog).`,
      },
    ]);
  });

  it("plans nothing in a repository without Issue statuses and says so once", () => {
    const open = [
      issue(1),
      issue(2, { assignees: ["alice"] }),
      issue(30, { repository: TEMPLATE }),
    ];
    const read = issueStatuses(
      open,
      {},
      { [LIBRARY]: {}, [TEMPLATE]: ISSUE_STATUS_IDS },
    );

    expect(planIssueStatuses(open, read)).toEqual({
      requests: [
        {
          ...issueStatusWrite("I_t30", "Backlog"),
          summary: `Set the Issue status of ${TEMPLATE}#30 to Backlog.`,
        },
      ],
      issues: 3,
      kept: 0,
      warnings: [`${LIBRARY} has no Issue statuses: none is written there.`],
    });
  });

  it("warns once of a value the repository lacks, and still writes the others", () => {
    const open = [
      issue(1, { labels: ["ready-for-agent"] }),
      issue(2, { labels: ["ready-for-human"] }),
      issue(3),
    ];
    const read = issueStatuses(
      open,
      {},
      { [LIBRARY]: { Backlog: "IS_backlog" } },
    );

    expect(planIssueStatuses(open, read)).toEqual({
      requests: [
        {
          ...issueStatusWrite("I_3", "Backlog"),
          summary: `Set the Issue status of ${LIBRARY}#3 to Backlog.`,
        },
      ],
      issues: 3,
      kept: 0,
      warnings: [
        `${LIBRARY} has no Issue status named Todo: it is written on no issue there.`,
      ],
    });
  });
});

describe("readLabelState", () => {
  it("reads the open issues of both repositories and the ids of the two labels in each; a missing label is absent", async () => {
    const issues = [
      issue(10, { labels: ["spec"] }),
      issue(30, { repository: TEMPLATE, labels: ["spec"] }),
      issue(11, { state: "CLOSED" }),
    ];
    const sent: Sent[] = [];

    const state = await readLabelState(
      graphQlApi(
        reading(STATE, {
          issues,
          labelIds: {
            ...LABEL_IDS,
            [TEMPLATE]: { "ready-for-agent": "LA_t_ready" },
          },
        }),
        sent,
      ),
    );

    expect(state).toEqual({
      issues: [issues[0], issues[1]],
      labelIds: {
        [LIBRARY]: LABEL_IDS[LIBRARY],
        [TEMPLATE]: { "ready-for-agent": "LA_t_ready" },
      },
    });
    expect(sent.map(({ operation }) => operation)).toEqual([
      "OpenIssues",
      "Labels",
      "OpenIssues",
      "Labels",
    ]);
  });

  it("asks nothing of the Issue status, a preview: neither this read nor the reconcile's names one of its fields", async () => {
    const sent: Sent[] = [];

    await readLabelState(graphQlApi(reading(STATE), sent));
    await readReconcileState(graphQlApi(reading(STATE), sent));

    // Both reads were made: the labels' and the reconcile's own queries.
    expect(sent.map(({ operation }) => operation)).toEqual(
      expect.arrayContaining(["Labels", "ProjectItems", "OpenIssues"]),
    );
    for (const { query } of sent) {
      expect(query).not.toMatch(/planningStatuses|\bstatus \{/);
    }
  });
});

describe("readIssueStatuses", () => {
  it("reads, in each repository, the ids of its Issue statuses by name and the Issue status of each open issue that has one; a repository without them has none", async () => {
    const sent: Sent[] = [];

    const read = await readIssueStatuses(
      graphQlApi(
        reading(STATE, {
          issues: [
            issue(10),
            issue(11),
            issue(12, { state: "CLOSED" }),
            issue(30, { repository: TEMPLATE }),
          ],
          issueStatusIds: { [LIBRARY]: ISSUE_STATUS_IDS },
          issueStatuses: {
            [`${LIBRARY}#10`]: "Todo",
            [`${LIBRARY}#12`]: "Done",
          },
        }),
        sent,
      ),
    );

    expect(read).toEqual({
      ids: { [LIBRARY]: ISSUE_STATUS_IDS, [TEMPLATE]: {} },
      current: {
        [`${LIBRARY}#10`]: "Todo",
        [`${LIBRARY}#11`]: null,
        [`${TEMPLATE}#30`]: null,
      },
    });
    expect(sent.map(({ operation }) => operation)).toEqual([
      "IssueStatuses",
      "OpenIssueStatuses",
      "IssueStatuses",
      "OpenIssueStatuses",
    ]);
  });

  it("rejects when GitHub refuses the query, as it would once the preview's fields change", async () => {
    await expect(
      readIssueStatuses(
        graphQlApi(reading(STATE, { failing: "IssueStatuses" })),
      ),
    ).rejects.toThrow("Resource not accessible");
  });
});

describe("applyIssueStatuses", () => {
  const open = [
    issue(1, { labels: ["ready-for-agent"] }),
    issue(2, { assignees: ["alice"] }),
    issue(3),
  ];
  const plan = planIssueStatuses(open, issueStatuses(open));

  it("sends the requests in order and warns of nothing", async () => {
    const sent: Sent[] = [];
    const done: string[] = [];

    const refused = await applyIssueStatuses(
      graphQlApi(reading(STATE), sent),
      plan,
      ({ summary }) => done.push(summary),
    );

    expect(refused).toEqual([]);
    expect(mutations(sent)).toEqual([
      ["SetIssueStatus", { issueId: "I_1", statusId: "IS_todo" }],
      ["SetIssueStatus", { issueId: "I_2", statusId: "IS_in_progress" }],
      ["SetIssueStatus", { issueId: "I_3", statusId: "IS_backlog" }],
    ]);
    expect(done).toEqual(plan.requests.map(({ summary }) => summary));
  });

  it("reports a refused write as a warning naming the issue and the value, and still sends the ones after it", async () => {
    const sent: Sent[] = [];
    const done: string[] = [];
    const base = reading(STATE);

    const refused = await applyIssueStatuses(
      graphQlApi(
        (operation, variables) =>
          variables.issueId === "I_2"
            ? { errors: [{ message: "Field 'setIssueStatus' doesn't exist" }] }
            : base(operation, variables),
        sent,
      ),
      plan,
      ({ summary }) => done.push(summary),
    );

    expect(refused).toHaveLength(1);
    expect(refused[0]).toContain("Field 'setIssueStatus' doesn't exist");
    expect(refused[0]).toContain(
      `Not done: Set the Issue status of ${LIBRARY}#2 to In progress.`,
    );
    expect(mutations(sent).map(([, variables]) => variables)).toEqual([
      { issueId: "I_1", statusId: "IS_todo" },
      { issueId: "I_2", statusId: "IS_in_progress" },
      { issueId: "I_3", statusId: "IS_backlog" },
    ]);
    expect(done).toEqual([
      `Set the Issue status of ${LIBRARY}#1 to Todo.`,
      `Set the Issue status of ${LIBRARY}#3 to Backlog.`,
    ]);
  });
});

describe("applyBoardLabels", () => {
  const plan = planBoardLabels({
    issues: [
      issue(10, { labels: ["spec", "ready-for-agent"] }),
      issue(20, { labels: ["spec"] }),
    ],
    labelIds: LABEL_IDS,
  });

  it("sends the requests in order", async () => {
    const sent: Sent[] = [];
    const done: string[] = [];

    await applyBoardLabels(
      graphQlApi(reading(STATE), sent),
      plan,
      ({ summary }) => done.push(summary),
    );

    expect(mutations(sent)).toEqual([
      ["AddLabels", { labelableId: "I_10", labelIds: ["LA_split"] }],
      ["RemoveLabels", { labelableId: "I_10", labelIds: ["LA_ready"] }],
      ["AddLabels", { labelableId: "I_20", labelIds: ["LA_split"] }],
    ]);
    expect(done).toEqual(plan.requests.map(({ summary }) => summary));
  });

  it("stops at the first refused request, naming it", async () => {
    const sent: Sent[] = [];

    await expect(
      applyBoardLabels(
        graphQlApi(reading(STATE, { failing: "RemoveLabels" }), sent),
        plan,
      ),
    ).rejects.toThrow(
      `Not done: Remove ready-for-agent from ${LIBRARY}#10: a Spec with no sub-issue.`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "AddLabels",
      "RemoveLabels",
    ]);
  });
});
