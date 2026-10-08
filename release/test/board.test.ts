import { describe, expect, it } from "vitest";
import {
  applyBoardReconcile,
  applyBoardSetup,
  assumedState,
  BOARD_MUTATIONS,
  BOARD_OWNER,
  BOARD_README,
  BOARD_REPOSITORIES,
  BOARD_TITLE,
  BOARD_VIEWS,
  BoardError,
  CLAIM_DOC_URL,
  issueLookup,
  MAX_DELETES,
  planBoardReconcile,
  planBoardSetup,
  readBoardState,
  readReconcileState,
  STATUS_OPTIONS,
  statusOf,
  type BoardIssue,
  type BoardPullRequest,
  type BoardSetupPlan,
  type ProjectItem,
  type ProjectState,
  type ReconcileState,
  type SubIssue,
} from "../src/board.js";
import { GraphQlError } from "../src/github-graphql.js";
import {
  CONFIGURED,
  daysAgo,
  fieldId,
  FRESH,
  graphQlApi,
  issue,
  item,
  LIBRARY,
  mutations,
  NOW,
  OTHER,
  reading,
  STATE,
  TEMPLATE,
  type Sent,
} from "./support/board.js";
import { readWorkflow } from "./support/workflows.js";

const summaries = (plan: BoardSetupPlan) =>
  plan.requests.map(({ summary }) => summary);

const OPTION_NAMES = "Backlog, Ready, Blocked, In progress, In review, Done";

const TABLE =
  "Title, Assignees, Status, Repository, Labels, Parent issue, Sub-issues progress, Linked pull requests";

/** Every request of a project built from nothing. */
const CREATES_EVERYTHING = [
  `Create the project "${BOARD_TITLE}" under ${BOARD_OWNER}.`,
  "Make the project public and set its README.",
  `Rewrite the Status options to ${OPTION_NAMES}.`,
  'Create the view "Board" (a board; Title, Assignees, Labels, Parent issue).',
  `Create the view "By assignee" (a table; ${TABLE}).`,
  `Create the view "By parent" (a table; ${TABLE}).`,
  `Link the project to ${BOARD_OWNER}/reforged-ts.`,
  `Link the project to ${BOARD_OWNER}/reforged-ts-template.`,
];

/** The configured project with its Status options replaced. */
function withOptions(
  options: readonly {
    id: string;
    name: string;
    color: string;
    description: string;
  }[],
): ProjectState {
  return {
    ...CONFIGURED,
    fields: CONFIGURED.fields.map((field) =>
      field.name === "Status" ? { ...field, options } : field,
    ),
  };
}

describe("the definition", () => {
  it("has the six Status values in the board's order, each coloured and described", () => {
    expect(STATUS_OPTIONS.map(({ name }) => name)).toEqual([
      "Backlog",
      "Ready",
      "Blocked",
      "In progress",
      "In review",
      "Done",
    ]);
    for (const { color, description } of STATUS_OPTIONS) {
      expect(color).toMatch(/^[A-Z]+$/);
      expect(description).toMatch(/^\S.*\.$/);
    }
  });

  it("has the three views of the spec, Title first on each", () => {
    expect(
      BOARD_VIEWS.map(({ name, layout, fields }) => [name, layout, fields[0]]),
    ).toEqual([
      ["Board", "BOARD_LAYOUT", "Title"],
      ["By assignee", "TABLE_LAYOUT", "Title"],
      ["By parent", "TABLE_LAYOUT", "Title"],
    ]);
    expect(BOARD_VIEWS[1]?.fields).toEqual(BOARD_VIEWS[2]?.fields);
  });

  it("tells the README's reader that nothing is moved by hand, and where the rules are", () => {
    expect(BOARD_README).toContain("nothing here is moved by hand");
    expect(BOARD_README).toContain(`](${CLAIM_DOC_URL})`);
    for (const { name } of STATUS_OPTIONS) {
      expect(BOARD_README).toContain(`**${name}**`);
    }
  });

  it("spans both repositories of the owner", () => {
    expect(BOARD_REPOSITORIES).toEqual([
      `${BOARD_OWNER}/reforged-ts`,
      `${BOARD_OWNER}/reforged-ts-template`,
    ]);
  });
});

