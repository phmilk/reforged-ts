import { describe, expect, it } from "vitest";
import { main, type Context, type Gh } from "../src/cli/repo-settings.js";
import { LABELS, MERGE_SETTINGS, readRuleset } from "../src/repo-settings.js";
import { repositoryRoot } from "../src/workspace.js";

const API = "https://api.github.com";

interface Sent {
  method: string;
  url: string;
  authorization: string | null;
  body: unknown;
}

/**
 * A GitHub API that answers the `GET`s from `answers` (path and query →
 * status and body; 404 otherwise) and every other method with 200, recording
 * what it receives.
 */
function gitHub(
  answers: Record<string, { status?: number; body: unknown }>,
  sent: Sent[] = [],
  failing: string | null = null,
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const text = await request.text();
    sent.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.get("authorization"),
      body: text === "" ? undefined : (JSON.parse(text) as unknown),
    });
    const path = request.url.slice(API.length);
    if (request.method !== "GET") {
      return failing === `${request.method} ${path}`
        ? Response.json({ message: "Resource not accessible" }, { status: 403 })
        : Response.json({}, { status: 200 });
    }
    const answer = answers[path] as
      { status?: number; body: unknown } | undefined;
    return answer === undefined
      ? Response.json({ message: "Not Found" }, { status: 404 })
      : Response.json(answer.body, { status: answer.status ?? 200 });
  };
}

/** A repository the script already configured, but for its ruleset id 42. */
function configured(admin = true) {
  return {
    "/repos/owner/fork": {
      body: { ...MERGE_SETTINGS, permissions: { admin, push: true } },
    },
    "/repos/owner/fork/rulesets?includes_parents=false&per_page=100": {
      body: [{ id: 42, name: "master", source_type: "Repository" }],
    },
    "/repos/owner/fork/pages": { body: { build_type: "workflow" } },
    "/repos/owner/fork/labels?per_page=100&page=1": {
      body: LABELS.map(({ name, color, description }) => ({
        name,
        color,
        description,
      })),
    },
  };
}

const gh: Gh = (args) =>
  Promise.resolve(
    args[0] === "auth" ? "t0k\n" : args[0] === "repo" ? "owner/fork\n" : "",
  );

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
    { root: repositoryRoot, gh, fetcher, ...context },
  );
  return code.then((exitCode) => ({ exitCode, stdout, stderr }));
}

describe("repo:settings", () => {
  it("prints the plan and sends nothing on a dry run", async () => {
    const sent: Sent[] = [];
    const result = await run(["--dry-run"], gitHub(configured(), sent));

    expect(result.exitCode).toBe(0);
    expect(sent.every(({ method }) => method === "GET")).toBe(true);
    expect(sent[0]?.authorization).toBe("Bearer t0k");
    expect(result.stdout).toContain("Dry run, 1 request, none sent:");
    expect(result.stdout).toContain(
      'Update the ruleset "master" (id 42).\nPUT /repos/owner/fork/rulesets/42\n',
    );
    expect(result.stdout).toContain(
      "Already set: Pages source: GitHub Actions.",
    );
  });

  it("sends the planned requests in order", async () => {
    const sent: Sent[] = [];
    const answers = {
      ...configured(),
      "/repos/owner/fork/pages": { status: 404, body: {} },
      "/repos/owner/fork/rulesets?includes_parents=false&per_page=100": {
        body: [],
      },
    };
    const result = await run([], gitHub(answers, sent));

    expect(result.exitCode).toBe(0);
    expect(
      sent
        .filter(({ method }) => method !== "GET")
        .map(({ method, url, body }) => [method, url.slice(API.length), body]),
    ).toEqual([
      ["POST", "/repos/owner/fork/rulesets", await readRuleset(repositoryRoot)],
      ["POST", "/repos/owner/fork/pages", { build_type: "workflow" }],
    ]);
    expect(result.stdout).toContain(
      "Done: Turn Pages on with the GitHub Actions source.\n",
    );
  });

  it("targets the repository of --repo", async () => {
    const sent: Sent[] = [];
    const answers = Object.fromEntries(
      Object.entries(configured()).map(([path, answer]) => [
        path.replace("owner/fork", "other/repo"),
        answer,
      ]),
    );
    const noRepo: Gh = (args) =>
      args[0] === "auth"
        ? Promise.resolve("t0k")
        : Promise.reject(new Error("no git remote"));

    const result = await run(
      ["--dry-run", "--repo", "other/repo"],
      gitHub(answers, sent),
      { gh: noRepo },
    );

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("PUT /repos/other/repo/rulesets/42");
  });

  it("stops before any change without administrator rights", async () => {
    const sent: Sent[] = [];
    const result = await run([], gitHub(configured(false), sent));

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "The gh authentication has no administrator rights on owner/fork",
    );
    expect(sent.map(({ method }) => method)).toEqual(["GET"]);
  });

  it("stops at the first failed request, naming it", async () => {
    const sent: Sent[] = [];
    const answers = {
      ...configured(),
      "/repos/owner/fork/pages": { status: 404, body: {} },
    };
    const result = await run(
      [],
      gitHub(answers, sent, "PUT /repos/owner/fork/rulesets/42"),
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      "PUT /repos/owner/fork/rulesets/42 answered 403 Resource not accessible. " +
        'Not done: Update the ruleset "master" (id 42).\n',
    );
    expect(sent.filter(({ method }) => method !== "GET")).toHaveLength(1);
  });

  it("names gh when it has no authentication", async () => {
    const noAuth: Gh = (args) =>
      args[0] === "auth"
        ? Promise.reject(new Error("not logged in"))
        : Promise.resolve("owner/fork");

    const result = await run(["--dry-run"], gitHub(configured()), {
      gh: noAuth,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("gh auth token");
    expect(result.stderr).toContain("gh auth login");
  });

  it("reads every page of labels", async () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      name: `label-${String(i)}`,
      color: "000000",
      description: null,
    }));
    const answers = {
      ...configured(),
      "/repos/owner/fork/labels?per_page=100&page=1": { body: many },
      "/repos/owner/fork/labels?per_page=100&page=2": {
        body: configured()["/repos/owner/fork/labels?per_page=100&page=1"].body,
      },
    };
    const result = await run(["--dry-run"], gitHub(answers));

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Dry run, 1 request, none sent:");
  });

  it.each([
    [["--repo"]],
    [["--repo", "not-a-repository"]],
    [["--repo", "a/b", "--repo", "c/d"]],
    [["--apply"]],
  ])("rejects the arguments %j", async (args) => {
    const result = await run(args, gitHub({}));

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Usage: repo:settings");
  });
});
