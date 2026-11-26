import { describe, expect, it } from "vitest";
import {
  applyBoardReconcile,
  BOARD_APP_LOGIN,
  BOARD_MUTATIONS,
  BOARD_OWNER,
  BOARD_TITLE,
  BoardError,
  MAX_DELETES,
  planBoardReconcile,
  readReconcileState,
  STATUS_OPTIONS,
  type ProjectItem,
  type ProjectState,
  type ReconcileState,
} from "../src/board.js";
import {
  CONFIGURED,
  daysAgo,
  graphQlApi,
  issue,
  item,
  LIBRARY,
  mutations,
  NOW,
  OTHER,
  pullRequest,
  reading,
  SPEC,
  STATE,
  sub,
  TEMPLATE,
  type Sent,
} from "./support/board.js";

const ready = issue(1, { labels: ["ready-for-agent"] });
const claimed = issue(2, { assignees: ["alice"] });
const closedLately = issue(3, { state: "CLOSED", updatedAt: daysAgo(3) });
const closedLongAgo = issue(4, { state: "CLOSED", updatedAt: daysAgo(20) });
const templateReady = issue(5, {
  repository: TEMPLATE,
  labels: ["ready-for-human"],
});

/** A board that agrees with GitHub: nothing to write. */
const AGREES: ReconcileState = {
  viewer: BOARD_OWNER,
  project: CONFIGURED,
  items: [
    item(ready, "Ready"),
    item(claimed, "In progress"),
    item(closedLately, "Done"),
    item(closedLongAgo, "Done", { archived: true }),
    item(templateReady, "Ready"),
  ],
  issues: [ready, claimed, templateReady],
};

const PROJECT_ID = CONFIGURED.id;
const STATUS_ID = "PVTSSF_status";

/** The option id of the Status value `name` on the configured project. */
const option = (name: string) =>
  `opt${String(STATUS_OPTIONS.findIndex((candidate) => candidate.name === name))}`;

const statusWrite = (itemId: string, name: string) => ({
  query: BOARD_MUTATIONS.updateItemStatus,
  variables: {
    projectId: PROJECT_ID,
    itemId,
    fieldId: STATUS_ID,
    optionId: option(name),
  },
});

const itemWrite = (query: string, itemId: string) => ({
  query,
  variables: { projectId: PROJECT_ID, itemId },
});

