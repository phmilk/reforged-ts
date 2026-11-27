import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ENVIRONMENT } from "../src/github-app.js";
import { readWorkflow, type Step } from "./support/workflows.js";
import { tempDir, writeText } from "./support/workspace.js";

const FILE = "next-sync.yml";

const jobsOf = async () => (await readWorkflow(FILE)).workflow.jobs;

async function stepOf(job: string, id: string): Promise<Step> {
  const step = (await jobsOf())[job]?.steps?.find((each) => each.id === id);
  if (step === undefined) throw new Error(`No step ${id} in ${FILE}, ${job}`);
  return step;
}

describe("next-sync.yml", () => {
  it("runs on each push to master, one run at a time", async () => {
    const { workflow } = await readWorkflow(FILE);
    expect(workflow.on).toEqual({ push: { branches: ["master"] } });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency).toEqual({
      group: "next-sync",
      "cancel-in-progress": false,
    });
    expect(Object.keys(workflow.jobs)).toEqual(["detect", "merge"]);
  });

  it("looks for a branch next without the App, and merges only when there is one", async () => {
    const { detect, merge } = await jobsOf();
    expect(detect?.environment).toBeUndefined();
    expect(JSON.stringify(detect)).not.toContain("secrets.");
    expect(JSON.stringify(detect)).not.toContain("app-token");
    expect(merge?.needs).toBe("detect");
    expect(merge?.if).toBe("needs.detect.outputs.next == 'true'");
  });

  it("holds the App in the environment app, its key passed by name, and runs none of the checkout's code", async () => {
    const { merge } = await jobsOf();
    expect(merge?.environment).toBe(APP_ENVIRONMENT);
    const tokens = (merge?.steps ?? []).filter(
      (step) => step.uses === "./.github/actions/app-token",
    );
    expect(tokens.map((step) => step.with)).toEqual([
      {
        "client-id": "${{ vars.APP_CLIENT_ID }}",
        "private-key": "${{ secrets.APP_PRIVATE_KEY }}",
        "permission-contents": "write",
        "permission-pull-requests": "write",
        "permission-issues": "write",
      },
    ]);
    for (const step of merge?.steps ?? []) {
      expect(step.uses ?? "").not.toBe("./.github/actions/setup-workspace");
      expect(step.run ?? "").not.toContain("pnpm");
    }
  });

  it("opens the pull request master into next, with auto-merge by a merge commit when it merges cleanly", async () => {
    const { workflow } = await readWorkflow(FILE);
    expect(workflow.env).toMatchObject({
      BRANCH: "master-into-next",
      TITLE: "master into next",
    });
    const open = await stepOf("merge", "pull-request");
    expect(open.if).toBe("steps.branch.outputs.state != 'merged'");
    expect(open.env?.GH_TOKEN).toBe("${{ steps.app.outputs.token }}");
    const run = open.run ?? "";
    expect(run).toContain(
      'gh pr create --repo "$GITHUB_REPOSITORY" --base next --head "$BRANCH" --title "$TITLE"',
    );
    expect(run).toContain('if [ "$STATE" = clean ]; then');
    expect(run).toContain(
      'gh pr merge "$number" --repo "$GITHUB_REPOSITORY" --auto --merge',
    );
    expect(run).not.toContain("--squash");
  });

  it("opens, or comments on, one ready-for-agent issue when the merge conflicts", async () => {
    const issue = await stepOf("merge", "issue");
    expect(issue.if).toBe("steps.branch.outputs.state == 'conflicts'");
    expect(issue.env?.GH_TOKEN).toBe("${{ steps.app.outputs.token }}");
    const run = issue.run ?? "";
    expect(run).toContain("--state open --label ready-for-agent");
    expect(run).toContain('gh issue comment "$existing"');
    expect(run).toContain(
      'gh issue create --repo "$GITHUB_REPOSITORY" --title "$ISSUE_TITLE" --label ready-for-agent',
    );
  });
});

/**
 * Git Bash's bash on Windows, beside git (`bash` there may be WSL's); bash
 * elsewhere. Undefined when Git for Windows keeps none.
 */
function gitBash(): string | undefined {
  if (process.platform !== "win32") return "bash";
  const execPath = execFileSync("git", ["--exec-path"], {
    encoding: "utf8",
  }).trim();
  const bash = join(execPath, "..", "..", "..", "bin", "bash.exe");
  return existsSync(bash) ? bash : undefined;
}

const bash = gitBash();
const slashed = (path: string) => path.replaceAll("\\", "/");

const IDENTITY = {
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@t",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@t",
};

/**
 * A repository `origin.git` whose master holds `a.txt` and, when `next` is
 * set, whose branch next adds `b.txt`; `work` is a clone to commit from.
 */
