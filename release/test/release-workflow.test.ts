import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_BRANCHES } from "../src/github-app.js";
import { repositoryRoot } from "../src/workspace.js";
import { gitBash } from "./support/bash.js";
import { readWorkflow, type Step } from "./support/workflows.js";
import { tempDir, writeText } from "./support/workspace.js";

// release.yml runs from the two branches of a Release channel, master and
// next (docs/release.md, "Release channels"): its trigger, the select job's
// refusal of a release from any other ref, and the environment app the
// repository-setup wizard admits both in.

const FILE = "release.yml";

async function stepOf(id: string): Promise<Step> {
  const { workflow } = await readWorkflow(FILE);
  const step = workflow.jobs.select?.steps?.find((each) => each.id === id);
  if (step === undefined) throw new Error(`No step ${id} in ${FILE}, select`);
  return step;
}

const bash = gitBash();
const slashed = (path: string) => path.replaceAll("\\", "/");

/** Runs a step's script with `env`, as the runner would. */
async function runStep(step: Step, env: Record<string, string>) {
  const root = await tempDir("release-workflow");
  await writeText(root, "github-output", "");
  await writeText(root, "step.sh", step.run ?? "");
  const result = spawnSync(
    bash ?? "bash",
    [
      "--noprofile",
      "--norc",
      "-eo",
      "pipefail",
      slashed(join(root, "step.sh")),
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_OUTPUT: slashed(join(root, "github-output")),
        ...env,
      },
    },
  );
  const outputs: Record<string, string> = Object.fromEntries(
    (await readFile(join(root, "github-output"), "utf8"))
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line): [string, string] => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1),
      ]),
  );
  return { status: result.status, stdout: result.stdout, outputs };
}

describe("release.yml", () => {
  it("runs on each push to master and to next, the branches the environment app admits", async () => {
    const { workflow } = await readWorkflow(FILE);
    // The two branches of a Release channel, and the environment's list,
    // which the wizard test below holds to the wizard's.
    expect(workflow.on.push).toEqual({ branches: ["master", "next"] });
    expect(workflow.on.push).toEqual({ branches: APP_BRANCHES });
  });

  describe("the select job", () => {
    const dryRun = async (ref: string, dry: boolean) =>
      runStep(await stepOf("dry-run"), {
        GITHUB_REF: ref,
        DRY_RUN: String(dry),
      });

    it.skipIf(bash === undefined)(
      "releases from master and from next",
      async () => {
        for (const ref of ["refs/heads/master", "refs/heads/next"]) {
          const result = await dryRun(ref, false);
          expect(result.status, ref).toBe(0);
          expect(result.outputs, ref).toEqual({ "dry-run": "false" });
        }
      },
    );

    it.skipIf(bash === undefined)(
      "refuses a release from any other ref, naming both branches, and rehearses it",
      async () => {
        const refused = await dryRun("refs/heads/feature/1068", false);
        expect(refused.status).toBe(1);
        expect(refused.stdout).toContain(
          "::error title=Not a release branch::A release runs from master or next only; this run is on refs/heads/feature/1068.",
        );
        const rehearsed = await dryRun("refs/heads/feature/1068", true);
        expect(rehearsed.status).toBe(0);
        expect(rehearsed.outputs).toEqual({ "dry-run": "true" });
      },
    );

    it.skipIf(bash === undefined)(
      "names the branch of the run's Release channel, master for a rehearsal of another branch",
      async () => {
        const step = await stepOf("branch");
        for (const [name, branch] of [
          ["master", "master"],
          ["next", "next"],
          ["feature/1068", "master"],
        ] as const) {
          const result = await runStep(step, { GITHUB_REF_NAME: name });
          expect(result.outputs, name).toEqual({ branch });
        }
      },
    );
  });
});

describe("ci.yml", () => {
  it("skips release:check-changeset on the Version Packages pull request of this repository's master and next alone", async () => {
    const { workflow } = await readWorkflow("ci.yml");
    const step = Object.values(workflow.jobs)
      .flatMap((job) => job?.steps ?? [])
      .find((each) => each.name === "release:check-changeset");
    expect(step?.if?.replace(/\s+/g, " ")).toBe(
      "matrix.os == 'ubuntu' && github.event_name == 'pull_request' && " +
        "!((github.head_ref == 'changeset-release/master' || github.head_ref == 'changeset-release/next') && " +
        "github.event.pull_request.head.repo.full_name == github.repository) && " +
        "!cancelled() && steps.install.outcome == 'success'",
    );
  });
});

describe("the repository-setup wizard", () => {
  it("admits in the environment app the branches the release runs from", async () => {
    const wizard = await readFile(
      join(repositoryRoot, "release", "repo-setup.sh"),
      "utf8",
    );
    const line = /^readonly APP_BRANCHES="([^"]*)"$/m.exec(wizard);
    expect(line?.[1]?.split(" ")).toEqual([...APP_BRANCHES]);
    // Every policy it writes or checks for the environment app is that list.
    expect(wizard).not.toMatch(/\$APP_BRANCH\b/);
    expect(wizard).toContain(
      'make_environment "$APP_ENVIRONMENT" "$APP_BRANCHES"',
    );
  });
});