describe("planBoardReconcile", () => {
  it("sends nothing when the board already agrees", () => {
    expect(planBoardReconcile(AGREES, NOW)).toEqual({ requests: [], kept: 5 });
  });

  it("writes only the differences: the Status of the one item that drifted", () => {
    const plan = planBoardReconcile(
      {
        ...AGREES,
        items: AGREES.items.map((candidate) =>
          candidate.id === "PVTI_I_1"
            ? { ...candidate, status: "Backlog" }
            : candidate,
        ),
      },
      NOW,
    );

    expect(plan).toEqual({
      requests: [
        {
          ...statusWrite("PVTI_I_1", "Ready"),
          summary: `Set the Status of ${LIBRARY}#1 to Ready (was Backlog).`,
        },
      ],
      kept: 4,
    });
  });

  it("sets a Status that was never set, a hand-moved card included", () => {
    const plan = planBoardReconcile(
      { ...AGREES, items: [item(claimed, null)], issues: [claimed] },
      NOW,
    );

    expect(plan.requests.map(({ summary }) => summary)).toEqual([
      `Set the Status of ${LIBRARY}#2 to In progress.`,
    ]);
    expect(plan.requests[0]?.variables.optionId).toBe(option("In progress"));
  });

  it("adds a missing open issue with its Status on the item the add makes; never a closed one or a bot's", () => {
    const bot = issue(215, { bot: true, labels: ["needs-triage"] });
    const plan = planBoardReconcile(
      {
        ...AGREES,
        items: [item(claimed, "In progress")],
        issues: [ready, claimed, closedLately, bot, templateReady],
      },
      NOW,
    );

    expect(plan).toEqual({
      requests: [
        {
          query: BOARD_MUTATIONS.addItem,
          variables: { projectId: PROJECT_ID, contentId: "I_1" },
          summary: `Add ${LIBRARY}#1 to the board, then set its Status to Ready.`,
          followUp: {
            ...statusWrite(`<the id of the item of ${LIBRARY}#1>`, "Ready"),
            summary: `Set the Status of ${LIBRARY}#1, once added, to Ready.`,
          },
        },
        {
          query: BOARD_MUTATIONS.addItem,
          variables: { projectId: PROJECT_ID, contentId: "I_t5" },
          summary: `Add ${TEMPLATE}#5 to the board, then set its Status to Ready.`,
          followUp: {
            ...statusWrite(`<the id of the item of ${TEMPLATE}#5>`, "Ready"),
            summary: `Set the Status of ${TEMPLATE}#5, once added, to Ready.`,
          },
        },
      ],
      kept: 1,
    });
  });

  it("removes a pull request, a bot's issue, an issue of another repository, a draft and a redacted item", () => {
    const bot = issue(215, { bot: true });
    const foreign = issue(3, { repository: OTHER });
    const items: ProjectItem[] = [
      {
        id: "PVTI_pr",
        archived: false,
        content: { type: "PULL_REQUEST", repository: LIBRARY, number: 40 },
        status: "In review",
      },
      item(bot, "Backlog"),
      item(foreign, "Ready"),
      {
        id: "PVTI_draft",
        archived: false,
        content: { type: "DRAFT_ISSUE" },
        status: null,
      },
      {
        id: "PVTI_redacted",
        archived: true,
        content: { type: "REDACTED" },
        status: null,
      },
    ];
    const plan = planBoardReconcile(
      { ...AGREES, items, issues: [bot, foreign] },
      NOW,
    );

    expect(plan).toEqual({
      requests: [
        {
          ...itemWrite(BOARD_MUTATIONS.deleteItem, "PVTI_pr"),
          summary: `Remove the pull request ${LIBRARY}#40 from the board: a pull request.`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.deleteItem, "PVTI_I_215"),
          summary: `Remove ${LIBRARY}#215 from the board: an issue of a bot.`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.deleteItem, "PVTI_I_t3"),
          summary: `Remove ${OTHER}#3 from the board: an issue of another repository.`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.deleteItem, "PVTI_draft"),
          summary: "Remove a draft item from the board: a draft item.",
        },
        {
          ...itemWrite(BOARD_MUTATIONS.deleteItem, "PVTI_redacted"),
          summary:
            "Remove a redacted item from the board: an item the token cannot see.",
        },
      ],
      kept: 0,
    });
  });

  it("keeps a closed issue Done, then archives its item once the issue is 14 days untouched", () => {
    const lately = item(
      issue(3, { state: "CLOSED", updatedAt: daysAgo(13.9) }),
      "In progress",
    );
    const onTheDay = item(
      issue(8, { state: "CLOSED", updatedAt: daysAgo(14) }),
      "Done",
    );
    const longAgo = item(closedLongAgo, "Ready");
    const plan = planBoardReconcile(
      { ...AGREES, items: [lately, onTheDay, longAgo], issues: [] },
      NOW,
    );

    expect(plan).toEqual({
      requests: [
        {
          ...statusWrite("PVTI_I_3", "Done"),
          summary: `Set the Status of ${LIBRARY}#3 to Done (was In progress).`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.archiveItem, "PVTI_I_8"),
          summary: `Archive ${LIBRARY}#8: closed, and not updated since ${daysAgo(14).slice(0, 10)}.`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.archiveItem, "PVTI_I_4"),
          summary: `Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.`,
        },
      ],
      kept: 0,
    });
  });

  it("leaves an archived item of a closed issue alone", () => {
    const plan = planBoardReconcile(
      {
        ...AGREES,
        items: [item(closedLongAgo, "Ready", { archived: true })],
        issues: [],
      },
      NOW,
    );

    expect(plan).toEqual({ requests: [], kept: 1 });
  });

  it("unarchives an archived item whose issue is open again, then writes its Status; never adds it", () => {
    const reopened = issue(4, { labels: ["ready-for-agent"] });
    const plan = planBoardReconcile(
      {
        ...AGREES,
        items: [
          item(reopened, "Done", { archived: true }),
          item(claimed, "In progress", { archived: true }),
        ],
        issues: [reopened, claimed],
      },
      NOW,
    );

    expect(plan).toEqual({
      requests: [
        {
          ...itemWrite(BOARD_MUTATIONS.unarchiveItem, "PVTI_I_4"),
          summary: `Unarchive ${LIBRARY}#4: its issue is open.`,
        },
        {
          ...statusWrite("PVTI_I_4", "Ready"),
          summary: `Set the Status of ${LIBRARY}#4 to Ready (was Done).`,
        },
        {
          ...itemWrite(BOARD_MUTATIONS.unarchiveItem, "PVTI_I_2"),
          summary: `Unarchive ${LIBRARY}#2: its issue is open.`,
        },
      ],
      kept: 0,
    });
  });

  it("classifies each item from the issues of both repositories: a Template ticket of a library spec", () => {
    const spec = issue(529, {
      labels: ["spec"],
      subIssues: [sub(71, TEMPLATE)],
    });
    const ticket = issue(71, { repository: TEMPLATE, assignees: ["alice"] });
    const plan = planBoardReconcile(
      {
        ...AGREES,
        items: [item(spec, "Backlog"), item(ticket, "In progress")],
        issues: [spec, ticket],
      },
      NOW,
    );

    expect(plan.requests.map(({ summary }) => summary)).toEqual([
      `Set the Status of ${LIBRARY}#529 to In progress (was Backlog).`,
    ]);
  });

  it("refuses a plan that removes more than 10 items, listing them and naming --max-deletes, unless the limit is raised", () => {
    const foreign = Array.from({ length: 11 }, (_, i) =>
      issue(300 + i, { repository: OTHER }),
    );
    const state: ReconcileState = {
      ...AGREES,
      items: [item(ready, "Ready"), ...foreign.map((f) => item(f, "Backlog"))],
      issues: [ready],
    };

    expect(MAX_DELETES).toBe(10);
    expect(() => planBoardReconcile(state, NOW)).toThrow(
      new BoardError(
        "Refused: the plan removes 11 items from the board, more than the 10 one run may remove, and nothing was sent. The removals: " +
          foreign
            .map(
              ({ number }) =>
                `Remove ${OTHER}#${String(number)} from the board: an issue of another repository.`,
            )
            .join(" ") +
          " When they are right, run board:reconcile --max-deletes 11.",
      ),
    );
    expect(
      planBoardReconcile(
        { ...state, items: state.items.slice(0, 11) },
        NOW,
      ).requests.filter(({ query }) => query === BOARD_MUTATIONS.deleteItem),
    ).toHaveLength(10);
    expect(
      planBoardReconcile(state, NOW, { maxDeletes: 11 }).requests.filter(
        ({ query }) => query === BOARD_MUTATIONS.deleteItem,
      ),
    ).toHaveLength(11);
  });

  it("stops on a project without the Status field or one of its options, naming board:setup", () => {
    const without = (name: string): ProjectState => ({
      ...CONFIGURED,
      fields: CONFIGURED.fields.flatMap((field) =>
        field.name !== "Status"
          ? [field]
          : name === "Status"
            ? []
            : [
                {
                  ...field,
                  options: (field.options ?? []).filter(
                    (candidate) => candidate.name !== name,
                  ),
                },
              ],
      ),
    });

    // A write to Ready is planned: its option is looked up then.
    const drifted = { ...AGREES, items: [item(ready, null)], issues: [ready] };

    expect(() =>
      planBoardReconcile({ ...AGREES, project: without("Status") }, NOW),
    ).toThrow(
      new BoardError(
        "The project has no single select named Status: run board:setup first.",
      ),
    );
    expect(() =>
      planBoardReconcile({ ...drifted, project: without("Ready") }, NOW),
    ).toThrow(
      new BoardError(
        "The Status field has no option named Ready: run board:setup first.",
      ),
    );
  });
});