describe("planBoardSetup", () => {
  it("creates everything on a missing project", () => {
    const plan = planBoardSetup({ ...STATE, project: null });

    expect(summaries(plan)).toEqual(CREATES_EVERYTHING);
    expect(plan.unchanged).toEqual([]);
    expect(plan.requests[0]).toEqual({
      query: BOARD_MUTATIONS.createProject,
      variables: { ownerId: "U_owner", title: BOARD_TITLE },
      summary: CREATES_EVERYTHING[0],
    });
    expect(plan.requests[1]?.variables).toEqual({
      projectId: "<the id of the created project>",
      readme: BOARD_README,
      public: true,
    });
    // No option exists yet: none carries an id.
    expect(plan.requests[2]?.variables).toEqual({
      fieldId: "<the id of its Status field>",
      options: STATUS_OPTIONS.map((option) => ({ ...option })),
    });
    expect(plan.requests[3]?.variables).toEqual({
      projectId: "<the id of the created project>",
      name: "Board",
      layout: "BOARD_LAYOUT",
      fields: [
        "<the id of its Title field>",
        "<the id of its Assignees field>",
        "<the id of its Labels field>",
        "<the id of its Parent issue field>",
      ],
    });
    expect(plan.requests[6]?.variables).toEqual({
      projectId: "<the id of the created project>",
      repositoryId: "R_1",
    });
    expect(plan.requests[7]?.variables).toEqual({
      projectId: "<the id of the created project>",
      repositoryId: "R_2",
    });
  });

  it("assumes a missing project when GitHub could not be read", () => {
    const plan = planBoardSetup(assumedState());

    expect(summaries(plan)).toEqual(CREATES_EVERYTHING);
    expect(plan.requests[0]?.variables).toEqual({
      ownerId: `<the id of ${BOARD_OWNER}>`,
      title: BOARD_TITLE,
    });
    expect(plan.requests[6]?.variables.repositoryId).toBe(
      `<the id of ${BOARD_OWNER}/reforged-ts>`,
    );
  });

  it("sends nothing on a project that matches", () => {
    const plan = planBoardSetup(STATE);

    expect(plan.requests).toEqual([]);
    expect(plan.unchanged).toEqual([
      "Visibility: public.",
      "README: as committed.",
      `Status options: ${OPTION_NAMES}.`,
      "Views: Board, By assignee, By parent.",
      `Repositories: ${BOARD_OWNER}/reforged-ts, ${BOARD_OWNER}/reforged-ts-template.`,
    ]);
  });

  it("rewrites the Status options when one is renamed, keeping the ids of the others", () => {
    const options = CONFIGURED.fields[2]?.options ?? [];
    const plan = planBoardSetup({
      ...STATE,
      project: withOptions(
        options.map((option) =>
          option.name === "In progress" ? { ...option, name: "Doing" } : option,
        ),
      ),
    });

    expect(plan.requests).toEqual([
      {
        query: BOARD_MUTATIONS.updateStatusOptions,
        variables: {
          fieldId: "PVTSSF_status",
          options: STATUS_OPTIONS.map((option, i) =>
            option.name === "In progress"
              ? { ...option }
              : { id: `opt${String(i)}`, ...option },
          ),
        },
        summary: `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of Backlog, Ready, Blocked, In review, Done.`,
      },
    ]);
    expect(plan.unchanged).not.toContain(`Status options: ${OPTION_NAMES}.`);
  });

  it("keeps the id of an option that differs only in case", () => {
    const options = CONFIGURED.fields[2]?.options ?? [];
    const plan = planBoardSetup({
      ...STATE,
      project: withOptions(
        options.map((option) =>
          option.name === "In progress"
            ? { ...option, name: "In Progress" }
            : option,
        ),
      ),
    });

    expect(plan.requests).toHaveLength(1);
    expect(plan.requests[0]?.summary).toBe(
      `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of ${OPTION_NAMES}.`,
    );
    const sent = plan.requests[0]?.variables.options as { id?: string }[];
    expect(sent[3]?.id).toBe("opt3");
  });

  it.each([
    ["a colour", { color: "PINK" }],
    ["a description", { description: "Something else." }],
  ])("rewrites the Status options when %s differs", (_what, change) => {
    const options = CONFIGURED.fields[2]?.options ?? [];
    const plan = planBoardSetup({
      ...STATE,
      project: withOptions(
        options.map((option, i) =>
          i === 1 ? { ...option, ...change } : option,
        ),
      ),
    });

    expect(summaries(plan)).toEqual([
      `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of ${OPTION_NAMES}.`,
    ]);
  });

  it("rewrites the Status options when one is missing or their order differs", () => {
    const options = CONFIGURED.fields[2]?.options ?? [];

    const missing = planBoardSetup({
      ...STATE,
      project: withOptions(options.filter(({ name }) => name !== "Blocked")),
    });
    expect(summaries(missing)).toEqual([
      `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of Backlog, Ready, In progress, In review, Done.`,
    ]);

    const reordered = planBoardSetup({
      ...STATE,
      project: withOptions([...options].reverse()),
    });
    expect(summaries(reordered)).toEqual([
      `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of ${OPTION_NAMES}.`,
    ]);
    expect(reordered.requests[0]?.variables.options).toEqual(
      STATUS_OPTIONS.map((option, i) => ({ id: `opt${String(i)}`, ...option })),
    );
  });

  it("creates a missing view with the ids of its fields", () => {
    const plan = planBoardSetup({
      ...STATE,
      project: {
        ...CONFIGURED,
        views: CONFIGURED.views.filter(({ name }) => name !== "By parent"),
      },
    });

    expect(plan.requests).toEqual([
      {
        query: BOARD_MUTATIONS.createView,
        variables: {
          projectId: "PVT_board",
          name: "By parent",
          layout: "TABLE_LAYOUT",
          fields: [
            fieldId("PVTF", "Title"),
            fieldId("PVTF", "Assignees"),
            "PVTSSF_status",
            fieldId("PVTF", "Repository"),
            fieldId("PVTF", "Labels"),
            fieldId("PVTF", "Parent issue"),
            fieldId("PVTF", "Sub-issues progress"),
            fieldId("PVTF", "Linked pull requests"),
          ],
        },
        summary: `Create the view "By parent" (a table; ${TABLE}).`,
      },
    ]);
    expect(plan.unchanged).toContain("Views: Board, By assignee.");
  });

  it("updates a view whose name, layout or visible fields drifted", () => {
    const plan = planBoardSetup({
      ...STATE,
      project: {
        ...CONFIGURED,
        views: CONFIGURED.views.map((view) =>
          view.name === "By assignee"
            ? { ...view, name: "by assignee", layout: "BOARD_LAYOUT" }
            : view.name === "Board"
              ? { ...view, fields: ["Title", "Assignees", "Labels"] }
              : view,
        ),
      },
    });

    expect(plan.requests).toEqual([
      {
        query: BOARD_MUTATIONS.updateView,
        variables: {
          viewId: "PVTV_1",
          name: "Board",
          layout: "BOARD_LAYOUT",
          fields: [
            fieldId("PVTF", "Title"),
            fieldId("PVTF", "Assignees"),
            fieldId("PVTF", "Labels"),
            fieldId("PVTF", "Parent issue"),
          ],
        },
        summary:
          'Update the view "Board" (the visible fields) to a board; Title, Assignees, Labels, Parent issue.',
      },
      {
        query: BOARD_MUTATIONS.updateView,
        variables: {
          viewId: "PVTV_2",
          name: "By assignee",
          layout: "TABLE_LAYOUT",
          fields: expect.any(Array) as unknown,
        },
        summary: `Update the view "By assignee" (renamed from "by assignee", the layout) to a table; ${TABLE}.`,
      },
    ]);
    expect(plan.unchanged).toContain("Views: By parent.");
  });

  it("links a missing repository", () => {
    const plan = planBoardSetup({
      ...STATE,
      project: {
        ...CONFIGURED,
        repositories: [`${BOARD_OWNER}/reforged-ts`],
      },
    });

    expect(plan.requests).toEqual([
      {
        query: BOARD_MUTATIONS.linkRepository,
        variables: { projectId: "PVT_board", repositoryId: "R_2" },
        summary: `Link the project to ${BOARD_OWNER}/reforged-ts-template.`,
      },
    ]);
    expect(plan.unchanged).toContain(
      `Repositories: ${BOARD_OWNER}/reforged-ts.`,
    );
  });

  it("makes the project public and sets its README when either drifted", () => {
    const drifted = (change: Partial<ProjectState>) =>
      planBoardSetup({ ...STATE, project: { ...CONFIGURED, ...change } });
    const variables = {
      projectId: "PVT_board",
      readme: BOARD_README,
      public: true,
    };

    expect(drifted({ public: false }).requests).toEqual([
      {
        query: BOARD_MUTATIONS.updateProject,
        variables,
        summary: "Make the project public.",
      },
    ]);
    expect(drifted({ readme: "# Old\n" }).requests).toEqual([
      {
        query: BOARD_MUTATIONS.updateProject,
        variables,
        summary: "Set the project's README.",
      },
    ]);
    expect(summaries(drifted({ public: false, readme: null }))).toEqual([
      "Make the project public and set its README.",
    ]);
  });

  it("reads the README as the same text but for line endings and a final newline", () => {
    const plan = planBoardSetup({
      ...STATE,
      project: {
        ...CONFIGURED,
        readme: BOARD_README.replaceAll("\n", "\r\n").trimEnd(),
      },
    });

    expect(plan.requests).toEqual([]);
  });

  it("stops on a project without a Status single select", () => {
    expect(() =>
      planBoardSetup({
        ...STATE,
        project: {
          ...CONFIGURED,
          fields: CONFIGURED.fields.filter(({ name }) => name !== "Status"),
        },
      }),
    ).toThrow(new BoardError("The project has no single select named Status."));
  });

  it("stops on a project without a field a view shows", () => {
    expect(() =>
      planBoardSetup({
        ...STATE,
        project: {
          ...CONFIGURED,
          fields: CONFIGURED.fields.filter(
            ({ name }) => name !== "Sub-issues progress",
          ),
        },
      }),
    ).toThrow(
      'The project has no field named Sub-issues progress, which the view "By assignee" shows.',
    );
  });
});

