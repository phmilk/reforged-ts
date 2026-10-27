import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MARKER, SPEC_MARKER } from "../src/claim-check.js";
import { repositoryRoot } from "../src/workspace.js";
import { tempDir, writeText } from "./support/workspace.js";

const SCRIPT = join(repositoryRoot, "release", "src", "claim-check.ts");
const REPOSITORY = "owner/fork";
const ISSUES = `/repos/${REPOSITORY}/issues`;

interface Received {
  method: string;
  path: string;
  authorization: string | undefined;
  body: unknown;
}

/** An answer of the stub API: a status and a JSON body (none for a 204). */
interface Answer {
  status: number;
  body?: unknown;
}

interface Answers {
  /** REST answers by `METHOD /path?query`; 404 otherwise. */
  rest: Record<string, Answer>;
  /** GraphQL `data` answers by the field the query names; an error otherwise. */
  graphql: Record<string, unknown>;
}

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A stub of the GitHub API on the loopback interface, which the script
 * reaches through `GITHUB_API_URL`: it answers from `answers` and records
 * every request in `received`.
 */
let server: Server;
let base = "";
let received: Received[] = [];
let answers: Answers = { rest: {}, graphql: {} };

function answer(method: string, path: string, body: unknown): Answer {
  if (path === "/graphql") {
    const query =
      isRecord(body) && typeof body.query === "string" ? body.query : "";
    const field = Object.keys(answers.graphql).find((name) =>
      query.includes(name),
    );
    return field === undefined
      ? {
          status: 200,
          body: { errors: [{ message: `unexpected query: ${query}` }] },
        }
      : { status: 200, body: { data: answers.graphql[field] } };
  }
  return (
    answers.rest[`${method} ${path}`] ?? {
      status: 404,
      body: { message: "Not Found" },
    }
  );
}

beforeAll(async () => {
  server = createServer((request, response) => {
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      text += chunk;
    });
    request.on("end", () => {
      const method = request.method ?? "";
      const path = request.url ?? "";
      const body: unknown = text === "" ? undefined : JSON.parse(text);
      received.push({
        method,
        path,
        authorization: request.headers.authorization,
        body,
      });
      const { status, body: answered } = answer(method, path, body);
      response.writeHead(status, { "content-type": "application/json" });
      response.end(
        answered === undefined ? undefined : JSON.stringify(answered),
      );
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The stub API got no port.");
  }
  base = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    }),
);

beforeEach(() => {
  received = [];
  answers = { rest: {}, graphql: {} };
});

/**
 * Runs the script as the workflow does, `node release/src/claim-check.ts
 * <args>`, in a folder outside the repository, with `event` as the event
 * file, a job summary file and a step outputs file; resolves with its exit
 * code, its output, the summary and the outputs written.
 */
async function run(
  args: readonly string[],
  event: unknown = {},
  env: Readonly<Record<string, string | undefined>> = {},
) {
  const dir = await tempDir("claim-check");
  await writeText(dir, "event.json", JSON.stringify(event));
  await writeText(dir, "summary.md", "");
  await writeText(dir, "output.txt", "");
  const result = await new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: dir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "t0k",
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_REPOSITORY_OWNER: "owner",
        GITHUB_EVENT_PATH: join(dir, "event.json"),
        GITHUB_API_URL: base,
        GITHUB_STEP_SUMMARY: join(dir, "summary.md"),
        GITHUB_OUTPUT: join(dir, "output.txt"),
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
  return {
    ...result,
    summary: await readFile(join(dir, "summary.md"), "utf8"),
    output: await readFile(join(dir, "output.txt"), "utf8"),
  };
}

/** What was sent, as `METHOD /path` and the body. */
const sent = () =>
  received.map(({ method, path, body }) => [`${method} ${path}`, body]);

/** The check itself, as REST names the author of a comment made with GITHUB_TOKEN. */
const CHECK = { login: "github-actions[bot]", type: "Bot" };

const PULL_REQUEST_EVENT = {
  action: "opened",
  number: 34,
  pull_request: {
    number: 34,
    user: { login: "alice", type: "User" },
    body: "Closes #12, closes owner/other#5.",
  },
};

/**
 * The closing references of #34: #12 of this repository, with `parent` as
 * its parent issue when given, #5 of the other; `totalCount` as GitHub
 * counts them.
 */