describe("readReconcileState", () => {
  it("reads the project, every item, archived ones included, and the open issues of both repositories", async () => {
    const sent: Sent[] = [];
    const full = issue(6, {
      labels: ["ticket", "ready-for-agent"],
      assignees: ["alice", "bob"],
      parent: SPEC,
      pullRequests: [pullRequest("OPEN", true), pullRequest("MERGED")],
      blockedBy: 1,
      subIssues: [sub(7), sub(71, TEMPLATE)],
    });
    const bot = issue(215, { bot: true });
    const items = [
      item(full, "In progress"),
      item(closedLongAgo, "Done", { archived: true }),
      {
        id: "PVTI_pr",
        archived: false,
        content: {
          type: "PULL_REQUEST" as const,
          repository: LIBRARY,
          number: 40,
        },
        status: null,
      },
      {
        id: "PVTI_draft",
        archived: false,
        content: { type: "DRAFT_ISSUE" as const },
        status: "Ready",
      },
      {
        id: "PVTI_redacted",
        archived: false,
        content: { type: "REDACTED" as const },
        status: null,
      },
    ];
    const issues = [full, bot, closedLongAgo, templateReady];

    const state = await readReconcileState(
      graphQlApi(reading(STATE, { items, issues }), sent),
    );

    expect(state).toEqual({
      viewer: BOARD_OWNER,
      project: CONFIGURED,
      items,
      // The closed one is not open; the Template's come after the library's.
      issues: [full, bot, templateReady],
    });
    const read = sent.find(({ operation }) => operation === "ProjectItems");
    expect(read?.query).toContain("archivedStates: [ARCHIVED, NOT_ARCHIVED]");
    expect(read?.variables).toEqual({
      projectId: PROJECT_ID,
      status: "Status",
      first: 100,
      cursor: null,
    });
    expect(
      sent
        .filter(({ operation }) => operation === "OpenIssues")
        .map(
          ({ variables }) =>
            `${String(variables.owner)}/${String(variables.name)}`,
        ),
    ).toEqual([LIBRARY, TEMPLATE]);
  });

  it("reads an issue of the repositories' App as a member's, any other Bot's as a bot's", async () => {
    // A New Patch report, opened by patch-watch.yml with the App's token (#655).
    const report = issue(642, { labels: ["needs-triage", "game-patch"] });
    const dashboard = issue(215, { bot: true });
    const orphan = issue(7);

    const state = await readReconcileState(
      graphQlApi(
        reading(STATE, {
          issues: [report, dashboard, orphan],
          authors: {
            [`${LIBRARY}#642`]: { __typename: "Bot", login: BOARD_APP_LOGIN },
            // A deleted account.
            [`${LIBRARY}#7`]: null,
          },
        }),
      ),
    );

    expect(state.issues).toEqual([report, dashboard, orphan]);
  });

  it("stops when no project has the title, naming board:setup", async () => {
    await expect(
      readReconcileState(graphQlApi(reading({ ...STATE, project: null }))),
    ).rejects.toThrow(
      new BoardError(
        `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: run board:setup first.`,
      ),
    );
  });
});