describe("readBoardState", () => {
  it("finds the project by its exact title, page after page", async () => {
    const sent: Sent[] = [];
    const base = reading(STATE);
    const state = await readBoardState(
      graphQlApi((operation, variables) => {
        if (operation !== "Projects") return base(operation, variables);
        return variables.cursor === null
          ? {
              data: {
                user: {
                  projectsV2: {
                    pageInfo: { hasNextPage: true, endCursor: "c1" },
                    nodes: [{ id: "PVT_other", title: `${BOARD_TITLE} (old)` }],
                  },
                },
              },
            }
          : {
              data: {
                user: {
                  projectsV2: {
                    pageInfo: { hasNextPage: false, endCursor: null },
                    nodes: [{ id: CONFIGURED.id, title: BOARD_TITLE }],
                  },
                },
              },
            };
      }, sent),
    );

    expect(state).toEqual(STATE);
    expect(sent.map(({ operation }) => operation)).toEqual([
      "Owner",
      "Repository",
      "Repository",
      "Projects",
      "Projects",
      "Project",
      "ProjectFields",
      "ProjectViews",
      "ProjectRepositories",
    ]);
    expect(
      sent
        .filter(({ operation }) => operation === "Projects")
        .map(({ variables }) => variables.cursor),
    ).toEqual([null, "c1"]);
    expect(sent[1]?.variables).toEqual({
      owner: BOARD_OWNER,
      name: "reforged-ts",
    });
  });

  it("answers no project when none has the title", async () => {
    const state = await readBoardState(
      graphQlApi(reading({ ...STATE, project: null })),
    );

    expect(state).toEqual({ ...STATE, project: null });
  });

  it("names the missing project scope", async () => {
    const api = graphQlApi(() => ({
      errors: [
        {
          type: "INSUFFICIENT_SCOPES",
          message:
            "Your token has not been granted the required scopes to execute this query.",
        },
      ],
    }));

    await expect(readBoardState(api)).rejects.toThrow(
      "Owner answered: INSUFFICIENT_SCOPES: Your token has not been granted the required scopes to execute this query. The gh login needs the project scope: gh auth refresh -s project.",
    );
  });

  it("names an answer that is not 200", async () => {
    await expect(
      readBoardState(() =>
        Promise.resolve({ status: 401, body: { message: "Bad credentials" } }),
      ),
    ).rejects.toThrow(new GraphQlError("Owner answered 401 Bad credentials."));
  });
});

