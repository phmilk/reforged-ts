import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { repositoryRoot } from "../src/workspace.js";
import { tempDir } from "./support/workspace.js";

const SCRIPT = join(repositoryRoot, "release", "src", "spec-frontier.ts");
const LIBRARY = "phmilk/reforged-ts";
const TEMPLATE = "phmilk/reforged-ts-template";
const USAGE = "Usage: node release/src/spec-frontier.ts <spec> [owner/name]\n";

interface Received {
  authorization: string | undefined;
  body: unknown;
}

/** An answer of the stub API: a status and a JSON body. */
interface Answer {
  status: number;
  body: unknown;
}

/**
 * A stub of GitHub's GraphQL endpoint on the loopback interface, which the
 * script reaches through `GITHUB_API_URL`: it answers `answer` to every
 * request and records each one in `received`.
 */
let server: Server;
let base = "";
let received: Received[] = [];
let answer: Answer = { status: 500, body: null };

beforeAll(async () => {
  server = createServer((request, response) => {
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      text += chunk;
    });
    request.on("end", () => {
      received.push({
        authorization: request.headers.authorization,
        body: text === "" ? undefined : JSON.parse(text),
      });
      response.writeHead(
        request.method === "POST" && request.url === "/graphql"
          ? answer.status
          : 404,
        { "content-type": "application/json" },
      );
      response.end(JSON.stringify(answer.body));
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
  answer = { status: 500, body: null };
});

/**
 * Runs the script as the hook does, `node release/src/spec-frontier.ts
 * <args>`, in a folder outside the repository, with a token in `GH_TOKEN`;
 * resolves with its exit code and its output.
 */
async function run(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>> = {},
) {
  const dir = await tempDir("spec-frontier");
  const overrides: Record<string, string | undefined> = {
    GH_TOKEN: "t0k",
    GITHUB_TOKEN: "",
    GITHUB_API_URL: base,
    ...env,
  };
  // Windows spells it Path: an override drops every spelling of its name.
  const kept = Object.entries(process.env).filter(
    ([name]) =>
      !Object.keys(overrides).some(
        (override) => override.toUpperCase() === name.toUpperCase(),
      ),
  );
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT, ...args], {
        cwd: dir,
        env: { ...Object.fromEntries(kept), ...overrides },
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
    },
  );
}

/** A Ticket node as GitHub answers it: open, no assignee, blocker or pull request. */
function ticketNode(
  number: number,
  {
    repository = LIBRARY,
    state = "OPEN",
    assignees = [] as string[],
    blockers = [] as { repository: string; number: number; state: string }[],
    pullRequests = [] as {
      repository: string;
      number: number;
      state: string;
    }[],
  } = {},
): unknown {
  return {
    number,
    title: `Ticket ${String(number)}`,
    state,
    repository: { nameWithOwner: repository },
    assignees: { nodes: assignees.map((login) => ({ login })) },
    blockedBy: {
      totalCount: blockers.length,
      nodes: blockers.map((blocker) => ({
        number: blocker.number,
        state: blocker.state,
        repository: { nameWithOwner: blocker.repository },
      })),
    },
    closedByPullRequestsReferences: {
      nodes: pullRequests.map((pullRequest) => ({
        number: pullRequest.number,
        state: pullRequest.state,
        repository: { nameWithOwner: pullRequest.repository },
      })),
    },
  };
}

/** The `data` GitHub answers for Spec #10, read by `viewer`, with `tickets`. */
function specData(
  tickets: unknown[],
  { viewer = "alice", labels = ["enhancement", "spec"] } = {},
): Answer {
  return {
    status: 200,
    body: {
      data: {
        viewer: { login: viewer },
        repository: {
          issue: {
            number: 10,
            title: "The Spec",
            state: "OPEN",
            labels: { nodes: labels.map((name) => ({ name })) },
            subIssues: { totalCount: tickets.length, nodes: tickets },
          },
        },
      },
    },
  };
}

/** The variables of the one query the script sent. */
function variables(): unknown {
  expect(received).toHaveLength(1);
  const [{ body }] = received;
  return typeof body === "object" && body !== null && "variables" in body
    ? body.variables
    : undefined;
}

