import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type UpdateReport } from "../src/cli/skills-update.js";
import type { Command } from "../src/process.js";
import {
  INSTALL_COMMAND,
  INSTALL_ENV,
  lockChanges,
  readLock,
  staleVariants,
  updatePullRequest,
  UPSTREAM_SKILLS,
  type LockSkill,
} from "../src/skills-update.js";
import { repositoryRoot } from "../src/workspace.js";
import { readWorkflow } from "./support/workflows.js";
import { tempDir, writeText } from "./support/workspace.js";

const skill = (
  computedHash: string,
  folder = "engineering/tdd",
): LockSkill => ({
  computedHash,
  skillPath: `skills/${folder}/SKILL.md`,
});

const lockText = (skills: Record<string, LockSkill>) =>
  `${JSON.stringify({ version: 1, skills: Object.fromEntries(Object.entries(skills).map(([name, entry]) => [name, { source: "mattpocock/skills", sourceType: "github", ...entry }])) }, null, 2)}\n`;

const variantText = (upstream: string, hash: string) =>
  `---\nname: write-spec\ndescription: A variant.\nmetadata:\n  upstream: ${upstream}\n  upstream-hash: ${hash}\n---\n\n# Write a Spec\n`;

describe("the install command", () => {
  it("is the one the setup doc writes", async () => {
    const doc = await readFile(
      join(repositoryRoot, "docs/agents/development-loop.md"),
      "utf8",
    );
    const section = doc.slice(
      doc.indexOf("## Installing and updating the Upstream skills"),
    );
    const block = /```sh\n([\s\S]*?)\n```/.exec(section)?.[1];
    expect(block).toBe(INSTALL_COMMAND);
  });

  it("installs every skill the lock names, copied, for Claude Code alone, keeping LF", async () => {
    const lock = readLock(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    );
    expect(UPSTREAM_SKILLS.toSorted()).toEqual(Object.keys(lock).sort());
    expect(INSTALL_COMMAND).toContain(" -a claude-code --copy -y -s ");
    expect(INSTALL_ENV).toMatchObject({
      GIT_CONFIG_KEY_0: "core.autocrlf",
      GIT_CONFIG_VALUE_0: "false",
    });
  });
});

describe("lockChanges", () => {
  it("names each skill added, updated or removed, in code-point order", () => {
    expect(
      lockChanges(
        {
          tdd: skill("a"),
          pr: skill("b", "engineering/pr"),
          teach: skill("c"),
        },
        {
          tdd: skill("a2"),
          pr: skill("b", "engineering/pr"),
          wizard: skill("d", "productivity/wizard"),
        },
      ),
    ).toEqual([
      {
        name: "tdd",
        change: "updated",
        skillPath: "skills/engineering/tdd/SKILL.md",
      },
      {
        name: "teach",
        change: "removed",
        skillPath: "skills/engineering/tdd/SKILL.md",
      },
      {
        name: "wizard",
        change: "added",
        skillPath: "skills/productivity/wizard/SKILL.md",
      },
    ]);
  });

  it("is empty when nothing moved", () => {
    expect(lockChanges({ tdd: skill("a") }, { tdd: skill("a") })).toEqual([]);
  });
});

describe("readLock", () => {
  it("refuses an entry without its hash", () => {
    expect(() =>
      readLock(JSON.stringify({ skills: { tdd: { skillPath: "x" } } })),
    ).toThrow("skills-lock.json: tdd has no computedHash or skillPath.");
  });
});

describe("staleVariants", () => {
  it("names a variant recording another hash than the lock's, or a skill it no longer names", async () => {
    const root = await tempDir("variants");
    await writeText(root, ".claude/skills/to-spec/SKILL.md", "upstream\n");
    await writeText(
      root,
      ".claude/skills/write-spec/SKILL.md",
      variantText("to-spec", "old"),
    );
    await writeText(
      root,
      ".claude/skills/split-spec/SKILL.md",
      variantText("gone", "x"),
    );
    await writeText(
      root,
      ".claude/skills/fresh/SKILL.md",
      variantText("to-spec", "new"),
    );
    await writeText(
      root,
      ".claude/skills/add-wrapper/SKILL.md",
      "---\nname: add-wrapper\n---\n",
    );

    expect(await staleVariants(root, { "to-spec": skill("new") })).toEqual([
      { folder: "split-spec", upstream: "gone" },
      { folder: "write-spec", upstream: "to-spec" },
    ]);
  });

  it("names none in this repository, whose conventions test holds every variant to the lock", async () => {
    const lock = readLock(
      await readFile(join(repositoryRoot, "skills-lock.json"), "utf8"),
    );
    expect(await staleVariants(repositoryRoot, lock)).toEqual([]);
  });
});