describe("applyBoardSetup", () => {
  it("creates the project, then plans the rest on the project GitHub made", async () => {
    const sent: Sent[] = [];
    const done: string[] = [];
    const state = { ...STATE, project: null };
    const plan = planBoardSetup(state);

    const project = await applyBoardSetup(
      graphQlApi(reading(state, { created: FRESH }), sent),
      state,
      plan,
      ({ summary }) => {
        done.push(summary);
      },
    );

    expect(project).toEqual(FRESH);
    const field = (name: string) => fieldId("NEW", name);
    expect(mutations(sent)).toEqual([
      ["CreateProject", { ownerId: "U_owner", title: BOARD_TITLE }],
      [
        "UpdateProject",
        { projectId: "PVT_new", readme: BOARD_README, public: true },
      ],
      [
        "UpdateStatusOptions",
        {
          fieldId: "PVTSSF_new",
          // The fresh project's "In Progress" and "Done" keep their ids.
          options: STATUS_OPTIONS.map((option) =>
            option.name === "In progress"
              ? { id: "new_in_progress", ...option }
              : option.name === "Done"
                ? { id: "new_done", ...option }
                : { ...option },
          ),
        },
      ],
      [
        "CreateView",
        {
          projectId: "PVT_new",
          name: "Board",
          layout: "BOARD_LAYOUT",
          fields: [
            field("Title"),
            field("Assignees"),
            field("Labels"),
            field("Parent issue"),
          ],
        },
      ],
      [
        "CreateView",
        {
          projectId: "PVT_new",
          name: "By assignee",
          layout: "TABLE_LAYOUT",
          fields: [
            field("Title"),
            field("Assignees"),
            "PVTSSF_new",
            field("Repository"),
            field("Labels"),
            field("Parent issue"),
            field("Sub-issues progress"),
            field("Linked pull requests"),
          ],
        },
      ],
      ["CreateView", expect.objectContaining({ name: "By parent" }) as unknown],
      ["LinkRepository", { projectId: "PVT_new", repositoryId: "R_1" }],
      ["LinkRepository", { projectId: "PVT_new", repositoryId: "R_2" }],
    ]);
    expect(done).toEqual([
      CREATES_EVERYTHING[0],
      CREATES_EVERYTHING[1],
      `Rewrite the Status options to ${OPTION_NAMES}, keeping the ids of In progress, Done.`,
      ...CREATES_EVERYTHING.slice(3),
    ]);
  });

  it("sends the planned requests in order on an existing project", async () => {
    const sent: Sent[] = [];
    const state = {
      ...STATE,
      project: {
        ...CONFIGURED,
        public: false,
        views: CONFIGURED.views.slice(0, 2),
        repositories: [],
      },
    };

    await applyBoardSetup(
      graphQlApi(reading(state), sent),
      state,
      planBoardSetup(state),
    );

    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "UpdateProject",
      "CreateView",
      "LinkRepository",
      "LinkRepository",
    ]);
  });

  it("stops at the first refused request, naming it", async () => {
    const sent: Sent[] = [];
    const state = {
      ...STATE,
      project: {
        ...CONFIGURED,
        views: CONFIGURED.views.slice(0, 2),
        repositories: [],
      },
    };

    await expect(
      applyBoardSetup(
        graphQlApi(reading(state, { failing: "CreateView" }), sent),
        state,
        planBoardSetup(state),
      ),
    ).rejects.toThrow(
      `CreateView answered: FORBIDDEN: Resource not accessible by personal access token. Not done: Create the view "By parent" (a table; ${TABLE}).`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "CreateView",
    ]);
  });
});

