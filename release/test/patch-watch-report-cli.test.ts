import { describe, expect, it } from "vitest";
import { main } from "../src/cli/patch-watch-report.js";
import { tagLinks } from "../src/jass-history.js";
import { renderIssue, renderPullRequest } from "../src/patch-watch-report.js";
import { LIVE_24268 } from "./support/jass-history.js";
import { tempDir, writeText } from "./support/workspace.js";

const COMMIT = "a392fc3d5e6c37980accbfc560b28387fc7d01bc";

/** What `patch-watch:plan --json --simulate-current-patch 3.0.0.24267` prints. */
const PLAN = {
  supported: "3.0.0.24267",
  simulated: true,
  vendored: [],
  reported: [],
  tags: 128,
  patch: {
    build: "3.0.0.24268",
    gameVersion: "3.0.0",
    tag: LIVE_24268,
    commit: COMMIT,
    links: tagLinks({ name: LIVE_24268, commit: COMMIT }),
  },
  superseded: [],
  ignored: [],
};

const STDOUT = `Vendored ${LIVE_24268}: Patch 3.0.0.24268 at commit ${COMMIT}, unchanged.\nGenerated 6 files for Patch 3.0.0.24268.\n`;

/** A folder holding the plan and a generator run, as the workflow saves them. */
async function files(plan: unknown = PLAN): Promise<string> {
  const cwd = await tempDir("patch-watch-report");
  await writeText(cwd, "plan.json", JSON.stringify(plan));
  await writeText(cwd, "generate.stdout", STDOUT);
  await writeText(cwd, "generate.stderr", "");
  return cwd;
}

async function runCli(args: string[], cwd: string) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    { cwd },
  );
  return { status, stdout, stderr };
}

const RUN_URL = "https://github.com/phmilk/reforged-ts/actions/runs/7";

const PULL_REQUEST = [
  "pull-request",
  "--plan",
  "plan.json",
  "--stdout",
  "generate.stdout",
  "--stderr",
  "generate.stderr",
  "--exit-code",
  "0",
];

describe("patch-watch:report", () => {
  it("prints the issue as JSON", async () => {
    const result = await runCli(
      ["issue", "--plan", "plan.json", "--run-url", RUN_URL],
      await files(),
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toEqual(
      renderIssue({ plan: { ...PLAN, superseded: [] }, runUrl: RUN_URL }),
    );
  });

  it("prints the pull request of the generator run", async () => {
    const result = await runCli(
      [...PULL_REQUEST, "--issue", "12", "--run-url", RUN_URL],
      await files(),
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toEqual(
      renderPullRequest({
        plan: { ...PLAN, superseded: [] },
        issue: 12,
        run: { stdout: STDOUT, stderr: "", exitCode: 0 },
        runUrl: RUN_URL,
      }),
    );
  });

  it("prints a pull request without an issue for a dry run", async () => {
    const result = await runCli(PULL_REQUEST, await files());

    expect(result.status).toBe(0);
    expect(
      (JSON.parse(result.stdout) as { body: string }).body.split("\n")[0],
    ).toBe("Closes the issue the Patch watch opens.");
  });

  it("fails on a plan without a new Patch", async () => {
    const result = await runCli(
      ["issue", "--plan", "plan.json"],
      await files({ ...PLAN, patch: null }),
    );

    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: "The plan has no new Patch to report.\n",
    });
  });

  it("fails on a file it cannot read", async () => {
    const result = await runCli(
      ["issue", "--plan", "none.json"],
      await files(),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("none.json");
  });

  it.each([
    [[]],
    [["comment", "--plan", "plan.json"]],
    [["issue"]],
    [["issue", "--plan"]],
    [["issue", "--plan", "plan.json", "--plan", "plan.json"]],
    [["issue", "--plan", "plan.json", "--issue", "12"]],
    [PULL_REQUEST.slice(0, -2)],
    [[...PULL_REQUEST.slice(0, -1), "one"]],
    [[...PULL_REQUEST, "--issue", "#12"]],
  ])("rejects the arguments %j", async (args) => {
    const result = await runCli(args, await files());

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Usage: patch-watch:report issue");
  });
});