describe("spec-frontier", () => {
  it("prints the three lists for the token's login and exits 0, under node with no install", async () => {
    answer = specData([
      ticketNode(11),
      ticketNode(12, {
        assignees: ["alice"],
        pullRequests: [
          { repository: LIBRARY, number: 40, state: "OPEN" },
          { repository: LIBRARY, number: 39, state: "MERGED" },
        ],
      }),
      ticketNode(13, { assignees: ["bob"] }),
      ticketNode(14, {
        blockers: [{ repository: LIBRARY, number: 11, state: "OPEN" }],
      }),
      ticketNode(117, { repository: TEMPLATE }),
      ticketNode(118, { repository: TEMPLATE, assignees: ["alice"] }),
      ticketNode(15, { state: "CLOSED" }),
    ]);

    const result = await run(["10"]);

    expect(result).toEqual({
      code: 0,
      stdout:
        `Spec #10 of ${LIBRARY}, "The Spec", for @alice.\n` +
        "\n" +
        "Takeable now (open, no open blocker, no assignee but @alice):\n" +
        "- #11 Ticket 11\n" +
        "- #12 Ticket 12 (held by @alice)\n" +
        `- ${TEMPLATE}#117 Ticket 117\n` +
        `- ${TEMPLATE}#118 Ticket 118 (held by @alice)\n` +
        "\n" +
        "Held by @alice:\n" +
        "- #12 Ticket 12: pull request #40\n" +
        `- ${TEMPLATE}#118 Ticket 118: no open pull request\n` +
        "\n" +
        "Held by other logins:\n" +
        "- #13 Ticket 13: @bob\n",
      stderr: "",
    });
    expect(received[0]?.authorization).toBe("Bearer t0k");
    expect(variables()).toEqual({
      owner: "phmilk",
      name: "reforged-ts",
      number: 10,
    });
  });

  it("reads a Spec of the Template when the repository is given, and says when a list is empty", async () => {
    answer = specData(
      [ticketNode(5, { repository: TEMPLATE, assignees: ["bob"] })],
      {
        viewer: "carol",
      },
    );

    const result = await run(["#10", TEMPLATE]);

    expect(result).toEqual({
      code: 0,
      stdout:
        `Spec #10 of ${TEMPLATE}, "The Spec", for @carol.\n` +
        "\n" +
        "Takeable now (open, no open blocker, no assignee but @carol):\n" +
        "- none\n" +
        "\n" +
        "Held by @carol:\n" +
        "- none\n" +
        "\n" +
        "Held by other logins:\n" +
        "- #5 Ticket 5: @bob\n",
      stderr: "",
    });
    expect(variables()).toEqual({
      owner: "phmilk",
      name: "reforged-ts-template",
      number: 10,
    });
  });

  it("says when the Spec has no Ticket yet", async () => {
    answer = specData([]);

    const result = await run(["10"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "#10 has no Ticket: it is not split yet.\n",
    );
  });

  it.each([
    ["no argument", []],
    ["a spec that is not a number", ["ten"]],
    ["a repository not named owner/name", ["10", "reforged-ts"]],
    ["one argument too many", ["10", TEMPLATE, "extra"]],
  ])("exits 2 on %s, with the usage and no request", async (_, args) => {
    const result = await run(args);

    expect(result).toEqual({ code: 2, stdout: "", stderr: USAGE });
    expect(received).toEqual([]);
  });

  it("exits 1 when GitHub answers an error", async () => {
    answer = {
      status: 200,
      body: {
        data: null,
        errors: [
          { message: "Could not resolve to an Issue with the number of 10." },
        ],
      },
    };

    const result = await run(["10"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr:
        "POST /graphql answered: Could not resolve to an Issue with the number of 10.\n",
    });
  });

  it("exits 1 when GitHub answers an error status", async () => {
    answer = { status: 502, body: { message: "Bad Gateway" } };

    const result = await run(["10"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "POST /graphql answered 502 Bad Gateway.\n",
    });
  });

  it("exits 1 on an issue that is not a Spec", async () => {
    answer = specData([ticketNode(11)], { labels: ["ticket"] });

    const result = await run(["10"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `${LIBRARY}#10 is not a Spec: it is not labelled spec.\n`,
    });
  });

  it("exits 1 when a Ticket has more blockers than the query read", async () => {
    const node = ticketNode(11, {
      blockers: [{ repository: LIBRARY, number: 9, state: "CLOSED" }],
    });
    answer = specData([
      { ...(node as object), blockedBy: { totalCount: 51, nodes: [] } },
    ]);

    const result = await run(["10"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toBe(
      "#11 is blocked by 51 issues, more than the 0 read: the query cannot say whether one is open.\n",
    );
  });

  describe("--json", () => {
    /** The Spec of the first test: a Ticket in each list, one in two. */
    function tickets(): unknown[] {
      return [
        ticketNode(11),
        ticketNode(12, {
          assignees: ["alice", "dave"],
          pullRequests: [
            { repository: LIBRARY, number: 40, state: "OPEN" },
            { repository: TEMPLATE, number: 7, state: "OPEN" },
            { repository: LIBRARY, number: 39, state: "MERGED" },
          ],
        }),
        ticketNode(13, { assignees: ["bob"] }),
        ticketNode(14, {
          blockers: [{ repository: LIBRARY, number: 11, state: "OPEN" }],
        }),
        ticketNode(117, { repository: TEMPLATE, assignees: ["alice"] }),
        ticketNode(15, { state: "CLOSED" }),
      ];
    }

    /** The JSON object `--json` prints for `tickets()`, for @alice. */
    const OBJECT = {
      spec: { repository: LIBRARY, number: 10, title: "The Spec" },
      login: "alice",
      takeable: [
        {
          repository: LIBRARY,
          number: 11,
          title: "Ticket 11",
          assignees: [],
          pullRequests: [],
        },
        {
          repository: TEMPLATE,
          number: 117,
          title: "Ticket 117",
          assignees: ["alice"],
          pullRequests: [],
        },
      ],
      held: [
        {
          repository: LIBRARY,
          number: 12,
          title: "Ticket 12",
          assignees: ["alice", "dave"],
          pullRequests: [
            { repository: LIBRARY, number: 40 },
            { repository: TEMPLATE, number: 7 },
          ],
        },
        {
          repository: TEMPLATE,
          number: 117,
          title: "Ticket 117",
          assignees: ["alice"],
          pullRequests: [],
        },
      ],
      heldByOthers: [
        {
          repository: LIBRARY,
          number: 13,
          title: "Ticket 13",
          assignees: ["bob"],
          pullRequests: [],
        },
      ],
    };

    it("prints the answer as one JSON object and a final newline, and exits 0", async () => {
      answer = specData(tickets());

      const result = await run(["10", "--json"]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout.endsWith("}\n")).toBe(true);
      expect(JSON.parse(result.stdout)).toEqual(OBJECT);
      expect(Object.keys(JSON.parse(result.stdout) as object)).toEqual([
        "spec",
        "login",
        "takeable",
        "held",
        "heldByOthers",
      ]);
    });

    it.each([
      ["before the Spec", ["--json", "10"]],
      ["between the Spec and its repository", ["10", "--json", LIBRARY]],
      ["after the repository", ["#10", LIBRARY, "--json"]],
    ])("takes the flag %s", async (_, args) => {
      answer = specData(tickets());

      const result = await run(args);

      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(OBJECT);
      expect(variables()).toEqual({
        owner: "phmilk",
        name: "reforged-ts",
        number: 10,
      });
    });

    it("prints empty lists for a Spec with no Ticket", async () => {
      answer = specData([]);

      const result = await run(["10", "--json"]);

      expect(result).toEqual({
        code: 0,
        stdout: `${JSON.stringify(
          {
            spec: { repository: LIBRARY, number: 10, title: "The Spec" },
            login: "alice",
            takeable: [],
            held: [],
            heldByOthers: [],
          },
          null,
          2,
        )}\n`,
        stderr: "",
      });
    });

    it("keeps errors as text on stderr, exit 1 and nothing on stdout", async () => {
      answer = specData([ticketNode(11)], { labels: ["ticket"] });

      const result = await run(["--json", "10"]);

      expect(result).toEqual({
        code: 1,
        stdout: "",
        stderr: `${LIBRARY}#10 is not a Spec: it is not labelled spec.\n`,
      });
    });

    it.each([
      ["an unknown flag", ["10", "--jsno"]],
      ["an unknown flag with --json", ["--json", "-v", "10"]],
      ["--json alone", ["--json"]],
      ["one argument too many beside --json", ["10", TEMPLATE, "x", "--json"]],
    ])("exits 2 on %s, with the usage and no request", async (_, args) => {
      const result = await run(args);

      expect(result).toEqual({ code: 2, stdout: "", stderr: USAGE });
      expect(received).toEqual([]);
    });

    it("leaves the text output unchanged without the flag", async () => {
      answer = specData(tickets());

      const result = await run(["10"]);

      expect(result).toEqual({
        code: 0,
        stdout:
          `Spec #10 of ${LIBRARY}, "The Spec", for @alice.\n` +
          "\n" +
          "Takeable now (open, no open blocker, no assignee but @alice):\n" +
          "- #11 Ticket 11\n" +
          `- ${TEMPLATE}#117 Ticket 117 (held by @alice)\n` +
          "\n" +
          "Held by @alice:\n" +
          `- #12 Ticket 12: pull request #40, pull request ${TEMPLATE}#7\n` +
          `- ${TEMPLATE}#117 Ticket 117: no open pull request\n` +
          "\n" +
          "Held by other logins:\n" +
          "- #13 Ticket 13: @bob\n",
        stderr: "",
      });
    });
  });

  it("exits 1 with no token and no gh to ask one of", async () => {
    const result = await run(["10"], {
      GH_TOKEN: "",
      GITHUB_TOKEN: "",
      PATH: await tempDir("spec-frontier-path"),
    });

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr:
        "gh auth token (the token of the gh login, since GH_TOKEN and GITHUB_TOKEN are not set) failed: gh is not installed (https://cli.github.com)\n",
    });
    expect(received).toEqual([]);
  });
});