describe("applyBoardReconcile", () => {
  const drifted: ReconcileState = {
    ...AGREES,
    items: [item(claimed, "Ready"), item(closedLongAgo, "Done")],
    issues: [ready, claimed],
  };

  it("sends the requests in order, an add followed by the Status write of the item GitHub answered", async () => {
    const sent: Sent[] = [];
    const done: string[] = [];

    await applyBoardReconcile(
      graphQlApi(reading(STATE), sent),
      planBoardReconcile(drifted, NOW),
      ({ summary }) => {
        done.push(summary);
      },
    );

    expect(mutations(sent)).toEqual([
      ["UpdateItemStatus", statusWrite("PVTI_I_2", "In progress").variables],
      ["ArchiveItem", { projectId: PROJECT_ID, itemId: "PVTI_I_4" }],
      ["AddItem", { projectId: PROJECT_ID, contentId: "I_1" }],
      ["UpdateItemStatus", statusWrite("PVTI_I_1", "Ready").variables],
    ]);
    expect(done).toEqual([
      `Set the Status of ${LIBRARY}#2 to In progress (was Ready).`,
      `Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.`,
      `Add ${LIBRARY}#1 to the board, then set its Status to Ready.`,
      `Set the Status of ${LIBRARY}#1, once added, to Ready.`,
    ]);
  });

  it("stops at the first refused request, naming it", async () => {
    const sent: Sent[] = [];

    await expect(
      applyBoardReconcile(
        graphQlApi(reading(STATE, { failing: "ArchiveItem" }), sent),
        planBoardReconcile(drifted, NOW),
      ),
    ).rejects.toThrow(
      "ArchiveItem answered: FORBIDDEN: Resource not accessible by personal access token. " +
        `Not done: Archive ${LIBRARY}#4: closed, and not updated since ${daysAgo(20).slice(0, 10)}.`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "UpdateItemStatus",
      "ArchiveItem",
    ]);
  });

  it("stops when an add answers no item id", async () => {
    const base = reading(STATE);
    const api = graphQlApi((operation, variables) =>
      operation === "AddItem"
        ? { data: { addProjectV2ItemById: { item: null } } }
        : base(operation, variables),
    );

    await expect(
      applyBoardReconcile(
        api,
        planBoardReconcile({ ...AGREES, items: [], issues: [ready] }, NOW),
      ),
    ).rejects.toThrow(
      new BoardError(
        `AddItem answered no item id. Not done: Set the Status of ${LIBRARY}#1, once added, to Ready.`,
      ),
    );
  });
});
