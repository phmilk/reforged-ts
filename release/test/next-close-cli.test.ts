import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { repositoryRoot } from "../src/workspace.js";
import { tempDir, writeText } from "./support/workspace.js";

const SCRIPT = join(repositoryRoot, "release", "src", "next-close.ts");
const REPOSITORY = "owner/fork";
const SHA = "a".repeat(40);
const PULLS = `GET /repos/${REPOSITORY}/pulls?state=closed&base=next&sort=updated&direction=desc&per_page=100`;
const issue = (number: number) =>
  `GET /repos/${REPOSITORY}/issues/${String(number)}`;

/** An answer of the stub API: a status and a JSON body. */
interface Answer {
  status: number;
  body?: unknown;
}

/**
 * A stub of the GitHub API on the loopback interface, which the script
 * reaches through `GITHUB_API_URL`: it answers from `answers` by
 * `METHOD /path?query`, 404 otherwise, and records every request.
 */
let server: Server;
let base = "";
let received: { request: string; authorization: string | undefined }[] = [];
let answers: Record<string, Answer> = {};

beforeAll(async () => {
  server = createServer((request, response) => {
    const key = `${request.method ?? ""} ${request.url ?? ""}`;
    received.push({
      request: key,
      authorization: request.headers.authorization,
    });
    const { status, body } = answers[key] ?? {
      status: 404,
      body: { message: "Not Found" },
    };
    response.writeHead(status, { "content-type": "application/json" });
    response.end(body === undefined ? undefined : JSON.stringify(body));
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
  answers = {};
});

/**
 * Runs the script as the workflow does, `node release/src/next-close.ts`,
 * in a folder outside the repository, with a job summary file and a step
 * outputs file; resolves with its exit code, its output, the summary and
 * the outputs written.
 */
async function run(env: Readonly<Record<string, string | undefined>> = {}) {
  const dir = await tempDir("next-close");
  await writeText(dir, "summary.md", "");
  await writeText(dir, "output.txt", "");
  const result = await new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT], {
      cwd: dir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "t0k",
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_SHA: SHA,
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

/** A pull request into next as the pulls listing answers it. */
const pull = (number: number, merged: string | null, body: string | null) => ({
  number,
  merged_at: merged === null ? null : "2026-11-27T12:00:00Z",
  merge_commit_sha: merged,
  body,
});

describe("next-close", () => {
  it("finds the pull request the push merged and outputs the open issues of this repository its closing keywords name", async () => {
    answers[PULLS] = {
      status: 200,
      body: [
        // Closed unmerged: its test merge commit is no merge.
        { ...pull(41, SHA, "Closes #99"), merged_at: null },
        pull(
          40,
          SHA,
          "Closes #12, closes #13, fixes #14, resolves #15, closes owner/other#5 and `closes #16`.",
        ),
        pull(39, "b".repeat(40), "Closes #98"),
      ],
    };
    answers[issue(12)] = { status: 200, body: { number: 12, state: "open" } };
    answers[issue(13)] = { status: 200, body: { number: 13, state: "closed" } };
    answers[issue(14)] = {
      status: 200,
      body: { number: 14, state: "open", pull_request: { url: "x" } },
    };
    answers[issue(15)] = { status: 200, body: { number: 15, state: "open" } };

    const result = await run();

    const lines =
      "- #40 merged into next as " +
      SHA +
      ".\n" +
      "- #12: open; to close.\n" +
      "- #13: already closed.\n" +
      "- #14: a pull request; it closes nothing.\n" +
      "- #15: open; to close.\n" +
      "- owner/other#5: an issue of another repository; close it by hand.\n";
    expect(result).toEqual({
      code: 0,
      stdout: lines,
      stderr: "",
      summary: `## Issues to close\n\n${lines}`,
      output: "pull-request=40\nissues=12 15\n",
    });
    expect(received.map(({ request }) => request)).toEqual([
      PULLS,
      issue(12),
      issue(13),
      issue(14),
      issue(15),
    ]);
    expect(received[0]?.authorization).toBe("Bearer t0k");
  });

  it("outputs no issue when the push merged no pull request", async () => {
    answers[PULLS] = {
      status: 200,
      body: [pull(39, "b".repeat(40), "Closes #98")],
    };

    const result = await run();

    expect(result).toMatchObject({
      code: 0,
      stdout: `- ${SHA} merged no pull request into next: nothing to close.\n`,
      output: "pull-request=\nissues=\n",
    });
    expect(received.map(({ request }) => request)).toEqual([PULLS]);
  });

  it("outputs no issue for a pull request whose body names none, and skips one GitHub no longer has", async () => {
    answers[PULLS] = { status: 200, body: [pull(40, SHA, "Fixes #77")] };

    const result = await run();

    expect(result).toMatchObject({
      code: 0,
      stdout:
        `- #40 merged into next as ${SHA}.\n` +
        "- #77: no such issue; skipped.\n",
      output: "pull-request=40\nissues=\n",
    });
  });

  it("exits 1 naming the answer it could not read, in the summary too", async () => {
    answers[PULLS] = { status: 500, body: { message: "Server Error" } };

    const result = await run();

    const message = `${PULLS} answered 500 Server Error.`;
    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `${message}\n`,
      summary: `## Issues to close\n\n- ${message}\n`,
      output: "",
    });
  });

  it("exits 1 naming the missing variable, before any request", async () => {
    const result = await run({ GITHUB_SHA: "" });

    expect(result).toMatchObject({
      code: 1,
      stderr: "GITHUB_SHA is not set.\n",
    });
    expect(received).toEqual([]);
  });
});
