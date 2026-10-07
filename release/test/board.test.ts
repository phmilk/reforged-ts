import { describe, expect, it } from "vitest";
import {
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
  planBoardSetup,
  readBoardState,
  STATUS_OPTIONS,
  type BoardSetupPlan,
  type ProjectState,
} from "../src/board.js";
import {
  CONFIGURED,
  fieldId,
  FRESH,
  graphQlApi,
  mutations,
  reading,
  STATE,
  type Sent,
} from "./support/board.js";

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
    ).rejects.toThrow(new BoardError("Owner answered 401 Bad credentials."));
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