async function repositories(next = true) {
  const root = await tempDir("next-sync");
  const run = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "core.autocrlf=false", ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...IDENTITY },
    }).trim();
  run(root, "init", "-q", "--bare", "-b", "master", "origin.git");
  run(root, "clone", "-q", "origin.git", "work");
  const work = join(root, "work");
  const git = (...args: string[]) => run(work, ...args);
  const commit = async (path: string, text: string, message: string) => {
    await writeText(work, path, text);
    git("add", "-A");
    git("commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  git("switch", "-q", "-c", "master");
  await commit("a.txt", "one\n", "base");
  git("push", "-q", "origin", "master");
  if (next) {
    git("switch", "-q", "-c", "next");
    await commit("b.txt", "next\n", "next work");
    git("push", "-q", "origin", "next");
    git("switch", "-q", "master");
  }
  const origin = (ref: string) =>
    run(join(root, "origin.git"), "rev-parse", "-q", "--verify", ref);
  const has = (ref: string) => {
    try {
      origin(ref);
      return true;
    } catch {
      return false;
    }
  };
  return { root, run, git, commit, origin, has };
}

/** Runs a step's script in `cwd` with `env`, as the runner would. */
async function runStep(
  step: Step,
  root: string,
  cwd: string,
  env: Record<string, string>,
) {
  const temp = join(root, "runner-temp");
  await writeText(temp, "keep", "");
  const output = join(root, "github-output");
  await writeText(root, "github-output", "");
  const script = join(root, `${step.id ?? "step"}.sh`);
  await writeText(root, `${step.id ?? "step"}.sh`, step.run ?? "");
  const result = spawnSync(
    bash ?? "bash",
    ["--noprofile", "--norc", "-eo", "pipefail", slashed(script)],
    {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        ...IDENTITY,
        RUNNER_TEMP: slashed(temp),
        GITHUB_OUTPUT: slashed(output),
        ...env,
      },
    },
  );
  const outputs = Object.fromEntries(
    (await readFile(output, "utf8"))
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1),
      ]),
  );
  const conflicts = async () =>
    (await readFile(join(temp, "conflicts.txt"), "utf8"))
      .split("\n")
      .filter(Boolean);
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    outputs,
    conflicts,
    temp,
  };
}

describe("the detect step of next-sync.yml", () => {
  async function detect(next: boolean) {
    const repos = await repositories(next);
    return runStep(await stepOf("detect", "next"), repos.root, repos.root, {
      GITHUB_SERVER_URL: slashed(repos.root),
      GITHUB_REPOSITORY: "origin",
    });
  }

  it.skipIf(bash === undefined)("finds no branch next", async () => {
    const result = await detect(false);
    expect(result.status, result.stderr).toBe(0);
    expect(result.outputs).toEqual({ exists: "false" });
  });

  it.skipIf(bash === undefined)("finds the branch next", async () => {
    const result = await detect(true);
    expect(result.status, result.stderr).toBe(0);
    expect(result.outputs).toEqual({ exists: "true" });
  });
});