function closing(
  assignees: string[],
  totalCount = 2,
  parent: unknown = null,
): unknown {
  return {
    repository: {
      pullRequest: {
        closingIssuesReferences: {
          totalCount,
          nodes: [
            {
              number: 12,
              repository: { nameWithOwner: REPOSITORY },
              assignees: { nodes: assignees.map((login) => ({ login })) },
              parent,
            },
            {
              number: 5,
              repository: { nameWithOwner: "owner/other" },
              assignees: { nodes: [] },
            },
          ],
        },
      },
    },
  };
}

describe("claim-check pull-request", () => {
  it("assigns the author, comments text 1, writes the summary and the assigned output, under node with no install", async () => {
    answers.graphql.closingIssuesReferences = closing([]);
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };
    answers.rest[`POST ${ISSUES}/12/assignees`] = {
      status: 201,
      body: { assignees: [{ login: "alice" }] },
    };
    answers.rest[`POST ${ISSUES}/34/comments`] = {
      status: 201,
      body: { id: 1 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: no assignee; assigned to the author @alice.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n" +
        "Assigned #12 to @alice.\n" +
        "Commented on #34.\n",
      stderr: "",
      summary:
        "## Claim check\n\n" +
        "- #12: no assignee; assigned to the author @alice.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n",
      // The workflow dispatches the board on it.
      output: "assigned=12\n",
    });
    expect(sent()).toEqual([
      [
        "POST /graphql",
        expect.objectContaining({
          variables: { owner: "owner", name: "fork", number: 34, first: 50 },
        }) as unknown,
      ],
      [`GET ${ISSUES}/12/assignees/alice`, undefined],
      [`GET ${ISSUES}/34/comments?per_page=100&page=1`, undefined],
      [`POST ${ISSUES}/12/assignees`, { assignees: ["alice"] }],
      [
        `POST ${ISSUES}/34/comments`,
        {
          body: `${MARKER}\n\n**Claim check.** Assigned #12 to @alice. Under the Claim protocol the Claim comes before the work: \`gh issue edit 12 --add-assignee @me\`, as the first write. See \`docs/agents/issue-tracker.md\`, "Claim".`,
        },
      ],
    ]);
    expect(received[0]?.authorization).toBe("Bearer t0k");
    // The count travels with the page: a pull request past it is not passed.
    expect(JSON.stringify(received[0]?.body)).toContain("totalCount");
  });

  it("adds the author to the parent Spec of the Ticket, and puts the Spec in the assigned output", async () => {
    answers.graphql.closingIssuesReferences = closing(["alice"], 2, {
      number: 10,
      url: `https://github.com/${REPOSITORY}/issues/10`,
      repository: { nameWithOwner: REPOSITORY },
      labels: { nodes: [{ name: "spec" }, { name: "ready-for-agent" }] },
      assignees: { nodes: [{ login: "bob" }] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/10/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };
    answers.rest[`POST ${ISSUES}/10/assignees`] = {
      status: 201,
      body: { assignees: [{ login: "bob" }, { login: "alice" }] },
    };
    answers.rest[`POST ${ISSUES}/34/comments`] = {
      status: 201,
      body: { id: 1 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: claimed by @alice, the author; passed.\n" +
        "- #10, the Spec of #12: the author @alice is not among its assignees; assigned to them.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n" +
        "Assigned #10 to @alice.\n" +
        "Commented on #34.\n",
      stderr: "",
      summary:
        "## Claim check\n\n" +
        "- #12: claimed by @alice, the author; passed.\n" +
        "- #10, the Spec of #12: the author @alice is not among its assignees; assigned to them.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n",
      output: "assigned=10\n",
    });
    expect(sent()).toEqual([
      [
        "POST /graphql",
        expect.objectContaining({
          query: expect.stringContaining("parent") as unknown,
        }) as unknown,
      ],
      [`GET ${ISSUES}/12/assignees/alice`, undefined],
      [`GET ${ISSUES}/10/assignees/alice`, undefined],
      [`GET ${ISSUES}/34/comments?per_page=100&page=1`, undefined],
      [`POST ${ISSUES}/10/assignees`, { assignees: ["alice"] }],
      [
        `POST ${ISSUES}/34/comments`,
        {
          body: `${MARKER}\n\n**Claim check.** Added @alice to #10, the Spec of #12: a Spec carries every login on its Tickets. Join it in the command that claims a Ticket: \`gh issue edit 12 10 --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim".`,
        },
      ],
    ]);
  });

  it("comments on the Ticket the command that joins a Spec of the other repository, assigning nothing there", async () => {
    answers.graphql.closingIssuesReferences = closing(["alice"], 2, {
      number: 726,
      url: "https://github.com/owner/other/issues/726",
      repository: { nameWithOwner: "owner/other" },
      labels: { nodes: [{ name: "spec" }] },
      assignees: { nodes: [{ login: "bob" }] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    // The issue branch's comment on the Ticket is not this one.
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [
        {
          id: 4,
          user: CHECK,
          body: `${MARKER}\n\n**Claim conflict** resolved.`,
        },
      ],
    };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };
    answers.rest[`POST ${ISSUES}/12/comments`] = {
      status: 201,
      body: { id: 9 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: claimed by @alice, the author; passed.\n" +
        "- owner/other#726, the Spec of #12: the author @alice is not among its assignees, in another repository; the command that joins it commented on #12.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n" +
        "Commented on #12.\n",
      stderr: "",
      summary:
        "## Claim check\n\n" +
        "- #12: claimed by @alice, the author; passed.\n" +
        "- owner/other#726, the Spec of #12: the author @alice is not among its assignees, in another repository; the command that joins it commented on #12.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n",
      output: "",
    });
    expect(sent()).toEqual([
      ["POST /graphql", expect.anything() as unknown],
      [`GET ${ISSUES}/12/assignees/alice`, undefined],
      [`GET ${ISSUES}/12/comments?per_page=100&page=1`, undefined],
      [`GET ${ISSUES}/34/comments?per_page=100&page=1`, undefined],
      [
        `POST ${ISSUES}/12/comments`,
        {
          body: `${SPEC_MARKER}\n\n**Claim check.** @alice is not among the assignees of owner/other#726, the Spec of #12, and the check cannot add them there: its token writes in this repository only. Join it: \`gh issue edit https://github.com/owner/other/issues/726 --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim", "A Spec's assignees".`,
        },
      ],
    ]);
  });

  it("reads the Ticket's comment and rewrites the author's command once they are on the Spec of the other repository", async () => {
    answers.graphql.closingIssuesReferences = closing(["alice"], 2, {
      number: 726,
      url: "https://github.com/owner/other/issues/726",
      repository: { nameWithOwner: "owner/other" },
      labels: { nodes: [{ name: "spec" }] },
      assignees: { nodes: [{ login: "bob" }, { login: "alice" }] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [
        {
          id: 9,
          user: CHECK,
          body: `${SPEC_MARKER}\n\n**Claim check.** @alice is not among the assignees of owner/other#726, the Spec of #12, and the check cannot add them there: its token writes in this repository only. Join it: \`gh issue edit https://github.com/owner/other/issues/726 --add-assignee @me\`. See \`docs/agents/issue-tracker.md\`, "Claim", "A Spec's assignees".`,
        },
      ],
    };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };
    answers.rest[`PATCH /repos/${REPOSITORY}/issues/comments/9`] = {
      status: 200,
      body: { id: 9 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: claimed by @alice, the author; passed.\n" +
        "- owner/other#726, the Spec of #12: the author @alice among its assignees.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n" +
        "Edited the comment on #12.\n",
      stderr: "",
      summary:
        "## Claim check\n\n" +
        "- #12: claimed by @alice, the author; passed.\n" +
        "- owner/other#726, the Spec of #12: the author @alice among its assignees.\n" +
        "- owner/other#5: an issue of another repository; ignored.\n",
      output: "",
    });
    expect(sent()).toEqual([
      ["POST /graphql", expect.anything() as unknown],
      [`GET ${ISSUES}/12/assignees/alice`, undefined],
      [`GET ${ISSUES}/12/comments?per_page=100&page=1`, undefined],
      [`GET ${ISSUES}/34/comments?per_page=100&page=1`, undefined],
      [
        `PATCH /repos/${REPOSITORY}/issues/comments/9`,
        {
          body: `${SPEC_MARKER}\n\n**Claim check.** @alice is among the assignees of owner/other#726, the Spec of #12: nothing left to join.`,
        },
      ],
    ]);
  });

  it("ignores a parent that is not a Spec", async () => {
    answers.graphql.closingIssuesReferences = closing(["alice"], 2, {
      number: 1,
      url: `https://github.com/${REPOSITORY}/issues/1`,
      repository: { nameWithOwner: REPOSITORY },
      labels: { nodes: [{ name: "map" }] },
      assignees: { nodes: [] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(0);
    expect(result.output).toBe("");
    expect(sent().map(([request]) => request)).toEqual([
      "POST /graphql",
      `GET ${ISSUES}/12/assignees/alice`,
      `GET ${ISSUES}/34/comments?per_page=100&page=1`,
    ]);
  });

  it("fails on an issue claimed by another login, with text 2 and an annotation", async () => {
    answers.graphql.closingIssuesReferences = closing(["bob"]);
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 404 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [
        { id: 7, user: CHECK, body: `${MARKER}\n\n**Claim check** passed.` },
      ],
    };
    answers.rest[`PATCH /repos/${REPOSITORY}/issues/comments/7`] = {
      status: 200,
      body: { id: 7 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "- #12: claimed by @bob, not by the author @alice; failed.\n",
    );
    expect(result.stdout).toContain("::error title=Claim check failed::");
    // Nothing assigned: no output, no dispatch.
    expect(result.output).toBe("");
    expect(sent().map(([request]) => request)).toEqual([
      "POST /graphql",
      `GET ${ISSUES}/12/assignees/alice`,
      `GET ${ISSUES}/34/comments?per_page=100&page=1`,
      `PATCH /repos/${REPOSITORY}/issues/comments/7`,
    ]);
    expect(received[3]?.body).toEqual({
      body: `${MARKER}\n\n**Claim check failed.** #12 is claimed by @bob (the assignee is the Claim: one login per issue), and this pull request would close it. Coordinate with them or, if the Claim is stale (3 days without a commit on their pull request and without a comment), take it over: comment on #12 first, then \`gh issue edit 12 --remove-assignee bob --add-assignee @me\`. Then re-run this check (Actions, "Re-run jobs") or push a commit. See \`docs/agents/issue-tracker.md\`, "Claim".`,
    });
  });

  it("passes over a marked comment by another login and writes its own", async () => {
    const planted = {
      id: 3,
      user: { login: "mallory", type: "User" },
      body: `${MARKER}\n\n**Claim check** passed.`,
    };
    answers.graphql.closingIssuesReferences = closing(["bob"]);
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 404 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [planted],
    };
    answers.rest[`POST ${ISSUES}/34/comments`] = {
      status: 201,
      body: { id: 8 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("Commented on #34.\n");
    expect(sent().map(([request]) => request)).toEqual([
      "POST /graphql",
      `GET ${ISSUES}/12/assignees/alice`,
      `GET ${ISSUES}/34/comments?per_page=100&page=1`,
      `POST ${ISSUES}/34/comments`,
    ]);
  });

  it("edits its own marked comment, a planted one before it left alone", async () => {
    const planted = {
      id: 3,
      user: { login: "mallory", type: "User" },
      body: `${MARKER}\n\n**Claim check** passed.`,
    };
    answers.graphql.closingIssuesReferences = closing(["bob"]);
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 404 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 200,
      body: [
        planted,
        // GraphQL's spelling of the same login, on a Bot: the check's too.
        {
          id: 7,
          user: { login: "github-actions", type: "Bot" },
          body: `${MARKER}\n\n**Claim check** passed.`,
        },
      ],
    };
    answers.rest[`PATCH /repos/${REPOSITORY}/issues/comments/7`] = {
      status: 200,
      body: { id: 7 },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("Edited the comment on #34.\n");
    expect(sent().map(([request]) => request)).toContain(
      `PATCH /repos/${REPOSITORY}/issues/comments/7`,
    );
  });

  it("stops, exit 1, on a pull request that closes more issues than it read, the summary saying so", async () => {
    answers.graphql.closingIssuesReferences = closing([], 51);

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    const message =
      "#34 closes 51 issues, more than the 2 the check read: it cannot pass on an issue it has not read. Name at most 50 issues in the description, or split the pull request, then re-run the check.";
    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `${message}\n`,
      summary: `## Claim check\n\n- ${message}\n`,
      output: "",
    });
    // Nothing read further, nothing written.
    expect(sent().map(([request]) => request)).toEqual(["POST /graphql"]);
  });

  it("exits 1 naming the answer it could not read, in the summary too", async () => {
    answers.graphql.closingIssuesReferences = closing([]);
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answers.rest[`GET ${ISSUES}/34/comments?per_page=100&page=1`] = {
      status: 500,
      body: { message: "Server Error" },
    };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result).toMatchObject({
      code: 1,
      stdout: "",
      stderr: `GET ${ISSUES}/34/comments?per_page=100&page=1 answered 500 Server Error.\n`,
      summary: `## Claim check\n\n- GET ${ISSUES}/34/comments?per_page=100&page=1 answered 500 Server Error.\n`,
    });
  });
});

const ISSUE_EVENT = {
  action: "assigned",
  issue: { number: 12, assignees: [{ login: "alice" }, { login: "bob" }] },
  assignee: { login: "bob" },
  sender: { login: "bob" },
};

describe("claim-check issue", () => {
  it("re-reads the assignees, then edits the marked comment to text 4", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: { number: 12, assignees: [{ login: "alice" }, { login: "bob" }] },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: {
        issue: {
          closedByPullRequestsReferences: {
            nodes: [
              {
                number: 30,
                state: "MERGED",
                repository: { nameWithOwner: REPOSITORY },
                author: { __typename: "User", login: "alice" },
              },
            ],
          },
        },
      },
    };
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [
        {
          id: 3,
          user: { login: "alice", type: "User" },
          body: "A comment by a person.",
        },
        {
          id: 7,
          user: CHECK,
          body: `${MARKER}\n\n**Claim conflict** resolved.`,
        },
      ],
    };
    answers.rest[`PATCH /repos/${REPOSITORY}/issues/comments/7`] = {
      status: 200,
      body: { id: 7 },
    };

    const result = await run(["issue"], ISSUE_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: @bob added by @bob to an issue claimed by @alice; conflict.\n" +
        "Edited the comment on #12.\n",
      stderr: "",
      summary:
        "## Claim check\n\n- #12: @bob added by @bob to an issue claimed by @alice; conflict.\n",
      output: "",
    });
    expect(sent()).toEqual([
      [`GET ${ISSUES}/12`, undefined],
      [
        "POST /graphql",
        expect.objectContaining({
          variables: { owner: "owner", name: "fork", number: 12 },
        }) as unknown,
      ],
      [`GET ${ISSUES}/12/comments?per_page=100&page=1`, undefined],
      [
        `PATCH /repos/${REPOSITORY}/issues/comments/7`,
        {
          body: `${MARKER}\n\n**Claim conflict.** @bob was added to #12, which is claimed by @alice: one login per issue, and a second assignee is added only by the first, for pairing. If the Claim is stale (3 days without a commit on its pull request and without a comment), take it over: comment, then \`gh issue edit 12 --remove-assignee alice\`. Otherwise withdraw: \`gh issue edit 12 --remove-assignee @me\`.`,
        },
      ],
    ]);
  });

  it("reads a Spec's Tickets and draws nothing on a login that holds one", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: {
        number: 12,
        labels: [{ name: "enhancement" }, { name: "spec" }],
        assignees: [{ login: "alice" }, { login: "bob" }],
      },
    };
    answers.graphql.subIssues = {
      repository: {
        issue: {
          subIssues: {
            nodes: [
              { assignees: { nodes: [{ login: "alice" }] } },
              // A Ticket of the other Board repository counts the same.
              { assignees: { nodes: [{ login: "bob" }] } },
              { assignees: { nodes: [] } },
            ],
          },
        },
      },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: { issue: { closedByPullRequestsReferences: { nodes: [] } } },
    };
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };

    const result = await run(["issue"], ISSUE_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12, a Spec: @bob, who holds or delivered one of its Tickets, added by @bob; no conflict.\n",
      stderr: "",
      summary:
        "## Claim check\n\n- #12, a Spec: @bob, who holds or delivered one of its Tickets, added by @bob; no conflict.\n",
      output: "",
    });
    expect(sent()).toEqual([
      [`GET ${ISSUES}/12`, undefined],
      [
        "POST /graphql",
        expect.objectContaining({
          query: expect.stringContaining("subIssues") as unknown,
          variables: { owner: "owner", name: "fork", number: 12 },
        }) as unknown,
      ],
      [
        "POST /graphql",
        expect.objectContaining({
          query: expect.stringContaining(
            "closedByPullRequestsReferences",
          ) as unknown,
        }) as unknown,
      ],
      [`GET ${ISSUES}/12/comments?per_page=100&page=1`, undefined],
    ]);
  });

  it("reads a Spec's Tickets and comments text 4 on a login that holds or delivered none of them", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: {
        number: 12,
        labels: [{ name: "spec" }],
        assignees: [{ login: "alice" }, { login: "bob" }],
      },
    };
    answers.graphql.subIssues = {
      repository: {
        issue: {
          subIssues: {
            nodes: [
              { assignees: { nodes: [{ login: "alice" }] } },
              { assignees: { nodes: [{ login: "carol" }] } },
            ],
          },
        },
      },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: { issue: { closedByPullRequestsReferences: { nodes: [] } } },
    };
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };
    answers.rest[`POST ${ISSUES}/12/comments`] = {
      status: 201,
      body: { id: 8 },
    };

    const result = await run(["issue"], ISSUE_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout:
        "- #12: @bob added by @bob to an issue claimed by @alice; conflict.\n" +
        "Commented on #12.\n",
      stderr: "",
      summary:
        "## Claim check\n\n- #12: @bob added by @bob to an issue claimed by @alice; conflict.\n",
      output: "",
    });
    expect(sent()).toEqual([
      [`GET ${ISSUES}/12`, undefined],
      [
        "POST /graphql",
        expect.objectContaining({
          query: expect.stringContaining("subIssues") as unknown,
        }) as unknown,
      ],
      ["POST /graphql", expect.anything() as unknown],
      [`GET ${ISSUES}/12/comments?per_page=100&page=1`, undefined],
      [
        `POST ${ISSUES}/12/comments`,
        {
          body: `${MARKER}\n\n**Claim conflict.** @bob was added to #12, which is claimed by @alice: one login per issue, and a second assignee is added only by the first, for pairing. If the Claim is stale (3 days without a commit on its pull request and without a comment), take it over: comment, then \`gh issue edit 12 --remove-assignee alice\`. Otherwise withdraw: \`gh issue edit 12 --remove-assignee @me\`.`,
        },
      ],
    ]);
  });

  it("writes nothing when the re-read assignees show no conflict", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: { number: 12, assignees: [{ login: "alice" }] },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: { issue: { closedByPullRequestsReferences: { nodes: [] } } },
    };
    answers.rest[`GET ${ISSUES}/12/comments?per_page=100&page=1`] = {
      status: 200,
      body: [],
    };

    const result = await run(["issue"], ISSUE_EVENT);

    expect(result).toEqual({
      code: 0,
      stdout: "- #12: claimed by @alice; no conflict.\n",
      stderr: "",
      summary: "## Claim check\n\n- #12: claimed by @alice; no conflict.\n",
      output: "",
    });
    expect(received.map(({ method }) => method)).toEqual([
      "GET",
      "POST",
      "GET",
    ]);
  });
});

