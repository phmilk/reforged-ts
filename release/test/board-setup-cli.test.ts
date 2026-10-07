import { describe, expect, it } from "vitest";
import { BOARD_OWNER, BOARD_README, BOARD_TITLE } from "../src/board.js";
import { main, type Context } from "../src/cli/board-setup.js";
import type { Gh } from "../src/cli/common.js";
import {
  CONFIGURED,
  fieldId,
  FRESH,
  graphQlFetch,
  mutations,
  reading,
  STATE,
  type Sent,
} from "./support/board.js";

const gh: Gh = (args) => Promise.resolve(args[0] === "auth" ? "t0k\n" : "");

function run(
  args: string[],
  fetcher: typeof fetch,
  context?: Partial<Context>,
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
    { gh, fetcher, ...context },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

describe("board:setup", () => {
  it("prints the plan and sends nothing on a dry run", async () => {
    const sent: Sent[] = [];
    const state = {
      ...STATE,
      project: { ...CONFIGURED, readme: null },
    };
    const result = await run(["--dry-run"], graphQlFetch(reading(state), sent));

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(sent.every(({ kind }) => kind === "query")).toBe(true);
    expect(sent[0]?.authorization).toBe("Bearer t0k");
    expect(result.stdout).toContain(
      `Project "${BOARD_TITLE}" under ${BOARD_OWNER}: ${CONFIGURED.url} (number 7).\n`,
    );
    expect(result.stdout).toContain("Already set: Visibility: public.\n");
    expect(result.stdout).toContain("Dry run, 1 request, none sent:\n");
    expect(result.stdout).toContain(
      "Set the project's README.\n" +
        "mutation UpdateProject($projectId: ID!, $readme: String!, $public: Boolean!)\n" +
        '{\n  "projectId": "PVT_board",\n',
    );
  });

  it("creates everything, then the rest on the project GitHub made", async () => {
    const sent: Sent[] = [];
    const state = { ...STATE, project: null };
    const result = await run(
      [],
      graphQlFetch(reading(state, { created: FRESH }), sent),
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: the plan creates it.\n`,
    );
    expect(result.stdout).toContain("8 requests:\n");
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "CreateProject",
      "UpdateProject",
      "UpdateStatusOptions",
      "CreateView",
      "CreateView",
      "CreateView",
      "LinkRepository",
      "LinkRepository",
    ]);
    // The views were planned again on the created project: real ids.
    expect(mutations(sent)[3]?.[1]).toEqual({
      projectId: "PVT_new",
      name: "Board",
      layout: "BOARD_LAYOUT",
      fields: [
        fieldId("NEW", "Title"),
        fieldId("NEW", "Assignees"),
        fieldId("NEW", "Labels"),
        fieldId("NEW", "Parent issue"),
      ],
    });
    expect(result.stdout).toContain(
      `Done: Create the project "${BOARD_TITLE}" under ${BOARD_OWNER}.\n`,
    );
    expect(result.stdout).toContain(
      "Done: Rewrite the Status options to Backlog, Ready, Blocked, In progress, In review, Done, keeping the ids of In progress, Done.\n",
    );
    expect(result.stdout).toContain(
      `Done: Link the project to ${BOARD_OWNER}/reforged-ts-template.\n`,
    );
    expect(result.stdout.endsWith(`The board: ${FRESH.url}\n`)).toBe(true);
  });

  it("sends the planned requests in order on a drifted project", async () => {
    const sent: Sent[] = [];
    const state = {
      ...STATE,
      project: {
        ...CONFIGURED,
        public: false,
        views: CONFIGURED.views.filter(({ name }) => name !== "By parent"),
        repositories: [`${BOARD_OWNER}/reforged-ts`],
      },
    };
    const result = await run([], graphQlFetch(reading(state), sent));

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("3 requests:\n");
    expect(mutations(sent)).toEqual([
      [
        "UpdateProject",
        { projectId: "PVT_board", readme: BOARD_README, public: true },
      ],
      [
        "CreateView",
        expect.objectContaining({
          projectId: "PVT_board",
          name: "By parent",
        }) as unknown,
      ],
      ["LinkRepository", { projectId: "PVT_board", repositoryId: "R_2" }],
    ]);
    expect(result.stdout).toContain("Done: Make the project public.\n");
    expect(result.stdout.endsWith(`The board: ${CONFIGURED.url}\n`)).toBe(true);
  });

  it("stops at the first refused request, naming it", async () => {
    const sent: Sent[] = [];
    const state = {
      ...STATE,
      project: { ...CONFIGURED, public: false, repositories: [] },
    };
    const result = await run(
      [],
      graphQlFetch(reading(state, { failing: "LinkRepository" }), sent),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      "LinkRepository answered: FORBIDDEN: Resource not accessible by personal access token. " +
        `Not done: Link the project to ${BOARD_OWNER}/reforged-ts.\n`,
    );
    expect(mutations(sent).map(([operation]) => operation)).toEqual([
      "UpdateProject",
      "LinkRepository",
    ]);
    expect(result.stdout).toContain("Done: Make the project public.\n");
  });

  it("refuses a real run as a login that is not the owner", async () => {
    const sent: Sent[] = [];
    const state = { ...STATE, viewer: "another-login", project: null };
    const result = await run([], graphQlFetch(reading(state), sent));

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      `The gh authentication is another-login, not the owner ${BOARD_OWNER}, and only the owner writes the board. ` +
        `Run it as ${BOARD_OWNER} (gh auth login, or gh auth switch to that account).\n`,
    );
    expect(mutations(sent)).toEqual([]);
  });

  it("notes a login that is not the owner on a dry run, and plans anyway", async () => {
    const state = { ...STATE, viewer: "another-login" };
    const result = await run(["--dry-run"], graphQlFetch(reading(state)));

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe(
      `Note: The gh authentication is another-login, not the owner ${BOARD_OWNER}, and only the owner writes the board. A real run stops here.\n`,
    );
    expect(result.stdout).toContain("Dry run, 0 requests, none sent:\n");
  });

  it("prints the plan that creates everything, with a note, when gh has no token on a dry run", async () => {
    const sent: Sent[] = [];
    const noAuth: Gh = () => Promise.reject(new Error("not logged in"));
    const result = await run(
      ["--dry-run"],
      graphQlFetch(reading(STATE), sent),
      {
        gh: noAuth,
      },
    );

    expect(result.exitCode).toBe(0);
    expect(sent).toEqual([]);
    expect(result.stderr).toContain(
      "Note: GitHub could not be read, so the plan below assumes that no project exists. " +
        "gh auth token (the token of the gh authentication; run gh auth login) failed: not logged in",
    );
    expect(result.stdout).toContain(
      `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: the plan creates it.\n`,
    );
    expect(result.stdout).toContain("Dry run, 8 requests, none sent:\n");
    expect(result.stdout).toContain(
      `Create the project "${BOARD_TITLE}" under ${BOARD_OWNER}.\n` +
        "mutation CreateProject($ownerId: ID!, $title: String!)\n" +
        `{\n  "ownerId": "<the id of ${BOARD_OWNER}>",\n  "title": "${BOARD_TITLE}"\n}\n`,
    );
  });

  it("prints the plan that creates everything, with a note, when the login lacks the project scope on a dry run", async () => {
    const sent: Sent[] = [];
    const result = await run(
      ["--dry-run"],
      graphQlFetch(
        () => ({
          errors: [
            {
              type: "INSUFFICIENT_SCOPES",
              message:
                "Your token has not been granted the required scopes to execute this query.",
            },
          ],
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(0);
    expect(sent.map(({ operation }) => operation)).toEqual(["Owner"]);
    expect(result.stderr).toContain(
      "The gh login needs the project scope: gh auth refresh -s project.\n",
    );
    expect(result.stdout).toContain("Dry run, 8 requests, none sent:\n");
  });

  it("stops without the token on a real run", async () => {
    const sent: Sent[] = [];
    const noAuth: Gh = () => Promise.reject(new Error("not logged in"));
    const result = await run([], graphQlFetch(reading(STATE), sent), {
      gh: noAuth,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("gh auth token");
    expect(result.stderr).toContain("gh auth login");
    expect(sent).toEqual([]);
  });

  it("stops without the project scope on a real run", async () => {
    const sent: Sent[] = [];
    const result = await run(
      [],
      graphQlFetch(
        () => ({
          errors: [{ type: "INSUFFICIENT_SCOPES", message: "scopes" }],
        }),
        sent,
      ),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      "Owner answered: INSUFFICIENT_SCOPES: scopes. The gh login needs the project scope: gh auth refresh -s project.\n",
    );
    expect(mutations(sent)).toEqual([]);
  });

  it("says when gh is not installed", async () => {
    const missing: Gh = () =>
      Promise.reject(
        Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" }),
      );
    const result = await run([], graphQlFetch(reading(STATE)), { gh: missing });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("gh is not installed");
  });

  it.each([[["--repo", "a/b"]], [["--apply"]], [["--dry-run", "--dry-run"]]])(
    "rejects the arguments %j",
    async (args) => {
      const result = await run(args, graphQlFetch(reading(STATE)));

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Usage: board:setup [--dry-run]");
      expect(result.stderr).toContain("project scope");
    },
  );
});