describe("updatePullRequest", () => {
  it("lists what moved with its upstream history, and the variants to review", () => {
    const { title, body } = updatePullRequest(
      [
        {
          name: "to-spec",
          change: "updated",
          skillPath: "skills/engineering/to-spec/SKILL.md",
        },
      ],
      [{ folder: "write-spec", upstream: "to-spec" }],
      "https://run",
    );
    expect(title).toBe(
      "chore(skills): the Upstream skills at mattpocock/skills's current files",
    );
    expect(body).toContain(
      "- `to-spec`: updated ([its history](https://github.com/mattpocock/skills/commits/main/skills/engineering/to-spec))",
    );
    expect(body).toContain("- [ ] `write-spec`, from `to-spec`");
    expect(body).toContain("https://run");
  });

  it("says when no variant needs a review", () => {
    expect(updatePullRequest([], []).body).toContain(
      "No Skill variant is built from an Upstream skill this update changes.",
    );
  });
});

describe("skills:update", () => {
  /** A repository whose install, when run, writes `after` as the lock. */
  async function repository(after?: Record<string, LockSkill>) {
    const root = await tempDir("skills-update");
    await writeText(
      root,
      "skills-lock.json",
      lockText({ "to-spec": skill("old") }),
    );
    await writeText(root, ".claude/skills/to-spec/SKILL.md", "upstream\n");
    await writeText(
      root,
      ".claude/skills/write-spec/SKILL.md",
      variantText("to-spec", "old"),
    );
    const commands: Command[] = [];
    const run = async (command: Command) => {
      commands.push(command);
      if (after !== undefined)
        await writeText(root, "skills-lock.json", lockText(after));
      return 0;
    };
    return { root, commands, run };
  }

  async function cli(
    args: string[],
    context: { root: string; run: (command: Command) => Promise<number> },
  ) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      context,
    );
    return { status, stdout, stderr };
  }

  it("runs the install from the root with npx, keeping LF", async () => {
    const repo = await repository();
    await cli([], repo);
    expect(repo.commands).toEqual([
      {
        command: "npx",
        args: ["--yes", ...INSTALL_COMMAND.split(" ").slice(1)],
        cwd: repo.root,
        env: INSTALL_ENV,
      },
    ]);
  });

  it("reports nothing moved when the lock is unchanged", async () => {
    const repo = await repository();
    const report = join(await tempDir("report"), "update.json");
    expect(await cli(["--report", report], repo)).toEqual({
      status: 0,
      stdout: "Upstream has not moved: skills-lock.json is unchanged.\n",
      stderr: "",
    });
    const written = JSON.parse(await readFile(report, "utf8")) as UpdateReport;
    expect(written).toMatchObject({ moved: false, changes: [], stale: [] });
  });

  it("reports what moved and the variant to review", async () => {
    const repo = await repository({
      "to-spec": skill("new", "engineering/to-spec"),
    });
    const report = join(await tempDir("report"), "update.json");
    const result = await cli(
      ["--report", report, "--run-url", "https://run"],
      repo,
    );

    expect(result).toEqual({
      status: 0,
      stdout:
        "Upstream moved:\n  to-spec: updated\n" +
        "Skill variant to review: write-spec, built from to-spec at another version than the lock's.\n",
      stderr: "",
    });
    const written = JSON.parse(await readFile(report, "utf8")) as UpdateReport;
    expect(written.moved).toBe(true);
    expect(written.stale).toEqual([
      { folder: "write-spec", upstream: "to-spec" },
    ]);
    expect(written.pullRequest.body).toContain("https://run");
  });

  it("fails when the install fails", async () => {
    const repo = await repository();
    const result = await cli([], {
      root: repo.root,
      run: () => Promise.resolve(1),
    });
    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: "npx skills@1.7.4 add exited with 1.\n",
    });
  });

  it("rejects an unknown option", async () => {
    const repo = await repository();
    expect((await cli(["--dry-run"], repo)).status).toBe(2);
  });
});

describe("skills-update.yml", () => {
  it("runs weekly and by hand, one run at a time", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    expect(Object.keys(workflow.on)).toEqual(["schedule", "workflow_dispatch"]);
    expect(workflow.concurrency).toEqual({
      group: "skills-update",
      "cancel-in-progress": false,
    });
    expect(Object.keys(workflow.jobs)).toEqual([
      "update",
      "pull-request",
      "template",
    ]);
  });

  it("installs without a token, and commits the update without running the checkout's code", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    const { update, "pull-request": pullRequest } = workflow.jobs;
    expect(update?.environment).toBeUndefined();
    expect(JSON.stringify(update)).not.toContain("secrets.");
    expect(
      update?.steps?.some((step) =>
        step.run?.includes("pnpm --silent skills:update"),
      ),
    ).toBe(true);

    expect(pullRequest?.environment).toBe("app");
    for (const step of pullRequest?.steps ?? []) {
      expect(step.uses ?? "").not.toBe("./.github/actions/setup-workspace");
      expect(step.run ?? "").not.toContain("pnpm");
    }
  });

  it("opens the Template's pull request with a token scoped to the Template", async () => {
    const { workflow } = await readWorkflow("skills-update.yml");
    const { template } = workflow.jobs;
    expect(template?.environment).toBe("app");
    const tokens = (template?.steps ?? []).filter(
      (step) => step.uses === "./.github/actions/app-token",
    );
    expect(tokens.map((step) => step.with)).toEqual([
      expect.objectContaining({
        repository: "${{ env.TEMPLATE }}",
        "permission-contents": "write",
        "permission-pull-requests": "write",
      }),
    ]);
  });
});
