import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { repositoryRoot } from "../src/workspace.js";
import { tempDir } from "./support/workspace.js";

const SCRIPT = join(
  repositoryRoot,
  "release",
  "src",
  "closing-pull-requests.ts",
);
const LIBRARY = "phmilk/reforged-ts";
const MERGE = "d".repeat(40);
const USAGE =
  "Usage: node release/src/closing-pull-requests.ts <owner/name>#<n> [--json]\n";

/** An answer of the stub API: a status and a JSON body. */
interface Answer {
  status: number;
  body: unknown;
}

/**
 * A stub of GitHub's GraphQL endpoint on the loopback interface, which the
 * script reaches through `GITHUB_API_URL`: it answers each operation from
 * `answers` by its name, 404 otherwise, and records the authorization.
 */
let server: Server;
let base = "";
let authorizations: (string | undefined)[] = [];
let answers: Record<string, Answer> = {};

beforeAll(async () => {
  server = createServer((request, response) => {
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      text += chunk;
    });
    request.on("end", () => {
      authorizations.push(request.headers.authorization);
      const query =
        text === ""
          ? ""
          : String((JSON.parse(text) as { query: unknown }).query);
      const operation = /^\s*query\s+(\w+)/.exec(query)?.[1] ?? "";
      const { status, body } =
        request.method === "POST" && request.url === "/graphql"
          ? (answers[operation] ?? {
              status: 404,
              body: { message: "Not Found" },
            })
          : { status: 404, body: { message: "Not Found" } };
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
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
  authorizations = [];
  answers = {};
});

/**
 * Runs the script as `pnpm closing-pull-requests` does, `node
 * release/src/closing-pull-requests.ts <args>`, in a folder outside the
 * repository, with a token in `GH_TOKEN`; resolves with its exit code and
 * its output.
 */
async function run(args: readonly string[]) {
  const dir = await tempDir("closing-pull-requests");
  const overrides: Record<string, string> = {
    GH_TOKEN: "t0k",
    GITHUB_TOKEN: "",
    GITHUB_API_URL: base,
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

/** A pull request node as GitHub's GraphQL API answers it. */
function pullNode(
  number: number,
  baseRefName: string,
  state: "OPEN" | "MERGED",
  { isDraft = false, body = "" } = {},
): unknown {
  return {
    number,
    state,
    isDraft,
    baseRefName,
    body,
    mergeCommit: state === "MERGED" ? { oid: MERGE } : null,
    repository: { nameWithOwner: LIBRARY },
  };
}

/** One page holding `nodes`, the last. */
const onePage = (nodes: unknown[]) => ({
  pageInfo: { hasNextPage: false, endCursor: null },
  nodes,
});

/**
 * Issue #5 of the library with a branch `next`: a merged pull request into
 * `master` GitHub links to it, an open draft into `next` and a merged one
 * into `next` whose keywords name it.
 */
function issueFive(): void {
  answers = {
    ClosingPullRequests: {
      status: 200,
      body: {
        data: {
          repository: {
            ref: { name: "next" },
            issue: {
              closedByPullRequestsReferences: {
                totalCount: 1,
                nodes: [pullNode(20, "master", "MERGED")],
              },
            },
          },
        },
      },
    },
    OpenPullRequestsIntoNext: {
      status: 200,
      body: {
        data: {
          repository: {
            pullRequests: onePage([
              pullNode(41, "next", "OPEN", {
                isDraft: true,
                body: "Closes #5",
              }),
            ]),
          },
        },
      },
    },
    MergedPullRequestsIntoNext: {
      status: 200,
      body: {
        data: {
          search: onePage([
            pullNode(42, "next", "MERGED", { body: "Fixes #5" }),
          ]),
        },
      },
    },
  };
}

describe("closing-pull-requests", () => {
  it("prints the issue and its open and merged Closing pull requests as one JSON object with --json, under node with no install", async () => {
    issueFive();

    const result = await run([`${LIBRARY}#5`, "--json"]);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      issue: { repository: LIBRARY, number: 5 },
      pullRequests: [
        {
          repository: LIBRARY,
          number: 20,
          base: "master",
          state: "merged",
          draft: false,
          mergeCommit: MERGE,
        },
        {
          repository: LIBRARY,
          number: 41,
          base: "next",
          state: "open",
          draft: true,
          mergeCommit: null,
        },
        {
          repository: LIBRARY,
          number: 42,
          base: "next",
          state: "merged",
          draft: false,
          mergeCommit: MERGE,
        },
      ],
    });
    expect(result.stdout.endsWith("}\n")).toBe(true);
    expect(authorizations).not.toHaveLength(0);
    expect(new Set(authorizations)).toEqual(new Set(["Bearer t0k"]));
  });

  it("prints them as text without --json", async () => {
    issueFive();

    const result = await run([`${LIBRARY}#5`]);

    expect(result).toEqual({
      code: 0,
      stdout:
        `Closing pull requests of ${LIBRARY}#5, open and merged:\n` +
        `- #20 into master, merged as ${MERGE}\n` +
        "- #41 into next, open, a draft\n" +
        `- #42 into next, merged as ${MERGE}\n`,
      stderr: "",
    });
  });

  it.each([
    ["no argument", []],
    ["an issue with no repository", ["#5", "--json"]],
    ["a number alone", ["5"]],
    ["another flag", [`${LIBRARY}#5`, "--yaml"]],
    ["one argument too many", [`${LIBRARY}#5`, `${LIBRARY}#6`]],
  ])(
    "exits 2 on %s, with the usage, nothing on stdout and no request",
    async (_, args) => {
      const result = await run(args);

      expect(result).toEqual({ code: 2, stdout: "", stderr: USAGE });
      expect(authorizations).toEqual([]);
    },
  );

  it("exits 1 with nothing on stdout and GitHub's error on stderr", async () => {
    answers = {
      ClosingPullRequests: {
        status: 200,
        body: {
          data: null,
          errors: [
            { message: "Could not resolve to an Issue with the number of 5." },
          ],
        },
      },
    };

    const result = await run([`${LIBRARY}#5`, "--json"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr:
        "ClosingPullRequests answered: Could not resolve to an Issue with the number of 5.\n",
    });
  });

  it("exits 1 with nothing on stdout when a later read fails, so no partial answer is printed", async () => {
    issueFive();
    answers.MergedPullRequestsIntoNext = {
      status: 502,
      body: { message: "Bad Gateway" },
    };

    const result = await run([`${LIBRARY}#5`, "--json"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "MergedPullRequestsIntoNext answered 502 Bad Gateway.\n",
    });
  });
});