describe("claim-check", () => {
  it("prints the usage and exits 2 without a mode, before any request", async () => {
    for (const args of [[], ["bogus"], ["issue", "--extra"]]) {
      expect(await run(args)).toEqual({
        code: 2,
        stdout: "",
        stderr: "Usage: node release/src/claim-check.ts <pull-request|issue>\n",
        summary: "",
        output: "",
      });
    }
    expect(received).toEqual([]);
  });

  it("exits 1 naming the missing token, before any request", async () => {
    const result = await run(["issue"], ISSUE_EVENT, { GITHUB_TOKEN: "" });

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "GITHUB_TOKEN is not set.\n",
      summary: "## Claim check\n\n- GITHUB_TOKEN is not set.\n",
      output: "",
    });
    expect(received).toEqual([]);
  });

  it("exits 1 on an event of the other mode", async () => {
    const result = await run(["issue"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("the issue mode runs on issues");
    expect(received).toEqual([]);
  });
});

/** The closing references of #34: #12 of this repository alone, with `more` fields. */
function closingOne(more: Record<string, unknown>): unknown {
  return {
    repository: {
      pullRequest: {
        closingIssuesReferences: {
          totalCount: 1,
          nodes: [
            {
              number: 12,
              repository: { nameWithOwner: REPOSITORY },
              assignees: { nodes: [{ login: "alice" }] },
              parent: null,
              ...more,
            },
          ],
        },
      },
    },
  };
}

