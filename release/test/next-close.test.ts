import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ENVIRONMENT } from "../src/github-app.js";
import { gitBash } from "./support/bash.js";
import { readWorkflow, type Step } from "./support/workflows.js";
import { tempDir, writeText } from "./support/workspace.js";

const FILE = "next-close.yml";

const jobsOf = async () => (await readWorkflow(FILE)).workflow.jobs;

async function stepOf(job: string, id: string): Promise<Step> {
  const step = (await jobsOf())[job]?.steps?.find((each) => each.id === id);
  if (step === undefined) throw new Error(`No step ${id} in ${FILE}, ${job}`);
  return step;
}

describe("next-close.yml", () => {
  it("runs on each push to next, the one branch a delivered Ticket's keywords do not close on", async () => {
    const { workflow } = await readWorkflow(FILE);
    expect(workflow.on).toEqual({ push: { branches: ["next"] } });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(Object.keys(workflow.jobs)).toEqual(["find", "close"]);
  });

  it("finds the issues without the App, by the script that reads closing keywords, and closes only when there is one", async () => {
    const { find, close } = await jobsOf();
    expect(find?.environment).toBeUndefined();
    expect(JSON.stringify(find)).not.toContain("secrets.");
    expect(JSON.stringify(find)).not.toContain("app-token");
    const step = await stepOf("find", "find");
    expect(step.run).toBe("node release/src/next-close.ts");
    expect(step.env).toEqual({ GITHUB_TOKEN: "${{ github.token }}" });
    expect(close?.needs).toBe("find");
    expect(close?.if).toBe("needs.find.outputs.issues != ''");
  });

  it("holds the App in the environment app, its key passed by name, with issues write alone, and runs none of the checkout's code", async () => {
    const { close } = await jobsOf();
    expect(close?.environment).toBe(APP_ENVIRONMENT);
    expect(close?.permissions).toEqual({ contents: "read" });
    const tokens = (close?.steps ?? []).filter(
      (step) => step.uses === "./.github/actions/app-token",
    );
    expect(tokens.map((step) => step.with)).toEqual([
      {
        "client-id": "${{ vars.APP_CLIENT_ID }}",
        "private-key": "${{ secrets.APP_PRIVATE_KEY }}",
        "permission-contents": "read",
        "permission-issues": "write",
      },
    ]);
    for (const step of close?.steps ?? []) {
      expect(step.uses ?? "").not.toBe("./.github/actions/setup-workspace");
      expect(step.run ?? "").not.toContain("node ");
      expect(step.run ?? "").not.toContain("pnpm");
    }
    const step = await stepOf("close", "close");
    expect(step.env).toEqual({
      GH_TOKEN: "${{ steps.app.outputs.token }}",
      PULL_REQUEST: "${{ needs.find.outputs.pull-request }}",
      ISSUES: "${{ needs.find.outputs.issues }}",
    });
  });
});

const bash = gitBash();
const slashed = (path: string) => path.replaceAll("\\", "/");

describe("the close step of next-close.yml", () => {
  /**
   * The step's script run with `issues`, `gh` a shell function in front of
   * it that logs each call's arguments and fails on issue `failing`;
   * resolves with its exit code, the calls and the job summary.
   */
  async function close(issues: string, failing = "") {
    const root = await tempDir("next-close");
    const log = join(root, "gh.log");
    const summary = join(root, "summary.md");
    await writeText(root, "gh.log", "");
    await writeText(root, "summary.md", "");
    const stub = `gh() {\n  printf '%s\\n' --- "$@" >> "$GH_LOG"\n  [ "$3" != "$FAILING" ]\n}\n`;
    await writeText(
      root,
      "close.sh",
      stub + ((await stepOf("close", "close")).run ?? ""),
    );
    const result = spawnSync(
      bash ?? "bash",
      [
        "--noprofile",
        "--norc",
        "-eo",
        "pipefail",
        slashed(join(root, "close.sh")),
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          GH_LOG: slashed(log),
          FAILING: failing,
          GITHUB_STEP_SUMMARY: slashed(summary),
          GITHUB_SERVER_URL: "https://github.com",
          GITHUB_REPOSITORY: "phmilk/reforged-ts",
          GITHUB_RUN_ID: "77",
          GH_TOKEN: "token",
          PULL_REQUEST: "40",
          ISSUES: issues,
        },
      },
    );
    const calls = (await readFile(log, "utf8"))
      .split("---\n")
      .filter(Boolean)
      .map((call) => call.trimEnd().split("\n"));
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      calls,
      summary: await readFile(summary, "utf8"),
    };
  }

  it.skipIf(bash === undefined)(
    "closes each issue as completed, with a comment linking the pull request",
    async () => {
      const result = await close("12 15");
      expect(result.status, result.output).toBe(0);
      const comment =
        'Closed by #40, merged into the Next branch, `next`: GitHub closes an issue from a pull request\'s closing keywords only when it merges into the default branch, so [next-close.yml](https://github.com/phmilk/reforged-ts/actions/runs/77) closes it. [docs/release.md, "Closing a Ticket delivered on `next`"](https://github.com/phmilk/reforged-ts/blob/master/docs/release.md#closing-a-ticket-delivered-on-next).';
      expect(result.calls).toEqual(
        ["12", "15"].map((issue) => [
          "issue",
          "close",
          issue,
          "--repo",
          "phmilk/reforged-ts",
          "--reason",
          "completed",
          "--comment",
          comment,
        ]),
      );
      expect(result.summary).toBe("- #12: closed.\n- #15: closed.\n");
    },
  );

  it.skipIf(bash === undefined)(
    "goes on past an issue it could not close, and fails",
    async () => {
      const result = await close("12 13 15", "13");
      expect(result.status).toBe(1);
      expect(result.calls.map((call) => call[2])).toEqual(["12", "13", "15"]);
      expect(result.summary).toBe(
        "- #12: closed.\n- #13: not closed (above).\n- #15: closed.\n",
      );
    },
  );

  it.skipIf(bash === undefined)(
    "refuses what is not an issue number, without calling gh on it",
    async () => {
      const result = await close("12 $(touch x) 1a");
      expect(result.status).toBe(1);
      expect(result.calls.map((call) => call[2])).toEqual(["12"]);
      expect(result.output).toContain("::error title=Not an issue number::");
    },
  );
});