/** A pull request that references the issue as closed by it. */
function pullRequest(
  state: BoardPullRequest["state"],
  draft = false,
): BoardPullRequest {
  return { number: 40, state, draft, author: "alice" };
}

/** An open sub-issue of the library. */
const sub = (number: number, repository = LIBRARY): SubIssue => ({
  repository,
  number,
  state: "OPEN",
});

const MAP = { repository: LIBRARY, number: 518, labels: ["wayfinder:map"] };
const SPEC = { repository: LIBRARY, number: 529, labels: ["spec"] };

describe("statusOf", () => {
  const alone = issueLookup([]);

  it.each([
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
      "In progress: an assignee, the Claim, before the blockers and the labels",
      { assignees: ["alice"], blockedBy: 1, labels: ["ready-for-agent"] },
      "In progress",
    ],
    [
      "In progress: a draft keeps it",
      { assignees: ["alice"], pullRequests: [pullRequest("OPEN", true)] },
      "In progress",
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
    ["Ready: ready-for-agent", { labels: ["ready-for-agent"] }, "Ready"],
    ["Ready: ready-for-human", { labels: ["bug", "ready-for-human"] }, "Ready"],
    [
      "Ready: an open child of a wayfinder:map, a frontier ticket",
      { labels: ["ticket"], parent: MAP },
      "Ready",
    ],
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
      { labels: ["spec"], subIssues: [{ ...sub(11), state: "CLOSED" }] },
      "Backlog",
    ],
  ] as const)("%s", (_row, more, expected) => {
    expect(statusOf(issue(1, more), alone)).toBe(expected);
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
    expect(statusOf(spec, issueLookup([libraryIssue]))).toBe("Backlog");
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

describe("board.yml", () => {
  it("runs on the issue and pull_request_target events, another Board repository's dispatch, hourly and by hand, one group, contents read, master checked out, the token from the board environment", async () => {
    const {
      text,
      workflow: { on, permissions, concurrency, jobs },
    } = await readWorkflow("board.yml");

    // The event type lists have a copy in the Template's board caller, held
    // equal by tests/pipeline/board.test.ts of phmilk/reforged-ts-template;
    // neither repository reads the other's files in a test.
    expect(on).toEqual({
      issues: {
        types: [
          "opened",
          "reopened",
          "closed",
          "deleted",
          "transferred",
          "assigned",
          "unassigned",
          "labeled",
          "unlabeled",
        ],
      },
      // master's workflow file and checkout, whatever the pull request
      // holds, and the secret for a fork's pull request too: never
      // pull_request, whose run takes the merge commit's file.
      pull_request_target: {
        types: [
          "opened",
          "reopened",
          "closed",
          "edited",
          "converted_to_draft",
          "ready_for_review",
        ],
        // Into master alone: the run is on the base branch's ref, which the
        // environment refuses on any other, and a closing keyword closes
        // nothing outside the default branch.
        branches: ["master"],
      },
      // Another Board repository's event, sent by board-dispatch.yml.
      repository_dispatch: { types: ["board-repository-event"] },
      workflow_dispatch: null,
      schedule: [
        { cron: expect.stringMatching(/^\d+ \* \* \* \*$/) as unknown },
      ],
    });
    // Nothing reads the dispatch's payload: each run reads everything.
    expect(text).not.toContain("client_payload");
    expect(permissions).toEqual({ contents: "read" });
    expect(concurrency).toEqual({
      group: "board",
      "cancel-in-progress": false,
    });
    expect(Object.keys(jobs)).toEqual(["reconcile"]);
    const job = jobs.reconcile;
    // No fork skip: master's code runs whatever the head, and the
    // environment's branch policy, master only, guards the secret.
    expect(job?.if).toBeUndefined();
    expect(job?.environment).toBe("board");
    expect(job?.permissions).toEqual({ contents: "read" });
    const steps = job?.steps ?? [];
    const checkouts = steps.filter((step) =>
      step.uses?.startsWith("actions/checkout@"),
    );
    expect(checkouts).toHaveLength(1);
    expect(checkouts[0]?.with).toMatchObject({
      ref: "master",
      "persist-credentials": false,
    });
    for (const step of steps) {
      expect(step.run ?? "", "a run step").not.toContain("${{");
    }
    const run = steps.filter((step) => step.run !== undefined);
    expect(run.map((step) => step.run)).toEqual(["pnpm board:reconcile"]);
    expect(run[0]?.env).toEqual({
      PROJECT_TOKEN: "${{ secrets.PROJECT_TOKEN }}",
    });
  });
});

describe("board-dispatch.yml", () => {
  it("is called alone with the App's key passed by name, one job in the caller's board environment, contents read, no checkout, the App's token for the library alone with contents write, a board-repository-event dispatch", async () => {
    const {
      workflow: { on, permissions, jobs },
    } = await readWorkflow("board-dispatch.yml");

    // An environment secret reaches a called job only when the caller
    // passes it (#554): required, so an unpassed key fails the call at
    // startup rather than as an empty key in the token action.
    expect(Object.keys(on)).toEqual(["workflow_call"]);
    expect(on.workflow_call).toMatchObject({
      secrets: { APP_PRIVATE_KEY: { required: true } },
    });
    expect(permissions).toEqual({ contents: "read" });
    expect(Object.keys(jobs)).toEqual(["dispatch"]);
    const job = jobs.dispatch;
    expect(job?.environment).toBe("board");
    expect(job?.permissions).toEqual({ contents: "read" });
    // The library's board group coalesces the runs; the caller's has none.
    expect(job?.concurrency).toBeUndefined();
    const steps = job?.steps ?? [];
    for (const step of steps) {
      expect(step.uses ?? "", "a checkout").not.toMatch(/^actions\/checkout@/);
      expect(step.run ?? "", "a run step").not.toContain("${{");
    }
    // The token action and gh alone: no other action, no install.
    const uses = steps.flatMap((step) =>
      step.uses === undefined ? [] : [step.uses],
    );
    expect(uses).toEqual([
      expect.stringMatching(/^actions\/create-github-app-token@[0-9a-f]{40}$/),
    ]);
    const token = steps.find((step) => step.uses === uses[0]);
    expect(token?.with).toEqual({
      "client-id": "${{ vars.APP_CLIENT_ID }}",
      "private-key": "${{ secrets.APP_PRIVATE_KEY }}",
      owner: BOARD_OWNER,
      repositories: "reforged-ts",
      "permission-contents": "write",
    });
    const run = steps.filter((step) => step.run !== undefined);
    expect(run).toHaveLength(2);
    // The refusal comes first: no token is minted for a repository off the
    // list.
    expect(steps.map((step) => step.id ?? step.run?.split(/\s/)[0])).toEqual([
      "for",
      "app",
      "gh",
    ]);
    expect(run[0]?.env?.REPOSITORY).toBe("${{ github.repository }}");
    expect(run[0]?.run).toContain("exit 1");
    expect(token?.id).toBe("app");
    // No payload: board.yml reads none.
    expect(run[1]).toMatchObject({
      env: { GH_TOKEN: "${{ steps.app.outputs.token }}" },
      run: `gh api --method POST repos/${BOARD_OWNER}/reforged-ts/dispatches -f event_type=board-repository-event`,
    });
  });

  it("lists the board's repositories other than the library", async () => {
    const {
      workflow: { jobs },
    } = await readWorkflow("board-dispatch.yml");
    const listed =
      jobs.dispatch?.steps?.find(
        (step) => step.env?.BOARD_REPOSITORIES !== undefined,
      )?.env?.BOARD_REPOSITORIES ?? "";

    expect(listed.split(/\s+/).filter(Boolean)).toEqual(
      BOARD_REPOSITORIES.filter(
        (repository) => repository !== `${BOARD_OWNER}/reforged-ts`,
      ),
    );
  });
});