/** A `blockedBy` connection holding `blockers`, all read. */
const blockedBy = (
  ...blockers: { number: number; state: string; repository: string }[]
) => ({
  totalCount: blockers.length,
  nodes: blockers.map(({ number, state, repository }) => ({
    number,
    state,
    repository: { nameWithOwner: repository },
  })),
});

/** Answers that issue or pull request `number` has no comment yet, and takes a new one. */
function answerNewComment(number: number): void {
  answers.rest[`GET ${ISSUES}/${String(number)}/comments?per_page=100&page=1`] =
    {
      status: 200,
      body: [],
    };
  answers.rest[`POST ${ISSUES}/${String(number)}/comments`] = {
    status: 201,
    body: { id: 1 },
  };
}

describe("claim-check, the Spec and its blockers (ADR 0025)", () => {
  it("fails a pull request that would close a Spec, read from its labels", async () => {
    answers.graphql.closingIssuesReferences = closingOne({
      labels: { nodes: [{ name: "spec" }] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answerNewComment(34);

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      "- #12: a Spec; failed: a pull request names the Tickets it delivers, never their Spec.\n",
    );
    expect(result.stdout).toContain("::error title=Claim check failed::");
    expect(sent().at(-1)).toEqual([
      `POST ${ISSUES}/34/comments`,
      {
        body: `${MARKER}\n\n**Claim check failed.** #12 is a Spec, and this pull request would close it. A Spec is never closed by a pull request: name the Tickets this one delivers instead (\`Closes #<ticket>\`), and whoever merges the last of them closes the Spec after its coverage check. See \`docs/agents/issue-tracker.md\`, "Closing a Spec".`,
      },
    ]);
  });

  it("fails a pull request closing a Ticket whose blocker in the other repository is open; a closed blocker does not count", async () => {
    answers.graphql.closingIssuesReferences = closingOne({
      blockedBy: blockedBy(
        { number: 5, state: "OPEN", repository: "owner/other" },
        { number: 9, state: "CLOSED", repository: REPOSITORY },
      ),
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };
    answerNewComment(34);

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      "- #12: blocked by owner/other#5, open and not closed by this pull request; failed.\n",
    );
    // The page carries each closing issue's labels and blockers.
    expect(JSON.stringify(received[0]?.body)).toContain("blockedBy");
  });

  it("stops on a Ticket with more blockers than one page reads", async () => {
    answers.graphql.closingIssuesReferences = closingOne({
      blockedBy: { totalCount: 51, nodes: [] },
    });
    answers.rest[`GET ${ISSUES}/12/assignees/alice`] = { status: 204 };

    const result = await run(["pull-request"], PULL_REQUEST_EVENT);

    expect(result.code).toBe(1);
    expect(result.stderr).toBe(
      "#12 is blocked by 51 issues, more than the 0 the check read: it cannot pass on a blocker it has not read.\n",
    );
  });

  it("comments on the Claim of an unsplit Spec, read from its labels, its state and its sub-issues", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: {
        number: 12,
        state: "open",
        labels: [{ name: "spec" }],
        assignees: [{ login: "alice" }],
      },
    };
    answers.graphql.subIssues = {
      repository: { issue: { subIssues: { nodes: [] } } },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: { issue: { closedByPullRequestsReferences: { nodes: [] } } },
    };
    answerNewComment(12);

    const result = await run(["issue"], {
      ...ISSUE_EVENT,
      assignee: { login: "alice" },
      sender: { login: "alice" },
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      "- #12: a Spec with no Ticket, assigned to @alice; premature.\n" +
        "Commented on #12.\n",
    );
  });

  it("comments on the Claim of an issue with an open blocker, read with its pull requests", async () => {
    answers.rest[`GET ${ISSUES}/12`] = {
      status: 200,
      body: { number: 12, state: "open", assignees: [{ login: "alice" }] },
    };
    answers.graphql.closedByPullRequestsReferences = {
      repository: {
        issue: {
          closedByPullRequestsReferences: { nodes: [] },
          blockedBy: blockedBy(
            { number: 9, state: "OPEN", repository: REPOSITORY },
            { number: 8, state: "CLOSED", repository: REPOSITORY },
          ),
        },
      },
    };
    answerNewComment(12);

    const result = await run(["issue"], {
      ...ISSUE_EVENT,
      assignee: { login: "alice" },
      sender: { login: "alice" },
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      "- #12: claimed by @alice, blocked by #9; premature.\n" +
        "Commented on #12.\n",
    );
    expect(JSON.stringify(received[1]?.body)).toContain("blockedBy");
  });
});
