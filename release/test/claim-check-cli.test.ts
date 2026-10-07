import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MARKER } from "../src/claim-check.js";
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

/** The closing references of #34: #12 of this repository, #5 of the other; `totalCount` as GitHub counts them. */
function closing(assignees: string[], totalCount = 2): unknown {
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