describe("the branch step of next-sync.yml", () => {
  /**
   * The checkout of the run at master's tip, every branch fetched as the
   * checkout's `fetch-depth: 0` fetches them; then the step, with `open`
   * the number of the open pull request, or empty.
   */
  async function sync(
    repos: Awaited<ReturnType<typeof repositories>>,
    open = "",
  ) {
    repos.git("push", "-q", "origin", "master");
    const checkout = join(repos.root, `checkout-${String(Date.now())}`);
    repos.run(repos.root, "clone", "-q", "origin.git", checkout);
    const sha = repos.origin("refs/heads/master");
    repos.run(checkout, "switch", "-q", "--detach", sha);
    const result = await runStep(
      await stepOf("merge", "branch"),
      repos.root,
      checkout,
      {
        BRANCH: "master-into-next",
        OPEN: open,
        GITHUB_SHA: sha,
        APP_TOKEN: "token",
      },
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
    return { ...result, sha };
  }

  it.skipIf(bash === undefined)(
    "does nothing when next already holds master's commit",
    async () => {
      const repos = await repositories();
      const result = await sync(repos);
      expect(result.outputs).toEqual({ state: "merged" });
      expect(repos.has("refs/heads/master-into-next")).toBe(false);
    },
  );

  it.skipIf(bash === undefined)(
    "pushes the branch at master's commit when no pull request is open, and finds it merges cleanly",
    async () => {
      const repos = await repositories();
      await repos.commit("a.txt", "one\ntwo\n", "fix on master");
      const result = await sync(repos);
      expect(result.outputs).toEqual({
        state: "clean",
        with: "next",
        head: result.sha,
      });
      expect(repos.origin("refs/heads/master-into-next")).toBe(result.sha);
    },
  );

  it.skipIf(bash === undefined)(
    "starts a branch left without a pull request again at master's commit",
    async () => {
      const repos = await repositories();
      await repos.commit("a.txt", "one\ntwo\n", "fix on master");
      repos.git("push", "-q", "origin", "master:master-into-next");
      repos.git("switch", "-q", "-c", "stale", "origin/next");
      await repos.commit("c.txt", "stale\n", "stale");
      repos.git("push", "-q", "-f", "origin", "stale:master-into-next");
      repos.git("switch", "-q", "master");
      const result = await sync(repos);
      expect(result.outputs.state).toBe("clean");
      expect(repos.origin("refs/heads/master-into-next")).toBe(result.sha);
    },
  );

  it.skipIf(bash === undefined)(
    "names the files that conflict with next, the branch pushed",
    async () => {
      const repos = await repositories();
      repos.git("switch", "-q", "-c", "next-work", "origin/next");
      await repos.commit("a.txt", "one\nnext\n", "next edits a");
      repos.git("push", "-q", "origin", "next-work:next");
      repos.git("switch", "-q", "master");
      await repos.commit("a.txt", "one\nmaster\n", "master edits a");
      const result = await sync(repos);
      expect(result.outputs).toEqual({
        state: "conflicts",
        with: "next",
        head: result.sha,
      });
      expect(await result.conflicts()).toEqual(["a.txt"]);
      expect(repos.origin("refs/heads/master-into-next")).toBe(result.sha);
    },
  );

  it.skipIf(bash === undefined)(
    "merges master into the open pull request's branch, keeping an Agent's resolution",
    async () => {
      const repos = await repositories();
      await repos.commit("a.txt", "one\ntwo\n", "fix on master");
      repos.git("push", "-q", "origin", "master:master-into-next");
      // An Agent's resolution: next merged into the branch.
      repos.git("switch", "-q", "-c", "resolution", "master");
      repos.git("merge", "-q", "--no-edit", "origin/next");
      const resolution = repos.git("rev-parse", "HEAD");
      repos.git("push", "-q", "origin", "resolution:master-into-next");
      repos.git("switch", "-q", "master");
      await repos.commit("d.txt", "later\n", "later fix on master");

      const result = await sync(repos, "7");
      const head = repos.origin("refs/heads/master-into-next");
      expect(result.outputs).toEqual({ state: "clean", with: "next", head });
      for (const ancestor of [resolution, result.sha]) {
        expect(() =>
          repos.run(
            join(repos.root, "origin.git"),
            "merge-base",
            "--is-ancestor",
            ancestor,
            head,
          ),
        ).not.toThrow();
      }
    },
  );

  it.skipIf(bash === undefined)(
    "fast-forwards the open pull request's branch to master's commit",
    async () => {
      const repos = await repositories();
      await repos.commit("a.txt", "one\ntwo\n", "fix on master");
      repos.git("push", "-q", "origin", "master:master-into-next");
      await repos.commit("d.txt", "later\n", "later fix on master");
      const result = await sync(repos, "7");
      expect(result.outputs.state).toBe("clean");
      expect(repos.origin("refs/heads/master-into-next")).toBe(result.sha);
    },
  );

  it.skipIf(bash === undefined)(
    "names the files where master conflicts with the open pull request's branch, and pushes nothing",
    async () => {
      const repos = await repositories();
      // The branch holds a resolution that edits a.txt.
      repos.git("switch", "-q", "-c", "resolution", "origin/master");
      await repos.commit("a.txt", "one\nresolved\n", "resolution");
      const resolution = repos.git("rev-parse", "HEAD");
      repos.git("push", "-q", "origin", "resolution:master-into-next");
      repos.git("switch", "-q", "master");
      await repos.commit("a.txt", "one\nmaster\n", "master edits a");

      const result = await sync(repos, "7");
      expect(result.outputs).toEqual({
        state: "conflicts",
        with: "master",
        head: resolution,
      });
      expect(await result.conflicts()).toEqual(["a.txt"]);
      expect(repos.origin("refs/heads/master-into-next")).toBe(resolution);
    },
  );
});

describe("the conflict report of next-sync.yml", () => {
  async function report(conflictsWith: string) {
    const root = await tempDir("next-sync-report");
    await writeText(
      join(root, "runner-temp"),
      "conflicts.txt",
      "a.txt\nsrc/b c.ts\n",
    );
    const result = await runStep(await stepOf("merge", "report"), root, root, {
      NUMBER: "7",
      WITH: conflictsWith,
      BRANCH: "master-into-next",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: "phmilk/reforged-ts",
    });
    expect(result.status, result.stderr).toBe(0);
    return readFile(join(result.temp, "conflict.md"), "utf8");
  }

  it.skipIf(bash === undefined)(
    "names each conflicting file, the pull request and how to resolve it",
    async () => {
      const body = await report("next");
      expect(body).toContain("- `a.txt`\n- `src/b c.ts`\n");
      expect(body).toContain("#7");
      expect(body).toContain("`master-into-next` into `next`");
      expect(body).toContain(
        "git switch -C master-into-next origin/master-into-next",
      );
      expect(body).toContain("git merge origin/master");
      expect(body).toContain("git merge origin/next");
      expect(body).toContain("gh pr merge 7 --auto --merge");
      expect(body).toContain(
        "https://github.com/phmilk/reforged-ts/blob/master/docs/release.md#release-channels",
      );
    },
  );

  it.skipIf(bash === undefined)(
    "says when master conflicts with the branch's resolution",
    async () => {
      const body = await report("master");
      expect(body).toContain("`master` into `master-into-next`");
    },
  );
});
